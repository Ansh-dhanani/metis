from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from services.ai_service import ai_service
from utils.db import db
from datetime import datetime

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/', methods=['POST'])
def create_job():
    data = request.json
    job_doc = {
        "hrId": data.get("hrId"),  # HR user ID
        "title": data.get("title", "Untitled Job"),
        "rawText": data.get("rawText", ""),
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        "parsedData": None,
        "skillWeights": None,
        "status": "open",  # open, closed, filled
        "autoSelectTopCandidate": data.get("autoSelectTopCandidate", False),
        "autoCloseEnabled": data.get("autoCloseEnabled", False),
        "autoCloseDate": data.get("autoCloseDate"),  # ISO date string
        "selectedCandidateId": None
    }
    result = db.jobs.insert_one(job_doc)
    return jsonify({"jobId": str(result.inserted_id), "message": "Job created successfully"}), 201

@jobs_bp.route('/', methods=['GET'])
def get_jobs():
    try:
        hr_id = request.args.get('hrId')
        query = {}
        if hr_id:
            query['hrId'] = hr_id
            
        jobs = list(db.jobs.find(query).sort("createdAt", -1))
        for job in jobs:
            job['_id'] = str(job['_id'])
            if 'hrId' in job and isinstance(job['hrId'], ObjectId):
                job['hrId'] = str(job['hrId'])
        return jsonify({"jobs": jobs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jobs_bp.route('/<job_id>', methods=['GET'])
def get_job(job_id):
    try:
        if not ObjectId.is_valid(job_id):
            return jsonify({"error": "Invalid Job ID"}), 400
            
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404
            
        job['_id'] = str(job['_id'])
        if 'hrId' in job and isinstance(job['hrId'], ObjectId):
            job['hrId'] = str(job['hrId'])
        return jsonify(job)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jobs_bp.route('/<job_id>/parse', methods=['POST'])
def parse_job_description(job_id):
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404
            
        parsed_data = ai_service.parse_job_description(job['rawText'])
        
        # Calculate skill weights (Stage 2 logic simplified here)
        total_importance = sum(skill['importance'] for skill in parsed_data['requiredSkills'])
        skill_weights = []
        if total_importance > 0:
            for skill in parsed_data['requiredSkills']:
                skill_weights.append({
                    'skill': skill['skill'],
                    'weight': round(skill['importance'] / total_importance, 3),
                    'importance': skill['importance']
                })
        
        db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "parsedData": parsed_data,
                "skillWeights": skill_weights,
                "parsedAt": datetime.now()
            }}
        )
        return jsonify({"parsedData": parsed_data, "skillWeights": skill_weights})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@jobs_bp.route('/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    try:
        if not ObjectId.is_valid(job_id):
            return jsonify({"error": "Invalid Job ID"}), 400
            
        # Check if job exists
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        # Delete associated data
        db.applications.delete_many({"jobId": ObjectId(job_id)})
        db.assessments.delete_many({"jobId": ObjectId(job_id)})
        db.rankings.delete_many({"jobId": ObjectId(job_id)})
        
        # Delete the job
        db.jobs.delete_one({"_id": ObjectId(job_id)})
        
        return jsonify({"message": "Job and associated data deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
