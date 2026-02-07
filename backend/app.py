"""
METIS Scoring Model - Main Flask Application with SocketIO

Entry point that registers all blueprints and WebSocket handlers.
Supports:
- Model 1: Resume Evaluation (Round 1)
- Model 2: Live Interview (Round 2) via WebSocket
- Model 3: Final Scoring & Leaderboard
"""

import os
import sys
from pathlib import Path

# Add model directory to sys.path
# base_dir is backend/
base_dir = Path(__file__).resolve().parent
# model_dir is ../model
model_dir = base_dir.parent / "model"
sys.path.append(str(model_dir))

# Load .env file
env_path = base_dir / ".env"
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()

from flask import Flask, send_from_directory
from flask_cors import CORS

# Try to import SocketIO for Model 2
try:
    from flask_socketio import SocketIO
    SOCKETIO_AVAILABLE = True
except ImportError:
    SOCKETIO_AVAILABLE = False
    print("[Warning] flask-socketio not installed. Model 2 features disabled.")

# Import scoring blueprints
from routes.scoring import scoring_bp, leaderboard_bp, shortlist_bp

# Import upload blueprint
try:
    from routes.upload import upload_bp
    UPLOAD_AVAILABLE = True
except ImportError as e:
    UPLOAD_AVAILABLE = False
    print(f"[Warning] Upload routes not available: {e}")

# Import interview blueprint
try:
    from routes.interview import interview_bp, register_socketio_handlers
    INTERVIEW_AVAILABLE = True
except ImportError as e:
    INTERVIEW_AVAILABLE = False
    print(f"[Warning] Interview routes not available: {e}")

# Global SocketIO instance
socketio = None


def create_app():
    """Create and configure the Flask application."""
    global socketio
    
    app = Flask(__name__)
    
    # Enable CORS for API access
    CORS(app)
    
    # Register scoring blueprints
    app.register_blueprint(scoring_bp)
    app.register_blueprint(leaderboard_bp)
    app.register_blueprint(shortlist_bp)
    
    # Register interview blueprint if available
    if INTERVIEW_AVAILABLE:
        app.register_blueprint(interview_bp)
    
    # Register upload blueprint if available
    if UPLOAD_AVAILABLE:
        app.register_blueprint(upload_bp)
    
    # Initialize SocketIO if available
    if SOCKETIO_AVAILABLE:
        socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')
        
        # Register WebSocket handlers for live interview
        if INTERVIEW_AVAILABLE:
            register_socketio_handlers(socketio)
    
    # Serve demo pages
    @app.route('/')
    def index():
        return send_from_directory('../frontend/demo', 'leaderboard_demo.html')
    
    @app.route('/interview')
    def interview_page():
        return send_from_directory('../frontend/demo', 'interview_demo.html')
    
    @app.route('/upload')
    def upload_page():
        return send_from_directory('../frontend/demo', 'upload_demo.html')
    
    @app.route('/demo/<path:filename>')
    def serve_demo(filename):
        return send_from_directory('../frontend/demo', filename)
    
    # Health check
    @app.route('/health')
    def health():
        return {
            'status': 'healthy',
            'service': 'metis-scoring-model',
            'features': {
                'model1_resume': True,
                'model2_interview': INTERVIEW_AVAILABLE and SOCKETIO_AVAILABLE,
                'model3_scoring': True
            }
        }
    
    return app


if __name__ == '__main__':
    app = create_app()
    
    print("\n🚀 METIS Scoring Model Server")
    print("=" * 50)
    print("📄 Round 1 Upload:    http://localhost:5000/upload")
    print("🎤 Round 2 Interview: http://localhost:5000/interview")
    print("📊 Leaderboard:       http://localhost:5000/")
    print("📋 Health Check:      http://localhost:5000/health")
    print("=" * 50)
    print("📌 API Endpoints:")
    print("   /api/upload/analyze-file   - Upload resume + URLs")
    print("   /api/scoring/demo          - Demo data")
    print("   /api/scoring/combined      - Combined scoring")
    print("   /api/interview/status      - Interview status")
    print("=" * 50)
    
    if SOCKETIO_AVAILABLE and socketio:
        print("🔌 WebSocket enabled for live interviews")
        socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
    else:
        print("⚠️  WebSocket disabled (install flask-socketio)")
        app.run(debug=True, port=5000)
