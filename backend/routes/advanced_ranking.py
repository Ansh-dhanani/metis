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
            "jobId": ObjectId(job_id),
            "metisEvaluation": {"$exists": True}
        }))
        
        if not applications:
            # Check if there are any applications at all
            all_applications = list(db.applications.find({"jobId": ObjectId(job_id)}))
            if not all_applications:
                return jsonify({"error": "No applications found for this job"}), 400
            else:
                return jsonify({
                    "error": "No evaluated applications found",
                    "details": f"Found {len(all_applications)} application(s), but none have been evaluated yet. Please run 'Evaluate Applications' first."
                }), 400
        
        # Sort applications by final score (if available) or metis score
        # Priority: finalScore > metisScore
        for app in applications:
            if 'finalScore' not in app:
                app['finalScore'] = app.get('metisScore', 0)
        
        # Sort by final score descending
        applications.sort(key=lambda x: x.get('finalScore', 0), reverse=True)
        
        # Create leaderboard entries
        leaderboard_entries = []
        round_1_count = 0
        round_2_count = 0
        rejected_count = 0
        
        for rank, app in enumerate(applications, start=1):
            final_score = app.get('finalScore', app.get('metisScore', 0))
            round1_score = app.get('round1Score', app.get('metisScore', 0))
            round2_score = app.get('round2Score', 0)
            
            # Determine status based on final score
            if final_score >= 70:
                status = 'round_2'
                round_2_count += 1
                shortlist_reason = 'High combined score (Resume + Interview)'
            elif final_score >= 50:
                status = 'round_1'
                round_1_count += 1
                shortlist_reason = 'Moderate score, needs review'
            else:
                status = 'rejected'
                rejected_count += 1
                shortlist_reason = 'Score below threshold'
            
            profile = app.get('profileSnapshot', {})
            candidate_name = f"{profile.get('firstName', '')} {profile.get('lastName', '')}".strip() or 'Unknown'
            
            entry = {
                'rank': rank,
                'candidate_id': str(app.get('candidateId', '')),
                'candidate_name': candidate_name,
                'final_score': round(final_score, 1),
                'round1_score': round(round1_score, 1),
                'round2_score': round(round2_score, 1),
                'has_interview': 'interviewScore' in app,
                'status': status,
                'shortlist_reason': shortlist_reason,
                'metis_evaluation': app.get('metisEvaluation', {}),
                'interview_evaluation': app.get('interviewEvaluation', {})
            }
            
            leaderboard_entries.append(entry)
        
        # Create leaderboard object
        leaderboard = {
            'job_id': job_id,
            'job_title': job.get('title', ''),
            'total_applicants': len(applications),
            'round_1_count': round_1_count,
            'round_2_count': round_2_count,
            'rejected_count': rejected_count,
            'entries': leaderboard_entries,
            'generated_at': datetime.now().isoformat()
        }
        
        # Save to database
        db.leaderboards.update_one(
            {'job_id': job_id},
            {'$set': leaderboard},
            upsert=True
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
