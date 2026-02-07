from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from utils.db import db
from datetime import datetime

rankings_bp = Blueprint('rankings', __name__)

@rankings_bp.route('/job/<job_id>/generate', methods=['POST'])
def generate_rankings(job_id):
    try:
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404

        # Get completed assessments
        assessments = list(db.assessments.find({"jobId": ObjectId(job_id), "status": "completed"}))
        
        if not assessments:
            return jsonify({"error": "No completed assessments found"}), 400
        
        rankings = []
        skill_weights = job.get('skillWeights', [])
        
        for assessment in assessments:
            responses = assessment.get('responses', [])
            candidate_id = assessment.get('candidateId', 'unknown')
            
            # Get candidate info
            try:
                candidate = db.users.find_one({"_id": ObjectId(candidate_id)}) if ObjectId.is_valid(candidate_id) else None
                candidate_name = f"{candidate.get('firstName', '')} {candidate.get('lastName', '')}".strip() if candidate else candidate_id
            except:
                candidate_name = candidate_id
                
            # Calculate skill-wise scores
            skill_scores = {}
            for skill_weight in skill_weights:
                skill_name = skill_weight['skill']
                skill_responses = [r for r in responses if r.get('skill') == skill_name]
                
                if skill_responses:
                    correct = sum(1 for r in skill_responses if r.get('isCorrect'))
                    skill_scores[skill_name] = (correct / len(skill_responses)) * 100
                else:
                    skill_scores[skill_name] = 0
            
            # Calculate weighted score
            weighted_score = 0
            for skill_weight in skill_weights:
                skill_name = skill_weight['skill']
                weight = skill_weight['weight']
                score = skill_scores.get(skill_name, 0)
                weighted_score += score * weight
            
            # Determine strengths and weaknesses
            sorted_skills = sorted(skill_scores.items(), key=lambda x: x[1], reverse=True)
            strengths = [s[0] for s in sorted_skills[:3] if s[1] >= 70]
            weaknesses = [s[0] for s in sorted_skills[-3:] if s[1] < 60]
            
            # Determine recommendation
            if weighted_score >= 80:
                recommendation = "strong_hire"
            elif weighted_score >= 65:
                recommendation = "hire"
            elif weighted_score >= 50:
                recommendation = "maybe"
            else:
                recommendation = "no_hire"
            
            rankings.append({
                'candidateId': candidate_id,
                'candidateName': candidate_name,
                'weightedScore': round(weighted_score, 2),
                'skillBreakdown': skill_scores,
                'strengths': strengths,
                'weaknesses': weaknesses,
                'recommendation': recommendation,
                'credibilityScore': 100,  # Placeholder
                'rank': 0  # To be assigned
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

@rankings_bp.route('/', methods=['GET'])
def get_all_rankings():
    """Get all rankings across all jobs"""
    try:
        all_rankings = []
        ranking_docs = db.rankings.find()
        
        for ranking_doc in ranking_docs:
            # Get job info for context
            job = db.jobs.find_one({"_id": ranking_doc.get('jobId')})
            job_title = job.get('title', 'Unknown Job') if job else 'Unknown Job'
            
            # Extract individual candidate rankings
            for ranking in ranking_doc.get('rankings', []):
                ranking['jobTitle'] = job_title
                ranking['jobId'] = str(ranking_doc.get('jobId'))
                all_rankings.append(ranking)
        
        return jsonify({"rankings": all_rankings})
    except Exception as e:
        print(f"Error fetching all rankings: {str(e)}")
        return jsonify({"error": str(e)}), 500

