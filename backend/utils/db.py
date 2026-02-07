import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'), override=True)

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))
client = MongoClient(MONGO_URI)
db = client['flask_db']
