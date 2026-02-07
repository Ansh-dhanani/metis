#!/bin/bash
# Railway start script for backend

echo "Starting METIS Backend..."

# Run with gunicorn for production
gunicorn -k eventlet -w 1 --bind 0.0.0.0:$PORT --timeout 120 wsgi:app
