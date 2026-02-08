from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from utils.db import db
from datetime import datetime

applications_bp = Blueprint('applications', __name__)

@applications_bp.route('/', methods=['POST'])
def submit_application():
    """Submit a job application"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Missing or invalid authorization token"}), 401
    
    token = auth_header.split(' ')[1]
    if not ObjectId.is_valid(token):
        return jsonify({"error": "Invalid token"}), 401
    
    data = request.json
    job_id = data.get('jobId')
    
    if not job_id or not ObjectId.is_valid(job_id):
        return jsonify({"error": "Invalid job ID"}), 400
    
    # Check if user exists
    user = db.users.find_one({"_id": ObjectId(token)})
    if not user or user['role'] != 'candidate':
        return jsonify({"error": "Only candidates can submit applications"}), 403
    
    # Validate required profile fields
    required_fields = ['firstName', 'lastName', 'email', 'phone']
    missing_fields = [field for field in required_fields if not user.get(field)]
    
    if missing_fields:
        return jsonify({
            "error": f"Please complete your profile. Missing: {', '.join(missing_fields)}"
        }), 400
    
    # Check if user has uploaded resume
    if not user.get('resume') or not user.get('resume', {}).get('rawText'):
        return jsonify({
            "error": "Please upload your resume before applying"
        }), 400
    
    # Check if user has skills
    if not user.get('skills') or len(user.get('skills', [])) == 0:
        return jsonify({
            "error": "Please add your skills to your profile before applying"
        }), 400
    
    # Check if job exists and is open
    job = db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        return jsonify({"error": "Job not found"}), 404
    
    if job.get('status') in ['closed', 'filled']:
        return jsonify({"error": "This job is no longer accepting applications"}), 400
    
    # Check if already applied
    existing_application = db.applications.find_one({
        "jobId": ObjectId(job_id),
        "candidateId": ObjectId(token)
    })
    
    if existing_application:
        return jsonify({"error": "You have already applied for this job"}), 400
    
    # Score resume against job requirements using AI
    resume_score = 0
    resume_evaluation = None
    is_eligible = False
    rejection_reason = None
    
    try:
        from models.metis.evaluator import evaluate_candidate
        
        resume_text = user.get('resume', {}).get('rawText', '')
        github_url = user.get('githubUrl')
        portfolio_url = user.get('portfolioUrl')
        
        # Run METIS AI evaluation
        resume_evaluation = evaluate_candidate(
            resume_text=resume_text,
            github_url=github_url,
            portfolio_url=portfolio_url,
            jd_text=job.get('description', '')
        )
        
        resume_score = resume_evaluation.get('overall_score', 0)
        
        # Check eligibility: score must be >= 20/100
        if resume_score < 20:
            rejection_reason = f"Resume score ({resume_score}/100) is below the minimum threshold of 20. Your qualifications do not meet the job requirements."
            is_eligible = False
        else:
            # Additional check: verify relevance through risk signals
            risk_signals = resume_evaluation.get('risk_signals', [])
            critical_risks = [r for r in risk_signals if 'irrelevant' in r.lower() or 'mismatch' in r.lower()]
            
            if len(critical_risks) > 2:
                rejection_reason = "Your profile does not align with the job requirements. Please review the job description and apply for positions that better match your experience."
                is_eligible = False
            else:
                is_eligible = True
    
    except Exception as e:
        print(f"Resume scoring error: {str(e)}")
        # If scoring fails, allow application but with 0 score
        is_eligible = True
        resume_score = 0
    
    # Reject if not eligible - DO NOT create application record
    # This allows candidates to improve their resume and try again
    if not is_eligible:
        return jsonify({
            "error": rejection_reason,
            "resumeScore": resume_score,
            "eligible": False,
            "message": "Your application was not submitted. Please improve your qualifications and try again."
        }), 400
    
    # Create application for eligible candidate
    application = {
        "jobId": ObjectId(job_id),
        "candidateId": ObjectId(token),
        "candidateName": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip(),
        "candidateEmail": user.get('email'),
        "status": "pending",  # pending, under_review, assessment_sent, assessment_completed, rejected, accepted
        "stage": "resume_reviewed",  # application_submitted, resume_reviewed, assessment_pending, assessment_completed, interview_scheduled, offer_sent
        "appliedAt": datetime.now(),
        "resumeScore": resume_score,  # Round 1 score (30% of final)
        "metisEvaluation": resume_evaluation,
        "evaluatedAt": datetime.now(),
        "eligible": True,
        "profileSnapshot": {
            "firstName": user.get('firstName', ''),
            "lastName": user.get('lastName', ''),
            "email": user.get('email', ''),
            "skills": user.get('skills', []),
            "experience": user.get('experience', {}),
            "education": user.get('education', []),
            "projects": user.get('projects', []),
            "certifications": user.get('certifications', []),
            "phone": user.get('phone', ''),
            "linkedinUrl": user.get('linkedinUrl', ''),
            "githubUrl": user.get('githubUrl', ''),
            "portfolioUrl": user.get('portfolioUrl', ''),
            "resumeText": user.get('resume', {}).get('rawText', '') if isinstance(user.get('resume'), dict) else ''
        },
        "notes": [],
        "timeline": [{
            "event": "Application Submitted",
            "timestamp": datetime.now(),
            "description": f"Candidate submitted application (Resume Score: {resume_score}/100)"
        }]
    }
    
    result = db.applications.insert_one(application)
    
    # Auto-update all pending applications to under_review
    db.applications.update_many(
        {"jobId": ObjectId(job_id), "status": "pending"},
        {"$set": {"status": "under_review"}}
    )
    
    # Create assessment for this application
    assessment = {
        "jobId": ObjectId(job_id),
        "candidateId": ObjectId(token),
        "applicationId": result.inserted_id,
        "status": "pending",
        "questions": [],
        "responses": [],
        "createdAt": datetime.now()
    }
    
    assessment_result = db.assessments.insert_one(assessment)
    
    return jsonify({
        "message": "Application submitted successfully",
        "applicationId": str(result.inserted_id),
        "assessmentId": str(assessment_result.inserted_id),
        "status": "under_review",
        "resumeScore": resume_score,
        "eligible": True,
        "note": "Your resume has been evaluated. You are eligible for the interview round."
    }), 201

@applications_bp.route('/job/<job_id>', methods=['GET'])
def get_job_applications(job_id):
    """Get all applications for a job"""
    if not ObjectId.is_valid(job_id):
        return jsonify({"error": "Invalid job ID"}), 400
    
    applications = list(db.applications.find({"jobId": ObjectId(job_id)}))
    
    for app in applications:
        app['_id'] = str(app['_id'])
        app['jobId'] = str(app['jobId'])
        app['candidateId'] = str(app['candidateId'])
        app['appliedAt'] = app['appliedAt'].isoformat() if app.get('appliedAt') else None
        
        # Get assessment score if available
        assessment = db.assessments.find_one({
            "applicationId": app['_id'] if isinstance(app['_id'], ObjectId) else ObjectId(app['_id'])
        })
        
        if assessment and assessment.get('status') == 'completed':
            app['assessmentScore'] = assessment.get('overallScore', assessment.get('score', 0))
        else:
            app['assessmentScore'] = None
    
    # Sort by assessment score (highest first), then by applied date
    applications.sort(key=lambda x: (x['assessmentScore'] if x['assessmentScore'] is not None else -1, x.get('appliedAt', '')), reverse=True)
    
    return jsonify({"applications": applications})

@applications_bp.route('/candidate/<candidate_id>', methods=['GET'])
def get_candidate_applications(candidate_id):
    """Get all applications by a candidate"""
    if not ObjectId.is_valid(candidate_id):
        return jsonify({"error": "Invalid candidate ID"}), 400
    
    applications = list(db.applications.find({"candidateId": ObjectId(candidate_id)}))
    
    for app in applications:
        app['_id'] = str(app['_id'])
        app['jobId'] = str(app['jobId'])
        app['candidateId'] = str(app['candidateId'])
        app['appliedAt'] = app['appliedAt'].isoformat() if app.get('appliedAt') else None
        
        # Get job details
        job = db.jobs.find_one({"_id": ObjectId(app['jobId'])})
        if job:
            app['jobTitle'] = job.get('title', 'Unknown Job')
            app['jobCompany'] = job.get('company', '')
    
    return jsonify({"applications": applications})

@applications_bp.route('/<application_id>', methods=['GET'])
def get_application(application_id):
    """Get a specific application with scoring details"""
    if not ObjectId.is_valid(application_id):
        return jsonify({"error": "Invalid application ID"}), 400
    
    application = db.applications.find_one({"_id": ObjectId(application_id)})
    
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    application['_id'] = str(application['_id'])
    application['jobId'] = str(application['jobId'])
    application['candidateId'] = str(application['candidateId'])
    application['appliedAt'] = application['appliedAt'].isoformat() if application.get('appliedAt') else None
    
    # Add scoring breakdown if available
    if application.get('finalScore'):
        application['scoringBreakdown'] = {
            'round1': {
                'name': 'Resume Evaluation',
                'score': application.get('resumeScore', application.get('round1Score', 0)),
                'weight': '30%',
                'contribution': round(application.get('resumeScore', application.get('round1Score', 0)) * 0.3, 1)
            },
            'round2': {
                'name': 'Interview',
                'score': application.get('interviewScore', application.get('round2Score', 0)),
                'weight': '70%',
                'contribution': round(application.get('interviewScore', application.get('round2Score', 0)) * 0.7, 1)
            },
            'finalScore': application.get('finalScore', 0)
        }
    
    return jsonify(application)

@applications_bp.route('/<application_id>', methods=['PUT'])
def update_application(application_id):
    """Update application status/stage"""
    if not ObjectId.is_valid(application_id):
        return jsonify({"error": "Invalid application ID"}), 400
    
    data = request.json
    allowed_updates = ['status', 'stage', 'notes']
    
    update_data = {k: v for k, v in data.items() if k in allowed_updates}
    
    if not update_data:
        return jsonify({"error": "No valid fields to update"}), 400
    
    # Add timeline event
    if 'status' in update_data or 'stage' in update_data:
        timeline_event = {
            "event": f"Status changed to {update_data.get('status', '')} - {update_data.get('stage', '')}",
            "timestamp": datetime.now(),
            "description": data.get('note', '')
        }
        
        db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$push": {"timeline": timeline_event}}
        )
    
    result = db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Application not found"}), 404
    
    return jsonify({"message": "Application updated successfully"})

@applications_bp.route('/<application_id>/select', methods=['POST'])
def select_candidate(application_id):
    """Select a candidate and close the job"""
    if not ObjectId.is_valid(application_id):
        return jsonify({"error": "Invalid application ID"}), 400
    
    application = db.applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    job_id = application['jobId']
    candidate_id = application['candidateId']
    
    # Update the selected application to accepted
    db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": "accepted",
                "stage": "offer_sent"
            },
            "$push": {
                "timeline": {
                    "event": "Candidate Selected",
                    "timestamp": datetime.now(),
                    "description": "Candidate was selected for this position"
                }
            }
        }
    )
    
    # Reject all other applications for this job
    db.applications.update_many(
        {
            "jobId": job_id,
            "_id": {"$ne": ObjectId(application_id)},
            "status": {"$ne": "rejected"}
        },
        {
            "$set": {
                "status": "rejected",
                "stage": "position_filled"
            },
            "$push": {
                "timeline": {
                    "event": "Application Rejected",
                    "timestamp": datetime.now(),
                    "description": "Position was filled by another candidate"
                }
            }
        }
    )
    
    # Update job status to filled
    db.jobs.update_one(
        {"_id": job_id},
        {
            "$set": {
                "status": "filled",
                "selectedCandidateId": str(candidate_id),
                "closedAt": datetime.now()
            }
        }
    )
    
    return jsonify({
        "message": "Candidate selected successfully",
        "jobStatus": "filled"
    })

@applications_bp.route('/<application_id>/accept', methods=['POST'])
def accept_candidate(application_id):
    """Accept a candidate and close the job"""
    if not ObjectId.is_valid(application_id):
        return jsonify({"error": "Invalid application ID"}), 400
    
    application = db.applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    job_id = application['jobId']
    candidate_id = application['candidateId']
    
    # Update the application to accepted
    db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": "accepted",
                "stage": "offer_sent"
            },
            "$push": {
                "timeline": {
                    "event": "Candidate Accepted",
                    "timestamp": datetime.now(),
                    "description": "Application was accepted and job was closed"
                }
            }
        }
    )
    
    # Reject all other applications for this job
    db.applications.update_many(
        {
            "jobId": job_id,
            "_id": {"$ne": ObjectId(application_id)},
            "status": {"$ne": "rejected"}
        },
        {
            "$set": {
                "status": "rejected",
                "stage": "position_filled"
            },
            "$push": {
                "timeline": {
                    "event": "Application Rejected",
                    "timestamp": datetime.now(),
                    "description": "Position was filled by another candidate"
                }
            }
        }
    )
    
    # Close the job
    db.jobs.update_one(
        {"_id": job_id},
        {
            "$set": {
                "status": "filled",
                "selectedCandidateId": str(candidate_id),
                "closedAt": datetime.now()
            }
        }
    )
    
    return jsonify({
        "message": "Candidate accepted and job closed successfully",
        "jobStatus": "filled"
    })

@applications_bp.route('/<application_id>/reject', methods=['POST'])
def reject_candidate(application_id):
    """Reject a candidate"""
    if not ObjectId.is_valid(application_id):
        return jsonify({"error": "Invalid application ID"}), 400
    
    application = db.applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    # Update the application to rejected
    db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": "rejected",
                "stage": "rejected"
            },
            "$push": {
                "timeline": {
                    "event": "Application Rejected",
                    "timestamp": datetime.now(),
                    "description": "Application was rejected"
                }
            }
        }
    )
    
    return jsonify({"message": "Candidate rejected successfully"})

@applications_bp.route('/<application_id>/remove-status', methods=['POST'])
def remove_status(application_id):
    """Remove accepted/rejected status and reopen the application"""
    if not ObjectId.is_valid(application_id):
        return jsonify({"error": "Invalid application ID"}), 400
    
    application = db.applications.find_one({"_id": ObjectId(application_id)})
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    job_id = application['jobId']
    
    # Update the application back to under_review
    db.applications.update_one(
        {"_id": ObjectId(application_id)},
        {
            "$set": {
                "status": "under_review",
                "stage": "review"
            },
            "$push": {
                "timeline": {
                    "event": "Status Removed",
                    "timestamp": datetime.now(),
                    "description": "Application status was reset to under review"
                }
            }
        }
    )
    
    # If job was filled, check if there are any other accepted candidates
    # If not, reopen the job
    job = db.jobs.find_one({"_id": job_id})
    if job and job.get('status') == 'filled':
        # Check if there are any other accepted applications
        other_accepted = db.applications.find_one({
            "jobId": job_id,
            "_id": {"$ne": ObjectId(application_id)},
            "status": "accepted"
        })
        
        if not other_accepted:
            # Reopen the job
            db.jobs.update_one(
                {"_id": job_id},
                {
                    "$set": {"status": "open"},
                    "$unset": {"selectedCandidateId": "", "closedAt": ""}
                }
            )
            return jsonify({
                "message": "Status removed and job reopened",
                "jobStatus": "open"
            })
    
    return jsonify({"message": "Status removed successfully"})
