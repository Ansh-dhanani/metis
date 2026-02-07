import os
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

app = Flask(__name__)
app.url_map.strict_slashes = False  # Disable strict trailing slash enforcement

# Production configuration
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production'

if IS_PRODUCTION:
    from config.production import configure_production
    configure_production(app)

# CORS Configuration
# Allow requests from frontend (development and production)
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
production_url = os.getenv('PRODUCTION_FRONTEND_URL', 'https://metis.vercel.app')

CORS(app, resources={
    r"/api/*": {
        "origins": [
            frontend_url,
            production_url,
            "https://metis-hire.vercel.app",
            "https://*.vercel.app"  # Vercel preview deployments
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Initialize SocketIO for live interviews
socketio = SocketIO(
    app, 
    cors_allowed_origins=[frontend_url, production_url, "https://*.vercel.app"],
    async_mode='eventlet'
)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))
client = MongoClient(MONGO_URI)
db = client['flask_db']  # Use flask_db as database name


from routes.jobs import jobs_bp
from routes.assessments import assessments_bp
from routes.rankings import rankings_bp
from routes.interview import interview_bp
from routes.users import users_bp
from routes.applications import applications_bp
from routes.evaluation import evaluation_bp
from routes.advanced_ranking import advanced_ranking_bp
from routes.live_interview import live_interview_bp, init_socketio

# Register blueprints
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(assessments_bp, url_prefix='/api/assessments')
app.register_blueprint(rankings_bp, url_prefix='/api/rankings')
app.register_blueprint(interview_bp, url_prefix='/api/interview')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(applications_bp, url_prefix='/api/applications')
app.register_blueprint(evaluation_bp, url_prefix='/api/evaluation')
app.register_blueprint(advanced_ranking_bp, url_prefix='/api/advanced-ranking')
app.register_blueprint(live_interview_bp, url_prefix='/api/live-interview')

# Initialize SocketIO handlers
init_socketio(socketio)

@app.route("/")
def hello_world():
    try:
        # Ping the database to check connection
        client.admin.command('ping')
        return "<p>Hello, World! MongoDB is connected. API routes are ready.</p>"
    except Exception as e:
        return f"<p>Hello, World! Could not connect to MongoDB: {e}</p>"

if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv('FLASK_ENV') != 'production'
    
    if DEBUG:
        print(f"🚀 Development server starting on http://0.0.0.0:{PORT}")
        print(f"📡 WebSocket server ready for live interviews")
    else:
        app.logger.info(f"Production server starting on port {PORT}")
    
    # Use socketio.run instead of app.run for WebSocket support
    socketio.run(app, host='0.0.0.0', port=PORT, debug=DEBUG)
