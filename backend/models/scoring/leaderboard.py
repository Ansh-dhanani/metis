"""
Leaderboard Service

Provides functionality for:
- Aggregating candidate scores
- Generating and storing leaderboards
- Filtering and querying rankings
- Statistics and insights
"""

from typing import Dict, List, Optional
from datetime import datetime

from .state import LeaderboardState, LeaderboardEntry
from .langgraph_model import run_batch_scoring
from .nodes.shortlist import get_shortlist_statistics


class LeaderboardService:
    """
    Service class for managing job leaderboards.
    
    Integrates with the LangGraph scoring pipeline to generate
    and manage candidate rankings.
    """
    
    def __init__(self, db=None):
        """
        Initialize leaderboard service.
        
        Args:
            db: Optional database connection (MongoDB-like)
        """
        self.db = db
        self._cache: Dict[str, LeaderboardState] = {}
    
    def generate_leaderboard(
        self,
        job_id: str,
        job_title: str,
        skill_weights: List[Dict],
        candidates: List[Dict],
        save_to_db: bool = True
    ) -> LeaderboardState:
        """
        Generate a complete leaderboard for a job.
        
        Runs the LangGraph scoring pipeline on all candidates
        and produces a ranked leaderboard.
        
        Args:
            job_id: Job posting ID
            job_title: Job title
            skill_weights: Skill weights from parsed JD
            candidates: List of candidate data
            save_to_db: Whether to persist to database
            
        Returns:
            Complete leaderboard state
        """
        # Run batch scoring through LangGraph pipeline
        result = run_batch_scoring(
            job_id=job_id,
            job_title=job_title,
            skill_weights=skill_weights,
            candidates=candidates
        )
        
        # Create leaderboard state
        leaderboard: LeaderboardState = {
            'job_id': result['job_id'],
            'job_title': result['job_title'],
            'total_applicants': result['total_applicants'],
            'entries': result['entries'],
            'round_1_count': result['round_1_count'],
            'round_2_count': result['round_2_count'],
            'rejected_count': result['rejected_count'],
            'generated_at': result['generated_at']
        }
        
        # Cache result
        self._cache[job_id] = leaderboard
        
        # Persist to database if available
        if save_to_db and self.db:
            self._save_to_db(leaderboard)
        
        return leaderboard
    
    def get_leaderboard(
        self,
        job_id: str,
        limit: Optional[int] = None,
        offset: int = 0,
        status_filter: Optional[str] = None
    ) -> Dict:
        """
        Retrieve leaderboard for a job with optional filtering.
        
        Args:
            job_id: Job posting ID
            limit: Maximum number of entries to return
            offset: Starting offset for pagination
            status_filter: Filter by shortlist status
            
        Returns:
            Filtered leaderboard data
        """
        # Check cache first
        if job_id in self._cache:
            leaderboard = self._cache[job_id]
        elif self.db:
            leaderboard = self._load_from_db(job_id)
            if leaderboard:
                self._cache[job_id] = leaderboard
        else:
            return {'error': 'Leaderboard not found', 'job_id': job_id}
        
        if not leaderboard:
            return {'error': 'Leaderboard not found', 'job_id': job_id}
        
        # Apply filters
        entries = leaderboard['entries']
        
        if status_filter:
            entries = [e for e in entries if e['shortlist_status'] == status_filter]
        
        # Apply pagination
        total_filtered = len(entries)
        entries = entries[offset:offset + limit] if limit else entries[offset:]
        
        return {
            'job_id': leaderboard['job_id'],
            'job_title': leaderboard['job_title'],
            'total_applicants': leaderboard['total_applicants'],
            'total_filtered': total_filtered,
            'entries': entries,
            'round_1_count': leaderboard['round_1_count'],
            'round_2_count': leaderboard['round_2_count'],
            'rejected_count': leaderboard['rejected_count'],
            'generated_at': leaderboard['generated_at'],
            'pagination': {
                'offset': offset,
                'limit': limit,
                'has_more': (offset + len(entries)) < total_filtered
            }
        }
    
    def get_shortlist(
        self,
        job_id: str,
        round_number: int
    ) -> Dict:
        """
        Get candidates shortlisted for a specific round.
        
        Args:
            job_id: Job posting ID
            round_number: 1 or 2
            
        Returns:
            Shortlisted candidates for the round
        """
        status = f'round_{round_number}'
        result = self.get_leaderboard(job_id, status_filter=status)
        
        if 'error' in result:
            return result
        
        return {
            'job_id': job_id,
            'round': round_number,
            'shortlisted_count': len(result['entries']),
            'total_applicants': result['total_applicants'],
            'shortlist_rate': round(
                len(result['entries']) / result['total_applicants'] * 100
                if result['total_applicants'] > 0 else 0,
                1
            ),
            'candidates': result['entries']
        }
    
    def get_candidate_details(
        self,
        job_id: str,
        candidate_id: str
    ) -> Optional[LeaderboardEntry]:
        """
        Get detailed scoring information for a specific candidate.
        
        Args:
            job_id: Job posting ID
            candidate_id: Candidate ID
            
        Returns:
            Candidate's leaderboard entry or None
        """
        leaderboard = self.get_leaderboard(job_id)
        
        if 'error' in leaderboard:
            return None
        
        for entry in leaderboard['entries']:
            if entry['candidate_id'] == candidate_id:
                return entry
        
        return None
    
    def get_statistics(self, job_id: str) -> Dict:
        """
        Get comprehensive statistics for a job's leaderboard.
        
        Args:
            job_id: Job posting ID
            
        Returns:
            Statistics dictionary
        """
        leaderboard = self.get_leaderboard(job_id)
        
        if 'error' in leaderboard:
            return leaderboard
        
        entries = leaderboard['entries']
        
        if not entries:
            return {
                'job_id': job_id,
                'message': 'No candidates to analyze'
            }
        
        scores = [e['final_score'] for e in entries]
        weighted_scores = [e['weighted_score'] for e in entries]
        integrity_scores = [e['integrity_score'] for e in entries]
        
        return {
            'job_id': job_id,
            'job_title': leaderboard['job_title'],
            'total_applicants': len(entries),
            'shortlist_summary': {
                'round_2': leaderboard['round_2_count'],
                'round_1': leaderboard['round_1_count'],
                'rejected': leaderboard['rejected_count']
            },
            'score_distribution': {
                'final_score': {
                    'min': round(min(scores), 2),
                    'max': round(max(scores), 2),
                    'avg': round(sum(scores) / len(scores), 2),
                    'median': round(sorted(scores)[len(scores) // 2], 2)
                },
                'weighted_score': {
                    'min': round(min(weighted_scores), 2),
                    'max': round(max(weighted_scores), 2),
                    'avg': round(sum(weighted_scores) / len(weighted_scores), 2)
                },
                'integrity_score': {
                    'min': round(min(integrity_scores), 2),
                    'max': round(max(integrity_scores), 2),
                    'avg': round(sum(integrity_scores) / len(integrity_scores), 2)
                }
            },
            'consistency_issues': {
                'candidates_with_issues': sum(
                    1 for e in entries if e['has_consistency_issues']
                ),
                'percentage': round(
                    sum(1 for e in entries if e['has_consistency_issues']) / len(entries) * 100,
                    1
                )
            },
            'generated_at': leaderboard['generated_at']
        }
    
    def _save_to_db(self, leaderboard: LeaderboardState):
        """Save leaderboard to database."""
        if self.db:
            self.db.leaderboards.update_one(
                {'job_id': leaderboard['job_id']},
                {'$set': leaderboard},
                upsert=True
            )
    
    def _load_from_db(self, job_id: str) -> Optional[LeaderboardState]:
        """Load leaderboard from database."""
        if self.db:
            return self.db.leaderboards.find_one({'job_id': job_id})
        return None
