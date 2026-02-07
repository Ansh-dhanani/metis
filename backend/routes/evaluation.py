"""
METIS Evaluation Routes

Integrates Model 1 (Resume Parser/Evaluator) for advanced candidate analysis.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import sys
import os

# Add models to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

try:
    from metis.evaluator import evaluate_candidate
    from metis.resume_parser import parse as parse_resume, read_resume_file
    from metis.interview_evaluator import evaluate_interview, get_round2_score
    METIS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: METIS models not available: {e}")
    METIS_AVAILABLE = False

evaluation_bp = Blueprint('evaluation', __name__)

def get_db():
    """Get database instance."""
    from app import db
    return db


@evaluation_bp.route('/parse-resume', methods=['POST'])
def parse_resume_endpoint():
    """
    Parse resume text and extract structured data.
    
    Request JSON:
        {
            "resumeText": "Full resume content...",
            "githubUrl": "https://github.com/username" (optional),
            "portfolioUrl": "https://portfolio.com" (optional)
        }
    
    Response:
        {
            "parsed": {...},  # Structured resume data
            "evaluation": {...}  # METIS evaluation scores
        }
    """
    if not METIS_AVAILABLE:
        return jsonify({"error": "METIS evaluation service unavailable"}), 503
    
    data = request.get_json()
    resume_text = data.get('resumeText')
    github_url = data.get('githubUrl')
    portfolio_url = data.get('portfolioUrl')
    
    if not resume_text:
        return jsonify({"error": "resumeText is required"}), 400
    
    try:
        # Parse resume structure
        parsed_data = parse_resume(resume_text)
        
        # Run METIS evaluation
        evaluation = evaluate_candidate(
            resume_text=resume_text,
            github_url=github_url,
            portfolio_url=portfolio_url
        )
        
        return jsonify({
            "parsed": parsed_data,
            "evaluation": evaluation
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@evaluation_bp.route('/evaluate/<application_id>', methods=['POST'])
def evaluate_application(application_id):
    """
    Evaluate an existing application using METIS.
    
    Updates the application with evaluation scores.
    """
    if not METIS_AVAILABLE:
        return jsonify({"error": "METIS evaluation service unavailable"}), 503
    
    try:
        db = get_db()
        
        # Get application
        application = db.applications.find_one({"_id": ObjectId(application_id)})
        if not application:
            return jsonify({"error": "Application not found"}), 404
        
        # Get resume text
        profile_snapshot = application.get('profileSnapshot', {})
        resume_text = profile_snapshot.get('resumeText', '')
        
        if not resume_text:
            return jsonify({"error": "No resume text found in application"}), 400
        
        # Get URLs
        github_url = profile_snapshot.get('githubUrl')
        portfolio_url = profile_snapshot.get('portfolioUrl')
        
        # Run METIS evaluation
        evaluation = evaluate_candidate(
            resume_text=resume_text,
            github_url=github_url,
            portfolio_url=portfolio_url
        )
        
        # Update application with evaluation
        db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {
                "$set": {
                    "metisEvaluation": evaluation,
                    "metisScore": evaluation.get('overall_score', 0),
                    "evaluatedAt": datetime.now()
                }
            }
        )
        
        return jsonify({
            "message": "Application evaluated successfully",
            "evaluation": evaluation
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@evaluation_bp.route('/batch-evaluate/<job_id>', methods=['POST'])
def batch_evaluate_applications(job_id):
    """
    Evaluate all applications for a job using METIS.
    
    Runs METIS evaluation on all pending applications.
    """
    if not METIS_AVAILABLE:
        return jsonify({"error": "METIS evaluation service unavailable"}), 503
    
    try:
        db = get_db()
        
        # Get all applications for this job
        applications = list(db.applications.find({"jobId": ObjectId(job_id)}))
        
        if not applications:
            return jsonify({"message": "No applications found"}), 200
        
        evaluated_count = 0
        skipped_count = 0
        errors = []
        
        for app in applications:
            try:
                candidate_id = app.get('candidateId')
                profile_snapshot = app.get('profileSnapshot', {})
                resume_text = profile_snapshot.get('resumeText', '')
                
                # If resumeText not in snapshot, try to get it from user profile
                if not resume_text and candidate_id:
                    user = db.users.find_one({"_id": ObjectId(candidate_id)})
                    if user and user.get('resume'):
                        resume_text = user['resume'].get('rawText', '')
                        # Update application with resume text for future use
                        db.applications.update_one(
                            {"_id": app['_id']},
                            {"$set": {"profileSnapshot.resumeText": resume_text}}
                        )
                
                if not resume_text:
                    skipped_count += 1
                    errors.append(f"No resume text for candidate {app.get('candidateName', 'Unknown')}")
                    continue
                
                # Run METIS evaluation
                evaluation = evaluate_candidate(
                    resume_text=resume_text,
                    github_url=profile_snapshot.get('githubUrl'),
                    portfolio_url=profile_snapshot.get('portfolioUrl')
                )
                
                # Update application
                db.applications.update_one(
                    {"_id": app['_id']},
                    {
                        "$set": {
                            "metisEvaluation": evaluation,
                            "metisScore": evaluation.get('overall_score', 0),
                            "evaluatedAt": datetime.now()
                        }
                    }
                )
                
                evaluated_count += 1
                
            except Exception as e:
                errors.append(f"Error evaluating {app.get('candidateName', 'Unknown')}: {str(e)}")
        
        if evaluated_count == 0:
            return jsonify({
                "error": f"No applications could be evaluated. {skipped_count} applications have no resume text.",
                "details": "Please ensure candidates have uploaded resumes before evaluation.",
                "errors": errors
            }), 400
        
        return jsonify({
            "message": f"Evaluated {evaluated_count} of {len(applications)} applications",
            "evaluated": evaluated_count,
            "skipped": skipped_count,
            "total": len(applications),
            "errors": errors if errors else None
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@evaluation_bp.route('/evaluate-interview/<application_id>', methods=['POST'])
def evaluate_interview_endpoint(application_id):
    """
    Evaluate interview transcript and calculate final combined score.
    
    Combines:
    - 30% Resume/METIS score (Round 1)
    - 70% Interview score (Round 2)
    
    Updates application with interview evaluation and final score.
    """
    if not METIS_AVAILABLE:
        return jsonify({"error": "METIS evaluation service unavailable"}), 503
    
    try:
        db = get_db()
        
        # Get application
        application = db.applications.find_one({"_id": ObjectId(application_id)})
        if not application:
            return jsonify({"error": "Application not found"}), 404
        
        # Get job for JD
        job = db.jobs.find_one({"_id": application.get('jobId')})
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        # Get interview transcript
        interview = db.interviews.find_one({"applicationId": ObjectId(application_id)})
        if not interview:
            return jsonify({"error": "No interview found for this application"}), 404
        
        if interview.get('status') != 'completed':
            return jsonify({"error": "Interview not completed yet"}), 400
        
        # Build job description text
        job_description = f"{job.get('title', 'Position')}\n\n{job.get('description', '')}"
        
        # Evaluate interview
        interview_eval = evaluate_interview(
            job_description=job_description,
            transcript=interview.get('messages', []),
            candidate_name=application.get('candidateName', 'Candidate')
        )
        
        # Get Round 1 score (METIS resume evaluation)
        round1_score = application.get('metisScore', 0)
        
        # Get Round 2 score (Interview)
        round2_score = interview_eval.get('interview_score', 0)
        
        # Calculate final combined score: 30% resume + 70% interview
        final_score = round((round1_score * 0.3) + (round2_score * 0.7), 1)
        
        # Update application with interview evaluation and final score
        db.applications.update_one(
            {"_id": ObjectId(application_id)},
            {
                "$set": {
                    "interviewEvaluation": interview_eval,
                    "interviewScore": round2_score,
                    "finalScore": final_score,
                    "round1Score": round1_score,  # Resume score
                    "round2Score": round2_score,  # Interview score
                    "interviewEvaluatedAt": datetime.now(),
                    "status": "interview_evaluated"
                }
            }
        )
        
        return jsonify({
            "message": "Interview evaluated successfully",
            "round1_score": round1_score,
            "round2_score": round2_score,
            "final_score": final_score,
            "evaluation": interview_eval
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@evaluation_bp.route('/batch-evaluate-interviews/<job_id>', methods=['POST'])
def batch_evaluate_interviews(job_id):
    """
    Evaluate all completed interviews for a job and calculate final scores.
    """
    if not METIS_AVAILABLE:
        return jsonify({"error": "METIS evaluation service unavailable"}), 503
    
    try:
        db = get_db()
        
        # Get job
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        # Get all applications with completed interviews
        applications = list(db.applications.find({
            "jobId": ObjectId(job_id),
            "metisEvaluation": {"$exists": True}
        }))
        
        if not applications:
            return jsonify({"error": "No evaluated applications found"}), 400
        
        job_description = f"{job.get('title', 'Position')}\n\n{job.get('description', '')}"
        
        evaluated_count = 0
        skipped_count = 0
        errors = []
        
        for app in applications:
            try:
                # Check if interview exists and is completed
                interview = db.interviews.find_one({
                    "applicationId": app['_id'],
                    "status": "completed"
                })
                
                if not interview:
                    skipped_count += 1
                    continue
                
                # Evaluate interview
                interview_eval = evaluate_interview(
                    job_description=job_description,
                    transcript=interview.get('messages', []),
                    candidate_name=app.get('candidateName', 'Candidate')
                )
                
                round1_score = app.get('metisScore', 0)
                round2_score = interview_eval.get('interview_score', 0)
                final_score = round((round1_score * 0.3) + (round2_score * 0.7), 1)
                
                # Update application
                db.applications.update_one(
                    {"_id": app['_id']},
                    {
                        "$set": {
                            "interviewEvaluation": interview_eval,
                            "interviewScore": round2_score,
                            "finalScore": final_score,
                            "round1Score": round1_score,
                            "round2Score": round2_score,
                            "interviewEvaluatedAt": datetime.now(),
                            "status": "interview_evaluated"
                        }
                    }
                )
                
                evaluated_count += 1
                
            except Exception as e:
                errors.append(f"Error evaluating interview for {app.get('candidateName', 'Unknown')}: {str(e)}")
        
        return jsonify({
            "message": f"Evaluated {evaluated_count} interviews",
            "evaluated": evaluated_count,
            "skipped": skipped_count,
            "total": len(applications),
            "errors": errors if errors else None
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
