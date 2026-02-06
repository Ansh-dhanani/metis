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


@app.route("/")
def hello_world():
    try:
        # Ping the database to check connection
        client.admin.command('ping')
        return "<p>Hello, World! MongoDB is connected.</p>"
    except Exception as e:
        return f"<p>Hello, World! Could not connect to MongoDB: {e}</p>"

if __name__ == "__main__":
    app.run(debug=True)
