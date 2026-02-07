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
        applications = list(db.applications.find({"jobId": job_id}))
        
        if not applications:
            return jsonify({"message": "No applications found"}), 200
        
        evaluated_count = 0
        errors = []
        
        for app in applications:
            try:
                profile_snapshot = app.get('profileSnapshot', {})
                resume_text = profile_snapshot.get('resumeText', '')
                
                if not resume_text:
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
                errors.append(f"Error evaluating {app['_id']}: {str(e)}")
        
        return jsonify({
            "message": f"Evaluated {evaluated_count} applications",
            "total": len(applications),
            "errors": errors
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
