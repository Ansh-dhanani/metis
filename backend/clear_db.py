"""
Clear all data from MongoDB database
"""
import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))

if not MONGO_URI:
    print("Error: MONGO_URI not found in environment variables")
    sys.exit(1)

try:
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client['flask_db']
    
    print("Connected to MongoDB")
    print(f"Database: {db.name}")
    
    # Get all collections
    collections = db.list_collection_names()
    print(f"\nFound {len(collections)} collections: {collections}")
    
    # Ask for confirmation
    confirm = input("\n⚠️  WARNING: This will delete ALL data from the database. Continue? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("Operation cancelled.")
        sys.exit(0)
    
    # Delete all documents from each collection
    deleted_counts = {}
    for collection_name in collections:
        result = db[collection_name].delete_many({})
        deleted_counts[collection_name] = result.deleted_count
        print(f"✓ Deleted {result.deleted_count} documents from '{collection_name}'")
    
    print(f"\n✅ Database cleared successfully!")
    print(f"Total documents deleted: {sum(deleted_counts.values())}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)
finally:
    if 'client' in locals():
        client.close()
