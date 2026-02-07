"""
WSGI entry point for production deployment with gunicorn/waitress
"""
import os
from app import app, socketio

# For production, use this with gunicorn:
# gunicorn -k eventlet -w 1 --bind 0.0.0.0:5000 wsgi:app

if __name__ == "__main__":
    PORT = int(os.getenv("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=PORT, debug=False)
