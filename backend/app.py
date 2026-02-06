import os
from flask import Flask
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'), override=True)

app = Flask(__name__)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client['flask_db'] # Use a specific database name


from backend.routes.jobs import jobs_bp
from backend.routes.assessments import assessments_bp
from backend.routes.rankings import rankings_bp
from backend.routes.interview import interview_bp
from backend.routes.users import users_bp

app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(assessments_bp, url_prefix='/api/assessments')
app.register_blueprint(rankings_bp, url_prefix='/api/rankings')
app.register_blueprint(interview_bp, url_prefix='/api/interview')
app.register_blueprint(users_bp, url_prefix='/api/users')


@app.route("/")
def hello_world():
    try:
        # Ping the database to check connection
        client.admin.command('ping')
        return "<p>Hello, World! MongoDB is connected. API routes are ready.</p>"
    except Exception as e:
        return f"<p>Hello, World! Could not connect to MongoDB: {e}</p>"

if __name__ == "__main__":
    app.run(debug=True)
