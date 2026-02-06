from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from backend.services.ai_service import ai_service
from backend.utils.db import db
from datetime import datetime

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/', methods=['POST'])
def create_job():
    data = request.json
    job_doc = {
        "title": data.get("title", "Untitled Job"),
        "rawText": data.get("rawText", ""),
        "createdAt": datetime.now(),
        "parsedData": None,
        "skillWeights": None
    }
    result = db.jobs.insert_one(job_doc)
    return jsonify({"jobId": str(result.inserted_id), "message": "Job created successfully"}), 201

@jobs_bp.route('/', methods=['GET'])
def get_jobs():
    try:
        jobs = list(db.jobs.find().sort("createdAt", -1))
        for job in jobs:
            job['_id'] = str(job['_id'])
        return jsonify(jobs)
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
