import os
from pymongo import MongoClient
from dotenv import load_dotenv
import ssl

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'), override=True)

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))

try:
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=30000,
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
        tls=True,
        tlsAllowInvalidCertificates=False
    )
    db = client['metis_db']
    # Test connection
    client.admin.command('ping')
    print("✅ Database connection established")
except Exception as e:
    print(f"❌ Database connection error: {e}")
    print("Check: 1) Internet connection 2) MongoDB URI 3) IP allowlist")
    raise
