from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))
client = MongoClient(MONGO_URI)
db = client['flask_db']

# Simulate the login request
test_email = "hr@example.com"
test_password = "hr@1234"

print("Testing login with:")
print(f"  Email: {test_email}")
print(f"  Password: {test_password}")
print("="*60)

# This is what the backend does
user = db.users.find_one({"email": test_email, "password": test_password})

if user:
    print("✓ LOGIN SUCCESSFUL!")
    print(f"\nUser found:")
    print(f"  ID: {user['_id']}")
    print(f"  Email: {user['email']}")
    print(f"  Role: {user['role']}")
    print(f"  Name: {user.get('firstName')} {user.get('lastName')}")
    print(f"\nToken would be: {str(user['_id'])}")
else:
    print("✗ LOGIN FAILED - Invalid credentials")
    print("\nChecking what's wrong...")
    
    # Check if email exists
    user_by_email = db.users.find_one({"email": test_email})
    if user_by_email:
        print(f"  Email found, but password doesn't match")
        print(f"  Expected password: {user_by_email.get('password')}")
    else:
        print(f"  Email not found in database")
