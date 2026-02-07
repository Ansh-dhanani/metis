import os
from flask import Flask
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

app = Flask(__name__)
app.url_map.strict_slashes = False  # Disable strict trailing slash enforcement

# CORS Configuration
# Allow requests from frontend (development and production)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",  # Development frontend
            "http://127.0.0.1:3000",
            "https://metis.vercel.app",  # Production frontend (update with your actual domain)
            "https://*.vercel.app"  # Vercel preview deployments
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

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

app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(assessments_bp, url_prefix='/api/assessments')
app.register_blueprint(rankings_bp, url_prefix='/api/rankings')
app.register_blueprint(interview_bp, url_prefix='/api/interview')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(applications_bp, url_prefix='/api/applications')

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
    app.run(host='0.0.0.0', port=PORT, debug=True)
