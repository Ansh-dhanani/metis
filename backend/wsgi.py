"""
WSGI entry point for production deployment with gunicorn
"""
import os
from app import app, socketio

if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 5000))
    if socketio:
        socketio.run(app, host='0.0.0.0', port=PORT, debug=False)
    else:
        app.run(host='0.0.0.0', port=PORT, debug=False)
