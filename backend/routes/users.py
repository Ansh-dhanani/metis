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
        "phone": data.get("phone", ""),
        "role": data['role'],
        "linkedinUrl": data.get("linkedinUrl", ""),
        "githubUrl": data.get("githubUrl", ""),
        "portfolioUrl": data.get("portfolioUrl", ""),
        "oauthProvider": None,  # For consistency with OAuth users
        "oauthProviderId": None,
        "image": None,
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

    # Handle both file upload (FormData) and JSON text
    raw_text = None
    
    # Try file upload first
    if 'file' in request.files:
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        print(f"Processing file upload: {file.filename}")
        
        # Read file content
        try:
            if file.filename.lower().endswith('.pdf'):
                # Use METIS PDF extraction
                from models.metis.resume_parser import extract_text_from_pdf
                import tempfile
                import os
                
                print("Extracting text from PDF...")
                # Save temporarily
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                    file.save(tmp_file.name)
                    tmp_path = tmp_file.name
                
                try:
                    raw_text = extract_text_from_pdf(tmp_path)
                    print(f"Extracted {len(raw_text)} characters from PDF")
                finally:
                    # Clean up temp file
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
            else:
                # Text file
                print("Reading text file...")
                raw_text = file.read().decode('utf-8', errors='ignore')
                print(f"Read {len(raw_text)} characters from text file")
        except Exception as e:
            print(f"File reading error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Failed to read file: {str(e)}"}), 400
    
    # Fallback to JSON with rawText
    elif request.is_json:
        data = request.json
        raw_text = data.get('rawText', '')
    else:
        return jsonify({"error": "No file or rawText provided"}), 400
    
    if not raw_text:
        return jsonify({"error": "Resume text is required"}), 400

    # Parse resume with comprehensive extraction
    try:
        # Use METIS parser
        from models.metis.resume_parser import parse as metis_parse
        print("Parsing resume with METIS parser...")
        metis_data = metis_parse(raw_text)
        print(f"METIS parsing complete. Found {len(metis_data.get('skills', []))} skills")
        
        # Convert METIS format to application format
        parsed_data = {
            "name": metis_data.get("name", ""),
            "email": metis_data.get("email", ""),
            "phone": metis_data.get("phone", ""),
            "skills": metis_data.get("skills", []),
            "linkedinUrl": metis_data.get("linkedin", ""),
            "githubUrl": metis_data.get("github", ""),
            "portfolioUrl": metis_data.get("portfolio", ""),
            "education": metis_data.get("education", []),
            "projects": metis_data.get("projects", []),
            "certifications": metis_data.get("certifications", []),
            "experience": metis_data.get("experience", []),
        }
                
    except Exception as e:
        # Fallback to basic AI service parser
        print(f"METIS parser failed: {str(e)}, using fallback")
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
        "parsedData": parsed_data,
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
            "image": user.get('image', ''),
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

@users_bp.route('/oauth-login', methods=['POST'])
def oauth_login():
    """Handle OAuth login/registration from Google, LinkedIn, etc."""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        name = data.get('name')
        provider = data.get('provider')  # 'google' or 'linkedin'
        provider_id = data.get('providerId')
        image = data.get('image')
        
        if not email or not provider:
            return jsonify({"error": "Email and provider are required"}), 400
        
        # Check if user exists with this email
        user = db.users.find_one({"email": email})
        
        if user:
            # Update OAuth info and image (always update image in case it changed)
            update_data = {}
            if not user.get('oauthProvider'):
                update_data['oauthProvider'] = provider
                update_data['oauthProviderId'] = provider_id
            if image:
                update_data['image'] = image
            
            if update_data:
                db.users.update_one(
                    {"_id": user['_id']},
                    {"$set": update_data}
                )
                # Refresh user data after update
                user = db.users.find_one({"_id": user['_id']})
            
            return jsonify({
                "user": {
                    "id": str(user['_id']),
                    "email": user['email'],
                    "name": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or name,
                    "role": user['role'],
                    "image": user.get('image', '')
                },
                "message": "Login successful"
            }), 200
        
        else:
            # User doesn't exist - they need to register first
            return jsonify({
                "error": "User not found. Please complete registration.",
                "needsRegistration": True
            }), 404
    
    except Exception as e:
        print(f"[OAUTH-LOGIN] Error: {str(e)}")
        return jsonify({"error": "OAuth login failed"}), 500

@users_bp.route('/check-email', methods=['POST'])
def check_email():
    """Check if an email exists in the database"""
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        user = db.users.find_one({"email": email})
        
        return jsonify({"exists": user is not None}), 200
    
    except Exception as e:
        print(f"[CHECK-EMAIL] Error: {str(e)}")
        return jsonify({"error": "Failed to check email"}), 500

@users_bp.route('/oauth-register', methods=['POST'])
def oauth_register():
    """Register a new user from OAuth with role selection"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        email = data.get('email')
        name = data.get('name')
        provider = data.get('provider')
        provider_id = data.get('providerId')
        image = data.get('image')
        role = data.get('role')  # 'hr' or 'candidate'
        phone = data.get('phone', '')
        linkedin_url = data.get('linkedinUrl', '')
        github_url = data.get('githubUrl', '')
        portfolio_url = data.get('portfolioUrl', '')
        
        if not email or not provider or not role:
            return jsonify({"error": "Email, provider, and role are required"}), 400
        
        if role not in ['hr', 'candidate']:
            return jsonify({"error": "Invalid role. Must be 'hr' or 'candidate'"}), 400
        
        # Check if user already exists
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            return jsonify({"error": "User already exists"}), 400
        
        # Split name into first/last
        name_parts = name.split(' ', 1) if name else ['', '']
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        user_doc = {
            "email": email,
            "password": None,  # OAuth users don't have passwords
            "firstName": first_name,
            "lastName": last_name,
            "phone": phone,
            "role": role,
            "oauthProvider": provider,
            "oauthProviderId": provider_id,
            "image": image,
            "linkedinUrl": linkedin_url,
            "githubUrl": github_url,
            "portfolioUrl": portfolio_url,
            "createdAt": datetime.now(),
            "resume": None,
            "credibilityScore": {
                "score": 100,
                "incidents": []
            } if role == 'candidate' else None
        }
        
        result = db.users.insert_one(user_doc)
        
        # Generate a simple token (user_id as token for MVP - use JWT in production)
        token = str(result.inserted_id)
        
        return jsonify({
            "user": {
                "_id": str(result.inserted_id),
                "userId": str(result.inserted_id),
                "email": email,
                "name": name,
                "role": role,
                "image": image,
                "linkedinUrl": linkedin_url,
                "githubUrl": github_url,
                "portfolioUrl": portfolio_url
            },
            "token": token,
            "message": "User registered successfully"
        }), 201
    
    except Exception as e:
        print(f"[OAUTH-REGISTER] Error: {str(e)}")
        return jsonify({"error": "OAuth registration failed"}), 500

