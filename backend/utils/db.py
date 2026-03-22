import os
import sys
import io
from pymongo import MongoClient
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ('utf-8', 'utf8'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'), override=True)

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))
if MONGO_URI:
    # Log sanitized URI (all characters after @)
    sanitized = MONGO_URI.split('@')[1] if '@' in MONGO_URI else "Invalid URI"
    print(f"[utils/db] Connecting to: ...@{sanitized}")
else:
    print("[utils/db] No MONGO_URI found")

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
        print("[utils/db] Database connection established")
    else:
        print("[utils/db] WARNING: No MONGO_URI found - database operations will fail")
except Exception as e:
    print(f"[utils/db] Database connection error: {e}")
    # If client was created but ping failed, we can still try to return the db object
    try:
        if 'client' in locals():
            db = client['metis_db']
    except Exception:
        pass
    print("[utils/db] App will run, but database operations will fail.")
