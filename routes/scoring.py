"""
Scoring API Routes

Flask blueprint for the scoring model endpoints:
- POST /api/scoring/calculate - Run scoring pipeline
- POST /api/scoring/batch - Batch score multiple candidates
- POST /api/scoring/model3 - Run Model 3 with Model 1 & 2 inputs
- GET /api/scoring/demo - Demo with sample data
- GET /api/scoring/model1-eval - Load Model 1 evaluations from hackathon
- GET /api/leaderboard/<job_id> - Get leaderboard
- GET /api/shortlist/<job_id>/<round> - Get shortlisted candidates

Integrates with LangGraph 1.0.8 and Groq API via LangChain.
"""

from flask import Blueprint, request, jsonify

# Import scoring model components
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scoring_model.langgraph_model import (
    run_scoring_pipeline, 
    run_batch_scoring,
    run_model3_pipeline
)
from scoring_model.leaderboard import LeaderboardService
from scoring_model.sample_data import generate_sample_dataset, get_demo_data
from scoring_model.groq_service import get_groq_service
from scoring_model.model1_adapter import integrate_with_model3, process_evaluations_directory

scoring_bp = Blueprint('scoring', __name__, url_prefix='/api/scoring')
leaderboard_bp = Blueprint('leaderboard', __name__, url_prefix='/api/leaderboard')
shortlist_bp = Blueprint('shortlist', __name__, url_prefix='/api/shortlist')

# Initialize leaderboard service (without DB for now)
leaderboard_service = LeaderboardService()


# ==================== SCORING ROUTES ====================

@scoring_bp.route('/calculate', methods=['POST'])
def calculate_score():
    """
    Calculate score for a single candidate.
    
    Request Body:
    {
        "candidate_id": "...",
        "candidate_name": "...",
        "job_id": "...",
        "job_title": "...",
        "skill_scores": [...],
        "skill_weights": [...],
        "resume_claims": [...]
    }
    
    Response:
    {
        "candidate_id": "...",
        "weighted_score": 85.5,
        "integrity_score": 92.0,
        "final_score": 78.66,
        "shortlist_status": "round_1",
        ...
    }
    """
    try:
        data = request.json
        
        result = run_scoring_pipeline(
            candidate_id=data['candidate_id'],
            candidate_name=data['candidate_name'],
            job_id=data['job_id'],
            job_title=data['job_title'],
            skill_scores=data['skill_scores'],
            skill_weights=data['skill_weights'],
            resume_claims=data.get('resume_claims', [])
        )
        
        return jsonify({
            'success': True,
            'result': {
                'candidate_id': result['candidate_id'],
                'candidate_name': result['candidate_name'],
                'weighted_score': result['weighted_score'],
                'integrity_score': result['integrity_score'],
                'final_score': result['final_score'],
                'shortlist_status': result['shortlist_status'],
                'skill_contributions': result['skill_contributions'],
                'consistency_flags': result['consistency_flags']
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@scoring_bp.route('/model3', methods=['POST'])
def run_model3():
    """
    Run Model 3 pipeline using outputs from Model 1 and Model 2.
    
    This is the main integration endpoint that combines:
    - Model 1 output: Job data with skill_weights
    - Model 2 output: Candidate evaluations with skill_scores
    
    Request Body:
    {
        "model1_outputs": [{
            "job_id": "...",
            "job_title": "...",
            "skill_weights": [...]
        }],
        "model2_outputs": [{
            "candidate_id": "...",
            "candidate_name": "...",
            "skill_scores": [...],
            "resume_claims": [...]
        }, ...]
    }
    
    Response:
    {
        "success": true,
        "leaderboard": {...},
        "shortlist_summary": {...}
    }
    """
    try:
        data = request.json
        
        result = run_model3_pipeline(
            model1_outputs=data['model1_outputs'],
            model2_outputs=data['model2_outputs']
        )
        
        return jsonify({
            'success': True,
            'leaderboard': result,
            'shortlist_summary': {
                'total_applicants': result['total_applicants'],
                'round_2_shortlisted': result['round_2_count'],
                'round_1_shortlisted': result['round_1_count'],
                'rejected': result['rejected_count']
            }
        })
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 400


@scoring_bp.route('/batch', methods=['POST'])
def batch_calculate():
    """
    Calculate scores for multiple candidates and generate leaderboard.
    
    Request Body:
    {
        "job_id": "...",
        "job_title": "...",
        "skill_weights": [...],
        "candidates": [...]
    }
    """
    try:
        data = request.json
        
        leaderboard = leaderboard_service.generate_leaderboard(
            job_id=data['job_id'],
            job_title=data['job_title'],
            skill_weights=data['skill_weights'],
            candidates=data['candidates'],
            save_to_db=False
        )
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@scoring_bp.route('/demo', methods=['GET'])
def run_demo():
    """
    Run scoring with demo data.
    
    Returns: Complete leaderboard with demo candidates
    """
    try:
        demo_data = get_demo_data()
        
        leaderboard = leaderboard_service.generate_leaderboard(
            job_id=demo_data['job_id'],
            job_title=demo_data['job_title'],
            skill_weights=demo_data['skill_weights'],
            candidates=demo_data['candidates'],
            save_to_db=False
        )
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard,
            'statistics': leaderboard_service.get_statistics(demo_data['job_id'])
        })
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@scoring_bp.route('/generate', methods=['GET'])
def generate_data():
    """
    Generate random sample data.
    
    Query Params:
    - num_candidates: Number of candidates (default: 20)
    """
    try:
        num_candidates = request.args.get('num_candidates', 20, type=int)
        data = generate_sample_dataset(num_candidates=num_candidates)
        
        leaderboard = leaderboard_service.generate_leaderboard(
            job_id=data['job_id'],
            job_title=data['job_title'],
            skill_weights=data['skill_weights'],
            candidates=data['candidates'],
            save_to_db=False
        )
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard,
            'statistics': leaderboard_service.get_statistics(data['job_id'])
        })
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@scoring_bp.route('/model1-eval', methods=['GET'])
def load_model1_evaluations():
    """
    Load and process Model 1 (METIS Core) evaluations from hackathon folder.
    
    This endpoint:
    1. Reads evaluation JSON files from hackathon/hackathon/evaluations/
    2. Converts them to Model 3 input format
    3. Runs through the scoring pipeline
    4. Returns the leaderboard with rankings and shortlist decisions
    
    Query Params:
    - eval_dir: Custom evaluations directory (default: hackathon/hackathon/evaluations)
    
    Returns:
        Complete leaderboard with Model 1 candidates scored through Model 3
    """
    try:
        # Default to hackathon evaluations directory
        eval_dir = request.args.get('eval_dir', 'hackathon/hackathon/evaluations')
        
        # Run integration
        result = integrate_with_model3(eval_dir)
        
        if "error" in result:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
        
        # Get processed data for statistics
        data = process_evaluations_directory(eval_dir)
        
        # Store in leaderboard service for caching
        leaderboard_service._leaderboards[result['job_id']] = {
            'entries': result['entries'],
            'job_title': result['job_title'],
            'total_applicants': result['total_applicants']
        }
        
        return jsonify({
            'success': True,
            'source': 'Model 1 (METIS Core) Evaluations',
            'evaluation_directory': eval_dir,
            'leaderboard': result,
            'statistics': {
                'total_applicants': result['total_applicants'],
                'shortlist_summary': {
                    'round_2': result['round_2_count'],
                    'round_1': result['round_1_count'],
                    'rejected': result['rejected_count']
                },
                'score_distribution': result.get('statistics', {}).get('score_distribution', {}),
                'consistency_issues': result.get('statistics', {}).get('consistency_issues', {})
            }
        })
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@scoring_bp.route('/explain/<candidate_id>', methods=['POST'])
def explain_score(candidate_id):
    """
    Generate AI explanation for a candidate's score.
    
    Uses Groq API via LangChain for natural language explanation.
    
    Request Body:
    {
        "job_id": "...",
        "candidate_name": "...",
        "weighted_score": 85.5,
        "integrity_score": 92.0,
        "final_score": 78.66,
        "skill_breakdown": [...],
        "consistency_flags": [...]
    }
    """
    try:
        data = request.json
        groq_service = get_groq_service()
        
        explanation = groq_service.generate_score_explanation(
            candidate_name=data['candidate_name'],
            weighted_score=data['weighted_score'],
            integrity_score=data['integrity_score'],
            final_score=data['final_score'],
            skill_breakdown=data.get('skill_breakdown', []),
            consistency_flags=data.get('consistency_flags', [])
        )
        
        return jsonify({
            'success': True,
            'candidate_id': candidate_id,
            'explanation': explanation,
            'ai_powered': groq_service.is_available()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@scoring_bp.route('/combined', methods=['POST'])
def combined_scoring():
    """
    Combined scoring: Merge Model 1 (Resume) + Model 2 (Interview) scores.
    
    This is the unified endpoint that produces the final leaderboard
    combining Round 1 (resume evaluation) and Round 2 (interview) scores.
    
    Request Body:
    {
        "job_id": "...",
        "job_title": "...",
        "candidates": [
            {
                "candidate_id": "...",
                "candidate_name": "...",
                "model1_score": 75.0,  # Resume score (Round 1)
                "model2_score": 82.0,  # Interview score (Round 2)
                "skill_scores": [...],
                "resume_claims": [...]
            }
        ],
        "weights": {
            "model1": 0.4,  # Resume weight
            "model2": 0.6   # Interview weight
        }
    }
    
    Returns:
        Unified leaderboard with final scores
    """
    try:
        data = request.json
        
        job_id = data.get('job_id', 'job_combined')
        job_title = data.get('job_title', 'Combined Evaluation')
        candidates = data.get('candidates', [])
        weights = data.get('weights', {'model1': 0.4, 'model2': 0.6})
        
        model1_weight = weights.get('model1', 0.4)
        model2_weight = weights.get('model2', 0.6)
        
        entries = []
        
        for i, candidate in enumerate(candidates):
            m1_score = candidate.get('model1_score', 0)
            m2_score = candidate.get('model2_score', 0)
            
            # Calculate combined weighted score
            combined_score = (m1_score * model1_weight) + (m2_score * model2_weight)
            
            # Integrity score from skill consistency
            integrity_score = 95.0  # Default high for combined
            
            # Final score
            final_score = combined_score * (integrity_score / 100)
            
            # Determine shortlist status based on combined score
            if final_score >= 75 or (m1_score >= 70 and m2_score >= 70):
                shortlist_status = 'round_2'  # Advance to final round
            elif final_score >= 55 or m2_score >= 60:
                shortlist_status = 'round_1'  # Good potential
            else:
                shortlist_status = 'rejected'
            
            entries.append({
                'rank': i + 1,
                'candidate_id': candidate.get('candidate_id', f'cand_{i+1}'),
                'candidate_name': candidate.get('candidate_name', f'Candidate {i+1}'),
                'model1_score': m1_score,
                'model2_score': m2_score,
                'weighted_score': combined_score,
                'integrity_score': integrity_score,
                'final_score': round(final_score, 1),
                'shortlist_status': shortlist_status
            })
        
        # Sort by final score
        entries.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Re-rank
        for i, entry in enumerate(entries):
            entry['rank'] = i + 1
        
        # Count statuses
        round2_count = sum(1 for e in entries if e['shortlist_status'] == 'round_2')
        round1_count = sum(1 for e in entries if e['shortlist_status'] == 'round_1')
        rejected_count = sum(1 for e in entries if e['shortlist_status'] == 'rejected')
        
        result = {
            'job_id': job_id,
            'job_title': job_title,
            'total_applicants': len(entries),
            'round_2_count': round2_count,
            'round_1_count': round1_count,
            'rejected_count': rejected_count,
            'entries': entries,
            'weights_used': {
                'model1_resume': model1_weight,
                'model2_interview': model2_weight
            }
        }
        
        # Cache in leaderboard service
        leaderboard_service._leaderboards[job_id] = {
            'entries': entries,
            'job_title': job_title,
            'total_applicants': len(entries)
        }
        
        return jsonify({
            'success': True,
            'source': 'Combined Model 1 + Model 2 Scoring',
            'leaderboard': result
        })
        
    except Exception as e:
        import traceback
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# ==================== LEADERBOARD ROUTES ====================

@leaderboard_bp.route('/<job_id>', methods=['GET'])
def get_leaderboard(job_id):
    """
    Get leaderboard for a job.
    
    Query Params:
    - limit: Max entries to return
    - offset: Starting offset
    - status: Filter by shortlist status (round_1, round_2, rejected)
    """
    limit = request.args.get('limit', type=int)
    offset = request.args.get('offset', 0, type=int)
    status = request.args.get('status')
    
    result = leaderboard_service.get_leaderboard(
        job_id=job_id,
        limit=limit,
        offset=offset,
        status_filter=status
    )
    
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)


@leaderboard_bp.route('/<job_id>/statistics', methods=['GET'])
def get_statistics(job_id):
    """Get statistics for a job's leaderboard."""
    result = leaderboard_service.get_statistics(job_id)
    
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)


@leaderboard_bp.route('/<job_id>/candidate/<candidate_id>', methods=['GET'])
def get_candidate_details(job_id, candidate_id):
    """Get detailed scoring for a specific candidate."""
    result = leaderboard_service.get_candidate_details(job_id, candidate_id)
    
    if result is None:
        return jsonify({
            'error': 'Candidate not found',
            'job_id': job_id,
            'candidate_id': candidate_id
        }), 404
    
    return jsonify(result)


# ==================== SHORTLIST ROUTES ====================

@shortlist_bp.route('/<job_id>/<int:round_number>', methods=['GET'])
def get_shortlist(job_id, round_number):
    """
    Get shortlisted candidates for a round.
    
    Args:
        job_id: Job ID
        round_number: 1 or 2
    
    Returns:
        Candidates shortlisted for Round 1 or Round 2
    """
    if round_number not in [1, 2]:
        return jsonify({
            'error': 'Round must be 1 or 2',
            'round': round_number
        }), 400
    
    result = leaderboard_service.get_shortlist(job_id, round_number)
    
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)


# ==================== DEMO PAGE ROUTE ====================

@scoring_bp.route('/demo-page', methods=['GET'])
def demo_page():
    """Serve the demo HTML page."""
    from flask import send_from_directory
    return send_from_directory('demo', 'leaderboard_demo.html')
