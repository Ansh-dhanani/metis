"""
Advanced Ranking Routes

Integrates Model 3 (LangGraph Scoring Pipeline) for intelligent candidate ranking.
"""

from flask import Blueprint, request, jsonify
from bson import ObjectId
from datetime import datetime
import sys
import os

# Add models to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

try:
    from scoring.leaderboard import LeaderboardService
    from scoring.langgraph_model import run_scoring_pipeline, combine_model_scores
    SCORING_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Scoring models not available: {e}")
    SCORING_AVAILABLE = False

advanced_ranking_bp = Blueprint('advanced_ranking', __name__)

def get_db():
    """Get database instance."""
    from app import db
    return db


@advanced_ranking_bp.route('/generate/<job_id>', methods=['POST'])
def generate_advanced_rankings(job_id):
    """
    Generate advanced rankings using LangGraph scoring pipeline.
    
    This combines:
    - Model 1: METIS evaluation scores
    - Model 2: Interview performance (if available)
    - Model 3: LangGraph scoring and integrity checks
    """
    if not SCORING_AVAILABLE:
        return jsonify({"error": "Advanced scoring service unavailable"}), 503
    
    try:
        db = get_db()
        
        # Get job details
        job = db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            return jsonify({"error": "Job not found"}), 404
        
        # Get all applications with METIS scores
        applications = list(db.applications.find({
            "jobId": job_id,
            "metisEvaluation": {"$exists": True}
        }))
        
        if not applications:
            return jsonify({"error": "No evaluated applications found"}), 400
        
        # Prepare skill weights from job
        skill_weights = job.get('skillWeights', [])
        if not skill_weights:
            return jsonify({"error": "Job has no skill weights defined"}), 400
        
        # Prepare candidates data for scoring pipeline
        candidates = []
        for app in applications:
            metis_eval = app.get('metisEvaluation', {})
            section_scores = metis_eval.get('section_scores', {})
            
            # Map METIS scores to skill scores
            skill_scores = []
            for sw in skill_weights:
                skill = sw.get('skill', '')
                # Use skill evidence score as proxy
                score = section_scores.get('skill_evidence', 0) * 100 / 30  # Normalize to 0-100
                skill_scores.append({
                    'skill': skill,
                    'score': score
                })
            
            # Extract resume claims from METIS evaluation
            resume_claims = []
            for skill in metis_eval.get('strength_signals', []):
                resume_claims.append({
                    'skill': skill,
                    'claimed_level': 'proficient'
                })
            
            candidates.append({
                'candidate_id': str(app['candidateId']),
                'candidate_name': app.get('profileSnapshot', {}).get('firstName', '') + ' ' + 
                                app.get('profileSnapshot', {}).get('lastName', ''),
                'skill_scores': skill_scores,
                'resume_claims': resume_claims
            })
        
        # Initialize leaderboard service
        leaderboard_service = LeaderboardService(db=db)
        
        # Generate leaderboard
        leaderboard = leaderboard_service.generate_leaderboard(
            job_id=job_id,
            job_title=job.get('title', ''),
            skill_weights=skill_weights,
            candidates=candidates,
            save_to_db=True
        )
        
        return jsonify({
            "message": "Advanced rankings generated successfully",
            "leaderboard": {
                "job_id": leaderboard['job_id'],
                "job_title": leaderboard['job_title'],
                "total_applicants": leaderboard['total_applicants'],
                "round_1_count": leaderboard['round_1_count'],
                "round_2_count": leaderboard['round_2_count'],
                "rejected_count": leaderboard['rejected_count'],
                "top_candidates": leaderboard['entries'][:10],  # Top 10
                "generated_at": leaderboard['generated_at']
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@advanced_ranking_bp.route('/<job_id>', methods=['GET'])
def get_advanced_rankings(job_id):
    """
    Get advanced rankings for a job.
    
    Query params:
        - limit: Number of results (default: all)
        - offset: Pagination offset (default: 0)
        - status: Filter by status (round_1, round_2, rejected)
    """
    if not SCORING_AVAILABLE:
        return jsonify({"error": "Advanced scoring service unavailable"}), 503
    
    try:
        db = get_db()
        leaderboard_service = LeaderboardService(db=db)
        
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', default=0, type=int)
        status_filter = request.args.get('status')
        
        leaderboard = leaderboard_service.get_leaderboard(
            job_id=job_id,
            limit=limit,
            offset=offset,
            status_filter=status_filter
        )
        
        if not leaderboard:
            return jsonify({"error": "No rankings found. Generate rankings first."}), 404
        
        return jsonify(leaderboard), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@advanced_ranking_bp.route('/candidate/<candidate_id>', methods=['GET'])
def get_candidate_ranking(candidate_id):
    """Get ranking details for a specific candidate across all jobs."""
    if not SCORING_AVAILABLE:
        return jsonify({"error": "Advanced scoring service unavailable"}), 503
    
    try:
        db = get_db()
        
        # Find all rankings for this candidate
        rankings = list(db.leaderboards.find({
            "entries.candidate_id": candidate_id
        }))
        
        candidate_rankings = []
        for ranking in rankings:
            for entry in ranking.get('entries', []):
                if entry['candidate_id'] == candidate_id:
                    candidate_rankings.append({
                        'job_id': ranking['job_id'],
                        'job_title': ranking['job_title'],
                        'rank': entry['rank'],
                        'weighted_score': entry['weighted_score'],
                        'final_score': entry['final_score'],
                        'status': entry['status'],
                        'shortlist_reason': entry.get('shortlist_reason', '')
                    })
        
        return jsonify({
            "candidate_id": candidate_id,
            "rankings": candidate_rankings
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@advanced_ranking_bp.route('/statistics/<job_id>', methods=['GET'])
def get_ranking_statistics(job_id):
    """Get statistical insights for job rankings."""
    if not SCORING_AVAILABLE:
        return jsonify({"error": "Advanced scoring service unavailable"}), 503
    
    try:
        db = get_db()
        
        leaderboard = db.leaderboards.find_one({"job_id": job_id})
        if not leaderboard:
            return jsonify({"error": "No rankings found"}), 404
        
        entries = leaderboard.get('entries', [])
        
        if not entries:
            return jsonify({"error": "No ranking entries"}), 404
        
        # Calculate statistics
        scores = [e['final_score'] for e in entries]
        
        statistics = {
            'total_candidates': len(entries),
            'average_score': sum(scores) / len(scores),
            'median_score': sorted(scores)[len(scores) // 2],
            'min_score': min(scores),
            'max_score': max(scores),
            'round_1_count': sum(1 for e in entries if e['status'] == 'round_1'),
            'round_2_count': sum(1 for e in entries if e['status'] == 'round_2'),
            'rejected_count': sum(1 for e in entries if e['status'] == 'rejected'),
            'score_distribution': {
                'excellent (80-100)': sum(1 for s in scores if s >= 80),
                'good (60-79)': sum(1 for s in scores if 60 <= s < 80),
                'average (40-59)': sum(1 for s in scores if 40 <= s < 60),
                'poor (0-39)': sum(1 for s in scores if s < 40)
            }
        }
        
        return jsonify(statistics), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
