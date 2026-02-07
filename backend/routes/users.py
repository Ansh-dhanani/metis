from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from utils.db import db
from services.ai_service import ai_service
from datetime import datetime

users_bp = Blueprint('users', __name__)

@users_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return jsonify({"error": "Method not allowed. Please use POST to register a new user."}), 405

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
    
    # Generate a simple token (user_id as token for MVP - use JWT in production)
    token = str(result.inserted_id)
    
    return jsonify({
        "userId": str(result.inserted_id),
        "token": token,
        "role": data['role'],
        "message": "User registered successfully"
    }), 201

@users_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return jsonify({"error": "Method not allowed. Please use POST to login."}), 405

    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        print(f"[LOGIN] Attempting login for email: {email}")
        print(f"[LOGIN] Database: {db.name}")
        print(f"[LOGIN] Collections: {db.list_collection_names()}")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        # Check if user exists
        user_check = db.users.find_one({"email": email})
        if not user_check:
            print(f"[LOGIN] User not found with email: {email}")
            return jsonify({"error": "Invalid credentials - user not found"}), 401
        
        print(f"[LOGIN] User found: {email}, checking password...")
        print(f"[LOGIN] Stored password: {user_check.get('password')}")
        print(f"[LOGIN] Provided password: {password}")
        
        # Check password
        user = db.users.find_one({"email": email, "password": password})
        if not user:
            print(f"[LOGIN] Password mismatch for user: {email}")
            return jsonify({"error": "Invalid credentials - wrong password"}), 401
        
        print(f"[LOGIN] Login successful for: {email}")
        
        # Generate a simple token (user_id as token for MVP - use JWT in production)
        token = str(user['_id'])
        
        return jsonify({
            "userId": str(user['_id']),
            "role": user['role'],
            "firstName": user.get('firstName', ''),
            "lastName": user.get('lastName', ''),
            "email": user['email'],
            "token": token
        }), 200
    except Exception as e:
        print(f"[LOGIN ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@users_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    # Get user ID from Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid authorization token"}), 401
    
    token = auth_header.split(' ')[1]
    
    # In MVP, token is just the user_id
    if not ObjectId.is_valid(token):
        return jsonify({"error": "Invalid token"}), 401
    
    user = db.users.find_one({"_id": ObjectId(token)})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    if user['role'] != 'candidate':
        return jsonify({"error": "Only candidates can upload resumes"}), 403

    # Accept JSON with resume text for parsing
    if not request.is_json:
        return jsonify({"error": "Request must be JSON with 'rawText' field"}), 400
    
    data = request.json
    raw_text = data.get('rawText', '')
    
    if not raw_text:
        return jsonify({"error": "Resume text is required"}), 400

    # Parse resume with comprehensive extraction
    parsed_data = ai_service.parse_resume(raw_text)
    
    # Store only parsed data
    resume_data = {
        "rawText": raw_text,
        "parsedData": parsed_data,
        "uploadedAt": datetime.now().isoformat()
    }
    
    # Update user profile with parsed data
    update_fields = {
        "resume": resume_data,
        "skills": parsed_data.get("skills", []),
        "experience": parsed_data.get("experience", {}),
        "education": parsed_data.get("education", []),
        "projects": parsed_data.get("projects", []),
        "certifications": parsed_data.get("certifications", []),
        "phone": parsed_data.get("phone", ""),
        "linkedinUrl": parsed_data.get("linkedinUrl", user.get("linkedinUrl", "")),
        "githubUrl": parsed_data.get("githubUrl", user.get("githubUrl", "")),
        "portfolioUrl": parsed_data.get("portfolioUrl", user.get("portfolioUrl", "")),
    }
    
    db.users.update_one(
        {"_id": ObjectId(token)},
        {"$set": update_fields}
    )
    
    return jsonify({
        "message": "Resume processed successfully",
        "resumeUrl": resume_url,
        "skills": parsed_data.get("skills", []),
        "experience": parsed_data.get("experience", {}),
        "education": parsed_data.get("education", []),
        "projects": parsed_data.get("projects", []),
        "certifications": parsed_data.get("certifications", []),
        "phone": parsed_data.get("phone", ""),
        "linkedinUrl": parsed_data.get("linkedinUrl", ""),
        "githubUrl": parsed_data.get("githubUrl", ""),
        "portfolioUrl": parsed_data.get("portfolioUrl", "")
    })

@users_bp.route('/profile', methods=['GET', 'PUT'])
def manage_profile():
    # Get user ID from Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid authorization token"}), 401
    
    token = auth_header.split(' ')[1]
    
    # In MVP, token is just the user_id (use JWT in production)
    if not ObjectId.is_valid(token):
        return jsonify({"error": "Invalid token"}), 401
    
    user = db.users.find_one({"_id": ObjectId(token)})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if request.method == 'GET':
        # Return full user profile
        return jsonify({
            "userId": str(user['_id']),
            "email": user['email'],
            "role": user['role'],
            "firstName": user.get('firstName', ''),
            "lastName": user.get('lastName', ''),
            "phone": user.get('phone', ''),
            "linkedinUrl": user.get('linkedinUrl', ''),
            "githubUrl": user.get('githubUrl', ''),
            "portfolioUrl": user.get('portfolioUrl', ''),
            "skills": user.get('skills', []),
            "experience": user.get('experience', {}),
            "education": user.get('education', []),
            "projects": user.get('projects', []),
            "certifications": user.get('certifications', []),
            "createdAt": user.get('createdAt', '').isoformat() if user.get('createdAt') else ''
        })
    
    elif request.method == 'PUT':
        # Update profile
        data = request.json
        allowed_updates = [
            'firstName', 'lastName', 'phone', 'linkedinUrl', 'githubUrl', 'portfolioUrl',
            'skills', 'experience', 'education', 'projects', 'certifications'
        ]
        
        update_data = {k: v for k, v in data.items() if k in allowed_updates}
        
        if not update_data:
            return jsonify({"message": "No valid fields to update"}), 400

        db.users.update_one(
            {"_id": ObjectId(token)},
            {"$set": update_data}
        )
        
        return jsonify({"message": "Profile updated successfully"})

@users_bp.route('/<user_id>', methods=['GET'])
def get_profile(user_id):
    if not ObjectId.is_valid(user_id):
        return jsonify({"error": "Invalid User ID format"}), 400

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
