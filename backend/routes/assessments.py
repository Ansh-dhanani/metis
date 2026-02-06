from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from backend.services.ai_service import ai_service
from backend.utils.db import db
from datetime import datetime

assessments_bp = Blueprint('assessments', __name__)

@assessments_bp.route('/<assessment_id>/start', methods=['POST'])
def start_assessment(assessment_id):
    try:
        assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
             # Auto-create if not exists for testing ease, or return 404. 
             # The plan implies assessment is pre-created or linked to a candidate/job.
             # Let's assume the user passes a valid ID or we create one for a job if job_id is passed.
             # For strictness with the plan "Candidate starts assessment via /api/assessments/{id}/start",
             # we assume it exists. But to make it runnable with "dummy data", let's handle the case.
             return jsonify({"error": "Assessment not found"}), 404

        job = db.jobs.find_one({"_id": assessment['jobId']})
        if not job or not job.get('skillWeights'):
            return jsonify({"error": "Job not found or not parsed"}), 400
        
        # Generate initial questions
        questions = []
        for skill_weight in job['skillWeights']:
            question = ai_service.generate_question(
                skill=skill_weight['skill'],
                difficulty=5  # Start medium
            )
            questions.append(question)
        
        db.assessments.update_one(
            {"_id": ObjectId(assessment_id)},
            {"$set": {
                "questions": questions,
                "status": "in_progress",
                "startedAt": datetime.now(),
                "responses": []
            }}
        )
        
        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@assessments_bp.route('/create', methods=['POST'])
def create_assessment():
    # Helper endpoint to create a dummy assessment link
    data = request.json
    job_id = data.get('jobId')
    candidate_id = data.get('candidateId') # assume dummy candidate ID provided or we generate one
    
    if not job_id:
        return jsonify({"error": "jobId required"}), 400

    assessment_doc = {
        "jobId": ObjectId(job_id),
        "candidateId": candidate_id if candidate_id else "dummy_candidate_123",
        "status": "pending",
        "createdAt": datetime.now()
    }
    result = db.assessments.insert_one(assessment_doc)
    return jsonify({"assessmentId": str(result.inserted_id), "message": "Assessment created"}), 201

@assessments_bp.route('/<assessment_id>/submit', methods=['POST'])
def submit_answer(assessment_id):
    try:
        data = request.json
        assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
             return jsonify({"error": "Assessment not found"}), 404
        
        question_id = data.get('questionId')
        answer = data.get('answer')
        
        # Find current question
        question = next((q for q in assessment['questions'] if q['questionId'] == question_id), None)
        if not question:
            return jsonify({"error": "Question not found"}), 404
        
        is_correct = (answer == question['correctAnswer'])
        
        db.assessments.update_one(
            {"_id": ObjectId(assessment_id)},
            {"$push": {
                "responses": {
                    "questionId": question_id,
                    "answer": answer,
                    "isCorrect": is_correct,
                    "timestamp": datetime.now()
                }
            }}
        )
        
        # Determine next question difficulty or finish
        next_difficulty = min(question['difficulty'] + 2, 10) if is_correct else max(question['difficulty'] - 1, 1)
        next_question = ai_service.generate_question(question['skill'], next_difficulty)
        
        return jsonify({
            "isCorrect": is_correct,
            "explanation": question['explanation'],
            "nextQuestion": next_question
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
