from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from services.ai_service import ai_service
from utils.db import db
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
        "createdAt": datetime.now(),
        "questions": [],
        "responses": []
    }
    result = db.assessments.insert_one(assessment_doc)
    return jsonify({"assessmentId": str(result.inserted_id), "message": "Assessment created"}), 201

@assessments_bp.route('/<assessment_id>', methods=['GET'])
def get_assessment(assessment_id):
    try:
        if not ObjectId.is_valid(assessment_id):
            return jsonify({"error": "Invalid assessment ID"}), 400
            
        assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
            
        assessment['_id'] = str(assessment['_id'])
        if isinstance(assessment.get('jobId'), ObjectId):
            assessment['jobId'] = str(assessment['jobId'])
        if isinstance(assessment.get('candidateId'), ObjectId):
            assessment['candidateId'] = str(assessment['candidateId'])
        if isinstance(assessment.get('applicationId'), ObjectId):
            assessment['applicationId'] = str(assessment['applicationId'])
        return jsonify(assessment)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@assessments_bp.route('/job/<job_id>', methods=['GET'])
def get_job_assessments(job_id):
    try:
        if not ObjectId.is_valid(job_id):
            return jsonify({"error": "Invalid job ID"}), 400
            
        assessments = list(db.assessments.find({"jobId": ObjectId(job_id)}))
        for assessment in assessments:
            assessment['_id'] = str(assessment['_id'])
            if isinstance(assessment.get('jobId'), ObjectId):
                assessment['jobId'] = str(assessment['jobId'])
            if isinstance(assessment.get('candidateId'), ObjectId):
                assessment['candidateId'] = str(assessment['candidateId'])
            if isinstance(assessment.get('applicationId'), ObjectId):
                assessment['applicationId'] = str(assessment['applicationId'])
        return jsonify(assessments)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@assessments_bp.route('/candidate/<candidate_id>', methods=['GET'])
def get_candidate_assessments(candidate_id):
    try:
        # Support both string and ObjectId candidate IDs
        if ObjectId.is_valid(candidate_id):
            assessments = list(db.assessments.find({"candidateId": ObjectId(candidate_id)}))
        else:
            assessments = list(db.assessments.find({"candidateId": candidate_id}))
            
        for assessment in assessments:
            assessment['_id'] = str(assessment['_id'])
            if isinstance(assessment.get('jobId'), ObjectId):
                assessment['jobId'] = str(assessment['jobId'])
            if isinstance(assessment.get('candidateId'), ObjectId):
                assessment['candidateId'] = str(assessment['candidateId'])
            if isinstance(assessment.get('applicationId'), ObjectId):
                assessment['applicationId'] = str(assessment['applicationId'])
        return jsonify(assessments)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@assessments_bp.route('/<assessment_id>/complete', methods=['POST'])
def complete_assessment(assessment_id):
    try:
        assessment = db.assessments.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
        
        # Calculate overall score
        responses = assessment.get('responses', [])
        if responses:
            correct = sum(1 for r in responses if r.get('isCorrect'))
            overall_score = (correct / len(responses)) * 100
        else:
            overall_score = 0
            
        db.assessments.update_one(
            {"_id": ObjectId(assessment_id)},
            {"$set": {
                "status": "completed",
                "completedAt": datetime.now(),
                "overallScore": overall_score
            }}
        )
        
        return jsonify({"message": "Assessment completed", "score": overall_score})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@assessments_bp.route('/', methods=['GET'])
def get_all_assessments():
    """Get all assessments"""
    try:
        assessments = list(db.assessments.find())
        for assessment in assessments:
            assessment['_id'] = str(assessment['_id'])
            # Convert all ObjectId fields to strings
            if 'jobId' in assessment and isinstance(assessment['jobId'], ObjectId):
                assessment['jobId'] = str(assessment['jobId'])
            if 'candidateId' in assessment and isinstance(assessment['candidateId'], ObjectId):
                assessment['candidateId'] = str(assessment['candidateId'])
            if 'applicationId' in assessment and isinstance(assessment['applicationId'], ObjectId):
                assessment['applicationId'] = str(assessment['applicationId'])
        return jsonify({"assessments": assessments})
    except Exception as e:
        print(f"Error fetching all assessments: {str(e)}")
        return jsonify({"error": str(e)}), 500
