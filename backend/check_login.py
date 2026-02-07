from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", os.getenv("DATABASE_URL"))
client = MongoClient(MONGO_URI)
db = client['flask_db']

print("Checking login credentials...")
print("="*60)

# Check what's in the database
user = db.users.find_one({"email": "hr@example.com"})

if user:
    print(f"Found user: {user.get('email')}")
    print(f"Role: {user.get('role')}")
    print(f"Password in DB: {user.get('password')}")
    print(f"First Name: {user.get('firstName')}")
    print(f"Last Name: {user.get('lastName')}")
    print("\nAll fields in user document:")
    for key, value in user.items():
        if key != 'password':
            print(f"  {key}: {value}")
else:
    print("User not found!")

# Try different password variations
test_passwords = ["password123", "admin123", "hr123", "123456"]
print("\n" + "="*60)
print("Testing password matches:")
for pwd in test_passwords:
    match_user = db.users.find_one({"email": "hr@example.com", "password": pwd})
    if match_user:
        print(f"  ✓ Password '{pwd}' MATCHES!")
    else:
        print(f"  ✗ Password '{pwd}' does not match")
