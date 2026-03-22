"""
Metis Hire - Backend Application
Flask application with SocketIO for real-time AI interviews.
"""

# ── Fix Windows console encoding (must be before any print) ──────────────────
import sys
import io
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from datetime import datetime
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)
if os.path.exists(os.path.join(os.path.dirname(__file__), '.env.local')):
    load_dotenv(os.path.join(os.path.dirname(__file__), '.env.local'), override=True)

app = Flask(__name__)
app.url_map.strict_slashes = False  # Disable strict trailing slash enforcement

# Detect environment
env = os.getenv('FLASK_ENV', 'development')
IS_PRODUCTION = env == 'production'
IS_VERCEL = os.getenv('VERCEL') == '1' or os.getenv('VERCEL_ENV') is not None

print(f"[APP] Environment: {env.upper()}")
print(f"[APP] Root directory: {os.path.abspath(os.path.dirname(__file__))}")

# Global error handler to always return JSON for HTTP errors
@app.errorhandler(HTTPException)
def handle_http_exception(e):
    response = e.get_response()
    response.data = jsonify({
        "error": e.description or "An unexpected error occurred. Please try again or contact support."
    }).data
    response.content_type = "application/json"
    return response, e.code

# Catch-all for non-HTTP exceptions
@app.errorhandler(Exception)
def handle_exception(e):
    if isinstance(e, HTTPException):
        return e

    print(f"[ERROR] UNCAUGHT: {str(e)}")
    import traceback
    traceback.print_exc()
    return jsonify({
        "error": f"Internal Server Error: {str(e)}",
        "type": type(e).__name__
    }), 500


@app.before_request
def log_request():
    print(f"[REQ] {request.method} {request.path}")


if IS_PRODUCTION and not IS_VERCEL:
    try:
        from config.production import configure_production
        configure_production(app)
        print("[APP] Production configuration applied (Security headers & Rate limiting)")
    except Exception as e:
        print(f"[WARN] Error applying production config: {e}")

# ── CORS Configuration ────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://metis-hire-1.onrender.com")

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://metis-hire-1.onrender.com",
    FRONTEND_URL,  # picks up env var dynamically
]

# Remove duplicates
allowed_origins = list(set(allowed_origins))

print(f"[CORS] Allowed origins: {allowed_origins}")

CORS(app,
     origins=allowed_origins,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Handle preflight OPTIONS requests explicitly
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        origin = request.headers.get("Origin", "")
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

# ─────────────────────────────────────────────────────────────

# Force clear HSTS for local development
@app.after_request
def clear_hsts(response):
    if not IS_PRODUCTION:
        response.headers['Strict-Transport-Security'] = 'max-age=0'
    return response

# Initialize SocketIO (Needed for live interviews)
socketio = None
try:
    from flask_socketio import SocketIO
    # Use threading mode — stable on Windows (eventlet is deprecated)
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        async_mode='threading',
        logger=False,
        engineio_logger=False,
        ping_timeout=120,
        ping_interval=25,
        allow_upgrades=True
    )
    print("[SOCKETIO] Initialized successfully with threading mode")
except Exception as e:
    print(f"[WARN] SocketIO initialization failed: {e}")
    import traceback
    traceback.print_exc()
    print("[WARN] Live interviews will not be available")


# MongoDB Configuration (with error handling)
mongodb_status = {
    "connected": False,
    "error": None,
    "database": None
}

db = None  # Initialize db to None globally

try:
    MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGO_URL", os.getenv("DATABASE_URL")))
    if MONGO_URI:
        sanitized_uri = MONGO_URI.split('@')[1] if '@' in MONGO_URI else "URI not properly formatted"
        print(f"[DB] Attempting MongoDB connection to: ...@{sanitized_uri}")

        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            tls=True,
            tlsAllowInvalidCertificates=False
        )
        client.admin.command('ping')
        db = client['metis_db']
        mongodb_status["connected"] = True
        mongodb_status["database"] = "metis_db"
        print("[DB] MongoDB connected successfully")
        print(f"[DB] Database: {db.name}")
    else:
        print("[WARN] No MONGO_URI, MONGO_URL, or DATABASE_URL found in environment")
        mongodb_status["error"] = "No MONGO_URI environment variable"
        client = None
        db = None
except Exception as e:
    error_msg = str(e)
    print(f"[ERROR] MongoDB connection error: {error_msg}")

    if "ServerSelectionTimeoutError" in error_msg or "timed out" in error_msg.lower():
        print("[TIP] Add 0.0.0.0/0 to MongoDB Atlas Network Access allowlist")
        mongodb_status["error"] = "Connection timeout - Check IP allowlist"
    elif "Authentication failed" in error_msg or "auth" in error_msg.lower():
        print("[TIP] Check MongoDB username/password in URI")
        mongodb_status["error"] = "Authentication failed - Check credentials"
    elif "SSL" in error_msg or "TLS" in error_msg:
        print("[TIP] Ensure URI has tls=true parameter")
        mongodb_status["error"] = "SSL/TLS error - Check connection parameters"
    else:
        mongodb_status["error"] = error_msg

    client = None
    db = None


from routes.jobs import jobs_bp
from routes.assessments import assessments_bp
from routes.rankings import rankings_bp
from routes.interview import interview_bp
from routes.users import users_bp
from routes.applications import applications_bp
from routes.evaluation import evaluation_bp
from routes.advanced_ranking import advanced_ranking_bp

try:
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(assessments_bp, url_prefix='/api/assessments')
    app.register_blueprint(rankings_bp, url_prefix='/api/rankings')
    app.register_blueprint(interview_bp, url_prefix='/api/interview')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')
    app.register_blueprint(evaluation_bp, url_prefix='/api/evaluation')
    app.register_blueprint(advanced_ranking_bp, url_prefix='/api/advanced-ranking')
    print("[APP] All blueprints registered successfully")
except Exception as e:
    print(f"[ERROR] Error registering blueprints: {e}")
    import traceback
    traceback.print_exc()

if socketio is not None:
    try:
        from routes.live_interview import live_interview_bp, init_socketio
        app.register_blueprint(live_interview_bp, url_prefix='/api/live-interview')
        init_socketio(socketio)
        print("[SOCKETIO] Live Interview routes and SocketIO handlers registered")
    except Exception as e:
        print(f"[WARN] Error initializing live interview: {e}")
        import traceback
        traceback.print_exc()
else:
    print("[WARN] SocketIO not available - live interviews disabled")

@app.route("/")
def hello_world():
    response = {
        "status": "ok",
        "message": "Metis API is running",
        "version": "1.0.6",
        "timestamp": datetime.now().isoformat(),
        "env": env.upper(),
        "mongodb": "connected" if mongodb_status["connected"] else "disconnected",
        "socketio": "enabled" if socketio is not None else "disabled",
    }
    return jsonify(response)


@app.route('/debug/routes')
def debug_routes():
    rules = []
    for rule in app.url_map.iter_rules():
        rules.append({
            'rule': str(rule),
            'endpoint': rule.endpoint,
            'methods': sorted(list(rule.methods))
        })
    return jsonify({'routes': rules}), 200

@app.route("/health")
def health_check():
    health = {
        "status": "healthy" if mongodb_status["connected"] else "degraded",
        "mongodb": "connected" if mongodb_status["connected"] else "disconnected",
        "socketio": "enabled" if socketio is not None else "disabled",
        "timestamp": datetime.now().isoformat()
    }
    status_code = 200 if mongodb_status["connected"] else 503
    return jsonify(health), status_code

if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 5000))
    print(f"[APP] Starting server at http://localhost:{PORT}")

    if socketio is not None:
        socketio.run(
            app,
            host='0.0.0.0',
            port=PORT,
            debug=False,
            use_reloader=False,
            log_output=True,
            allow_unsafe_werkzeug=True
        )
    else:
        app.run(host='0.0.0.0', port=PORT, debug=False, use_reloader=False)