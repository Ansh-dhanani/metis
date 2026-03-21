import os
from pymongo import MongoClient
from dotenv import load_dotenv


load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'), override=True)

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))
if MONGO_URI:
    # Log sanitized URI (all characters after @)
    sanitized = MONGO_URI.split('@')[1] if '@' in MONGO_URI else "Invalid URI"
    print(f"🔌 [utils/db] Connecting to: ...@{sanitized}")
else:
    print("⚠️  [utils/db] No MONGO_URI found")

db = None

try:
    if MONGO_URI:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
            tls=True,
            tlsAllowInvalidCertificates=False
        )
        # Test connection
        client.admin.command('ping')
        db = client['metis_db']
        print("✅ Database connection established")
    else:
        print("⚠️ No MONGO_URI found in utils/db.py")
except Exception as e:
    print(f"❌ Database connection error: {e}")
    # If client was created but ping failed, we can still try to return the db object
    try:
        if 'client' in locals():
            db = client['metis_db']
    except:
        pass
    print("⚠️ App will run, but database operations will fail.")
