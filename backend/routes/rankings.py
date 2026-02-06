from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from backend.utils.db import db
from datetime import datetime

rankings_bp = Blueprint('rankings', __name__)

@rankings_bp.route('/job/<job_id>/generate', methods=['POST'])
def generate_rankings(job_id):
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404

        # In a real scenario, we'd filter by status="completed", but for this MVP we might just take all
        assessments = list(db.assessments.find({"jobId": ObjectId(job_id)}))
        
        rankings = []
        
        for assessment in assessments:
            # Calculate mock score if not present (Stage 4 logic simplified)
            # In a real app, this might be done at "submit assessment" completion time
            # We'll do it on the fly here if missing
            
            responses = assessment.get('responses', [])
            score = 0
            if responses:
                correct = sum(1 for r in responses if r.get('isCorrect'))
                score = (correct / len(responses)) * 100
                
            # Mock candidate
            candidate_id = assessment.get('candidateId', 'unknown')
            
            rankings.append({
                'candidateId': candidate_id,
                'rawScore': score,
                'weightedScore': score, # Simplified
                'rank': 0 # To be assigned
            })
            
        # Sort and rank
        rankings.sort(key=lambda x: x['weightedScore'], reverse=True)
        for i, r in enumerate(rankings):
            r['rank'] = i + 1
            
        # Save rankings
        db.rankings.update_one(
            {"jobId": ObjectId(job_id)},
            {"$set": {
                "rankings": rankings,
                "generatedAt": datetime.now()
            }},
            upsert=True
        )
        
        return jsonify({"rankings": rankings})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@rankings_bp.route('/job/<job_id>', methods=['GET'])
def get_rankings(job_id):
    ranking_doc = db.rankings.find_one({"jobId": ObjectId(job_id)})
    if not ranking_doc:
        return jsonify({"rankings": []})
    
    # Convert ObjectIds to strings for JSON serialization if necessary, 
    # though valid JSON types usually suffice. ranking_doc['_id'] is ObjectId
    ranking_doc['_id'] = str(ranking_doc['_id'])
    ranking_doc['jobId'] = str(ranking_doc['jobId'])
    
    return jsonify(ranking_doc)
