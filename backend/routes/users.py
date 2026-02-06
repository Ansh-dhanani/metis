from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from backend.utils.db import db
from backend.services.ai_service import ai_service
from datetime import datetime

users_bp = Blueprint('users', __name__)

@users_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    # Basic validation
    required = ['email', 'password', 'role'] # role: 'hr' or 'candidate'
    if not all(k in data for k in required):
        return jsonify({"error": "Missing fields"}), 400
    
    if db.users.find_one({"email": data['email']}):
        return jsonify({"error": "User already exists"}), 400

    user_doc = {
        "email": data['email'],
        "password": data['password'], # In production, hash this!
        "firstName": data.get("firstName", ""),
        "lastName": data.get("lastName", ""),
        "role": data['role'],
        "linkedinUrl": data.get("linkedinUrl", ""),
        "githubUrl": data.get("githubUrl", ""),
        "portfolioUrl": data.get("portfolioUrl", ""),
        "createdAt": datetime.now(),
        # Candidate specific fields
        "resume": None,
        "credibilityScore": {
            "score": 100,
            "incidents": []
        } if data['role'] == 'candidate' else None
    }
    
    result = db.users.insert_one(user_doc)
    return jsonify({"userId": str(result.inserted_id), "message": "User registered successfully"}), 201

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = db.users.find_one({"email": data.get('email'), "password": data.get('password')})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    
    return jsonify({
        "userId": str(user['_id']),
        "role": user['role'],
        "name": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
    })

@users_bp.route('/<user_id>/resume', methods=['POST'])
def upload_resume(user_id):
    # Mock resume upload - receiving text or parsed JSON directly for MVP
    # In real app, this would handle file upload -> parse -> save
    data = request.json
    raw_text = data.get('rawText', '')
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if user['role'] != 'candidate':
        return jsonify({"error": "Only candidates can upload resumes"}), 403

    # Parse resume
    parsed_data = ai_service.parse_resume(raw_text)
    
    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "resume": {
                "rawText": raw_text,
                "parsedData": parsed_data,
                "uploadedAt": datetime.now()
            }
        }}
    )
    
    return jsonify({"message": "Resume processed", "parsedData": parsed_data})

@users_bp.route('/<user_id>', methods=['GET'])
def get_profile(user_id):
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    user['_id'] = str(user['_id'])
    del user['password'] # Don't return password
    return jsonify(user)

@users_bp.route('/<user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.json
    allowed_updates = ['firstName', 'lastName', 'linkedinUrl', 'githubUrl', 'portfolioUrl']
    
    update_data = {k: v for k, v in data.items() if k in allowed_updates}
    
    if not update_data:
        return jsonify({"message": "No valid fields to update"}), 400

    result = db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
         return jsonify({"error": "User not found"}), 404
         
    return jsonify({"message": "Profile updated successfully"})
