"""
Production configuration and utilities for the Flask application
"""
import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request, jsonify
from werkzeug.exceptions import HTTPException
import time

def setup_logging(app: Flask):
    """Configure logging for production"""
    if not app.debug:
        # Create logs directory if it doesn't exist
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # File handler for production logs
        file_handler = RotatingFileHandler(
            'logs/metis.log',
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s '
            '[in %(pathname)s:%(lineno)d]'
        ))
        
        log_level = os.getenv('LOG_LEVEL', 'INFO')
        file_handler.setLevel(getattr(logging, log_level))
        app.logger.addHandler(file_handler)
        app.logger.setLevel(getattr(logging, log_level))
        app.logger.info('METIS application startup')


def add_security_headers(app: Flask):
    """Add security headers to responses"""
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response


def add_error_handlers(app: Flask):
    """Add global error handlers"""
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Internal server error: {error}')
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Pass through HTTP errors
        if isinstance(e, HTTPException):
            return jsonify({'error': e.description}), e.code
        
        # Log non-HTTP exceptions
        app.logger.error(f'Unhandled exception: {str(e)}', exc_info=True)
        return jsonify({'error': 'An unexpected error occurred'}), 500


def add_request_logging(app: Flask):
    """Log all requests in production"""
    @app.before_request
    def log_request_info():
        if not app.debug:
            app.logger.info(
                f'{request.method} {request.path} '
                f'from {request.remote_addr}'
            )
    
    @app.after_request
    def log_response_info(response):
        if not app.debug:
            app.logger.info(
                f'{request.method} {request.path} '
                f'-> {response.status_code}'
            )
        return response


class RateLimiter:
    """Simple in-memory rate limiter"""
    def __init__(self):
        self.requests = {}
    
    def is_allowed(self, key: str, limit: int = 60, window: int = 60):
        """Check if request is allowed based on rate limit"""
        current_time = time.time()
        
        if key not in self.requests:
            self.requests[key] = []
        
        # Remove old requests outside the window
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if current_time - req_time < window
        ]
        
        # Check if limit exceeded
        if len(self.requests[key]) >= limit:
            return False
        
        # Add current request
        self.requests[key].append(current_time)
        return True


rate_limiter = RateLimiter()


def add_rate_limiting(app: Flask):
    """Add rate limiting middleware"""
    @app.before_request
    def check_rate_limit():
        if os.getenv('RATE_LIMIT_ENABLED', 'true').lower() == 'true':
            # Use IP address as key
            key = request.remote_addr
            limit = int(os.getenv('RATE_LIMIT_PER_MINUTE', 60))
            
            if not rate_limiter.is_allowed(key, limit=limit):
                app.logger.warning(f'Rate limit exceeded for {key}')
                return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429


def configure_production(app: Flask):
    """Apply all production configurations"""
    setup_logging(app)
    add_security_headers(app)
    add_error_handlers(app)
    add_request_logging(app)
    add_rate_limiting(app)
    
    app.logger.info('Production configuration applied')
