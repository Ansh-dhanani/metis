import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException

# Check if running on Vercel (serverless)
IS_VERCEL = os.getenv('VERCEL') == '1' or os.getenv('VERCEL_ENV') is not None

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

app = Flask(__name__)
app.url_map.strict_slashes = False  # Disable strict trailing slash enforcement

# Global error handler to always return JSON for HTTP errors
@app.errorhandler(HTTPException)
def handle_http_exception(e):
    response = e.get_response()
    # Replace the body with JSON
    response.data = jsonify({
        "error": e.description or "An unexpected error occurred. Please try again or contact support."
    }).data
    response.content_type = "application/json"
    return response, e.code


# Debug: log every incoming request (method, path, remote addr)
@app.before_request
def log_request_info():
    try:
        print(f"[INCOMING] {request.method} {request.path} from {request.remote_addr}")
    except Exception:
        pass

# Production configuration
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production'

if IS_PRODUCTION and not IS_VERCEL:
    try:
        from config.production import configure_production
        configure_production(app)
    except Exception:
        pass

# CORS Configuration
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
production_url = os.getenv('PRODUCTION_FRONTEND_URL', 'https://metis-hire.vercel.app')

# More permissive CORS for development
if IS_PRODUCTION:
    CORS(app, resources={
        r"/api/*": {
            "origins": [
                frontend_url,
                production_url,
                "https://metis-hire.vercel.app",
                "https://*.vercel.app"
            ],
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
else:
    # Development: Allow all origins
    CORS(app, 
         origins="*",
         methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=False)

# Initialize SocketIO only when NOT on Vercel (serverless doesn't support WebSockets)
socketio = None
if not IS_VERCEL:
    from flask_socketio import SocketIO
    socketio = SocketIO(
        app, 
        cors_allowed_origins=[frontend_url, production_url, "https://*.vercel.app"],
        async_mode='threading'
    )

# MongoDB Configuration (with error handling)
mongodb_status = {
    "connected": False,
    "error": None,
    "database": None
}

try:
    MONGO_URI = os.getenv("MONGO_URI", os.getenv("MONGO_URL", os.getenv("DATABASE_URL")))
    if MONGO_URI:
        # Configure MongoDB client with SSL/TLS settings
        import ssl
        
        # Log sanitized URI (without password)
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
        # Test connection immediately
        client.admin.command('ping')
        db = client['metis_db']
        mongodb_status["connected"] = True
        mongodb_status["database"] = "metis_db"
        print("✅ MongoDB connected successfully")
        print(f"📊 MongoDB database: {db.name}")
    else:
        print("⚠️ WARNING: No MONGO_URI, MONGO_URL, or DATABASE_URL found in environment")
        print("💡 Set MONGO_URI in Railway variables or .env file")
        mongodb_status["error"] = "No MONGO_URI environment variable"
        client = None
        db = None
except Exception as e:
    error_msg = str(e)
    print(f"❌ MongoDB connection error: {error_msg}")
    
    # Provide helpful error messages
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

# Register blueprints with error handling
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

# Initialize SocketIO handlers only when not on Vercel
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
        "mongodb": "connected" if mongodb_status["connected"] else "disconnected",
        "environment": os.getenv("FLASK_ENV", "development")
    }
    
    # Add more details if disconnected (for debugging)
    if not mongodb_status["connected"]:
        response["mongodb_error"] = mongodb_status["error"]
        response["database"] = None
        response["troubleshooting"] = {
            "step1": "Check Railway Variables has MONGO_URI set",
            "step2": "MongoDB Atlas → Network Access → Add 0.0.0.0/0",
            "step3": "Ensure URI includes database name: /metis_db?...",
            "step4": "Check Railway deployment logs for specific error"
        }
    else:
        response["database"] = mongodb_status["database"]
    
    return response


@app.route('/debug/routes')
def debug_routes():
    """Return a list of registered routes for debugging."""
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
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv('FLASK_ENV') != 'production'
    
    if DEBUG:
        print(f"🚀 Development server starting on http://0.0.0.0:{PORT}")
        print(f"📡 WebSocket server ready for live interviews")
    else:
        app.logger.info(f"Production server starting on port {PORT}")
    
    if socketio:
        socketio.run(app, host='0.0.0.0', port=PORT, debug=DEBUG, allow_unsafe_werkzeug=True)
    else:
        app.run(host='0.0.0.0', port=PORT, debug=DEBUG)
