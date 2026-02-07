from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))
client = MongoClient(MONGO_URI)

print("Available databases:")
for db_name in client.list_database_names():
    print(f"  - {db_name}")

print("\n" + "="*60)

# Check common database names
for db_name in ['metis_db', 'flask_db', 'test', 'metis']:
    try:
        db = client[db_name]
        collections = db.list_collection_names()
        if 'users' in collections:
            user_count = db.users.count_documents({})
            print(f"\nDatabase: {db_name}")
            print(f"  Collections: {collections}")
            print(f"  Users count: {user_count}")
            
            if user_count > 0:
                print("\n  Sample users:")
                for user in db.users.find().limit(3):
                    print(f"    Email: {user.get('email')}, Role: {user.get('role')}")
    except Exception as e:
        pass
