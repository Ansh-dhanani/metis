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

print(f"🛠️  Environment: {env.upper()}")
print(f"📁 Root directory: {os.path.abspath(os.path.dirname(__file__))}")

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

    print(f"🔥 UNCAUGHT ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    return jsonify({
        "error": f"Internal Server Error: {str(e)}",
        "type": type(e).__name__
    }), 500


@app.before_request
def log_request():
    print(f"🚀 {request.method} {request.path}")


if IS_PRODUCTION and not IS_VERCEL:
    try:
        from config.production import configure_production
        configure_production(app)
        print("🔒 Production configuration applied (Security headers & Rate limiting)")
    except Exception as e:
        print(f"⚠️ Error applying production config: {e}")

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

print(f"🌐 Allowed CORS origins: {allowed_origins}")

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
if not IS_VERCEL:
    try:
        from flask_socketio import SocketIO
        socketio = SocketIO(
            app,
            cors_allowed_origins=allowed_origins,
            async_mode='threading'
        )
    except Exception as e:
        print(f"⚠️ SocketIO initialization failed: {e}")


# MongoDB Configuration (with error handling)
mongodb_status = {
    "connected": False,
    "error": None,
    "database": None
}

try:
    MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGO_URL", os.getenv("DATABASE_URL")))
    if MONGO_URI:
        import ssl

        sanitized_uri = MONGO_URI.split('@')[1] if '@' in MONGO_URI else "URI not properly formatted"
        print(f"🔌 Attempting MongoDB connection to: ...@{sanitized_uri}")

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
        print("✅ MongoDB connected successfully")
        print(f"📊 MongoDB database: {db.name}")
    else:
        print("⚠️ WARNING: No MONGO_URI, MONGO_URL, or DATABASE_URL found in environment")
        mongodb_status["error"] = "No MONGO_URI environment variable"
        client = None
        db = None
except Exception as e:
    error_msg = str(e)
    print(f"❌ MongoDB connection error: {error_msg}")

    if "ServerSelectionTimeoutError" in error_msg or "timed out" in error_msg.lower():
        print("💡 Tip: Add 0.0.0.0/0 to MongoDB Atlas Network Access allowlist")
        mongodb_status["error"] = "Connection timeout - Check IP allowlist"
    elif "Authentication failed" in error_msg or "auth" in error_msg.lower():
        print("💡 Tip: Check MongoDB username/password in URI")
        mongodb_status["error"] = "Authentication failed - Check credentials"
    elif "SSL" in error_msg or "TLS" in error_msg:
        print("💡 Tip: Ensure URI has tls=true parameter")
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
except Exception as e:
    print(f"Error registering blueprints: {e}")

if not IS_VERCEL and socketio is not None:
    try:
        from routes.live_interview import live_interview_bp, init_socketio
        app.register_blueprint(live_interview_bp, url_prefix='/api/live-interview')
        init_socketio(socketio)
    except Exception as e:
        print(f"Error initializing SocketIO: {e}")

@app.route("/")
def hello_world():
    response = {
        "status": "ok",
        "message": "Metis API is running",
        "version": "1.0.6",
        "timestamp": "2024-02-17 21:35:00",
        "env": env.upper(),
        "mongodb": "connected" if mongodb_status["connected"] else "disconnected",
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
        "timestamp": os.popen('date').read().strip() if os.name != 'nt' else "N/A"
    }
    status_code = 200 if mongodb_status["connected"] else 503
    return health, status_code

if __name__ == "__main__":
    PORT = 5000
    DEBUG = True
    print(f"🚀 NUCLEAR START: http://localhost:{PORT}")

    if socketio:
        socketio.run(app, host='0.0.0.0', port=PORT, debug=DEBUG, allow_unsafe_werkzeug=True)
    else:
        app.run(host='0.0.0.0', port=PORT, debug=DEBUG)