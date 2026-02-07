from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from services.ai_service import ai_service
from utils.db import db
from datetime import datetime

interview_bp = Blueprint('interview', __name__)

@interview_bp.route('/generate', methods=['POST'])
def generate_interview_questions():
    try:
        data = request.json
        assessment_id = data.get('assessmentId')
        if not assessment_id:
             return jsonify({"error": "assessmentId required"}), 400

        assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
            
        # Mock logic to determine strengths/weaknesses from assessment
        # In this MVP, we'll pick random or use what we have
        questions = {
            'strengths': [],
            'weaknesses': [],
            'clarifications': []
        }
        
        # Determine "skills" from the assessment questions
        skills_seen = set()
        for q in assessment.get('questions', []):
            skills_seen.add(q['skill'])
            
        for skill in skills_seen:
            # Mock random logic for strength vs weakness
            # Generate one strength question
            q_strength = ai_service.generate_interview_question(
                skill=skill,
                type='depth_probe',
                context="Candidate showed good understanding."
            )
            questions['strengths'].append({"skill": skill, "question": q_strength})
            
        # Save to DB
        interview_doc = {
            'assessmentId': ObjectId(assessment_id),
            'questions': questions,
            'generatedAt': datetime.now()
        }
        result = db.interview_questions.insert_one(interview_doc)
        
        return jsonify({"interviewId": str(result.inserted_id), "questions": questions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@interview_bp.route('/assessment/<assessment_id>', methods=['GET'])
def get_interview_questions(assessment_id):
    docs = list(db.interview_questions.find({"assessmentId": ObjectId(assessment_id)}))
    for d in docs:
        d['_id'] = str(d['_id'])
        d['assessmentId'] = str(d['assessmentId'])
    
    return jsonify(docs)
