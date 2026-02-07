"""
Shortlist Node

Determines shortlist status based on final score:
- Round 1: Top 30% OR score >= 70
- Round 2: Top 10% OR score >= 85

This node can operate on a single candidate or batch process
multiple candidates for comparative ranking.
"""

from typing import Dict, List, Literal
from ..state import ScoringState


# Shortlist thresholds (configurable)
ROUND_1_SCORE_THRESHOLD = 70
ROUND_1_PERCENTILE = 30  # Top 30%

ROUND_2_SCORE_THRESHOLD = 85
ROUND_2_PERCENTILE = 10  # Top 10%


def shortlist_node(state: ScoringState) -> Dict:
    """
    Determine shortlist status for a single candidate.
    
    Uses absolute thresholds (score-based) when processing individually.
    For percentile-based shortlisting, use batch_shortlist().
    
    Args:
        state: Current scoring state with final_score
        
    Returns:
        Updated state with shortlist_status
    """
    final_score = state.get('final_score', 0)
    
    # Determine status based on absolute thresholds
    if final_score >= ROUND_2_SCORE_THRESHOLD:
        status = 'round_2'
    elif final_score >= ROUND_1_SCORE_THRESHOLD:
        status = 'round_1'
    else:
        status = 'rejected'
    
    return {
        'shortlist_status': status
    }


def batch_shortlist(
    candidates: List[ScoringState],
    use_percentile: bool = True
) -> List[ScoringState]:
    """
    Batch process candidates for shortlisting with percentile-based logic.
    
    Combines both score thresholds and percentile ranks:
    - Round 2: Score >= 85 OR Top 10%
    - Round 1: Score >= 70 OR Top 30%
    - Rejected: Everyone else
    
    Args:
        candidates: List of scoring states with final_scores
        use_percentile: Whether to use percentile-based shortlisting
        
    Returns:
        Updated candidates with shortlist_status and rank
    """
    # Sort by final score descending
    sorted_candidates = sorted(
        candidates,
        key=lambda x: x.get('final_score', 0),
        reverse=True
    )
    
    total = len(sorted_candidates)
    round_2_cutoff_rank = int(total * (ROUND_2_PERCENTILE / 100))
    round_1_cutoff_rank = int(total * (ROUND_1_PERCENTILE / 100))
    
    results = []
    
    for idx, candidate in enumerate(sorted_candidates):
        rank = idx + 1
        final_score = candidate.get('final_score', 0)
        
        # Determine status using both score and percentile
        if use_percentile:
            # Round 2: Score >= 85 OR Top 10%
            if final_score >= ROUND_2_SCORE_THRESHOLD or rank <= round_2_cutoff_rank:
                status = 'round_2'
            # Round 1: Score >= 70 OR Top 30%
            elif final_score >= ROUND_1_SCORE_THRESHOLD or rank <= round_1_cutoff_rank:
                status = 'round_1'
            else:
                status = 'rejected'
        else:
            # Score-based only
            if final_score >= ROUND_2_SCORE_THRESHOLD:
                status = 'round_2'
            elif final_score >= ROUND_1_SCORE_THRESHOLD:
                status = 'round_1'
            else:
                status = 'rejected'
        
        # Update candidate state
        updated_candidate = {**candidate}
        updated_candidate['rank'] = rank
        updated_candidate['shortlist_status'] = status
        results.append(updated_candidate)
    
    return results


def get_shortlist_statistics(candidates: List[ScoringState]) -> Dict:
    """
    Calculate statistics for a batch of shortlisted candidates.
    
    Args:
        candidates: List of processed candidates with shortlist_status
        
    Returns:
        Statistics dictionary
    """
    total = len(candidates)
    
    round_2 = [c for c in candidates if c.get('shortlist_status') == 'round_2']
    round_1 = [c for c in candidates if c.get('shortlist_status') == 'round_1']
    rejected = [c for c in candidates if c.get('shortlist_status') == 'rejected']
    
    # Calculate score ranges for each group
    def get_score_range(group):
        if not group:
            return {'min': 0, 'max': 0, 'avg': 0}
        scores = [c.get('final_score', 0) for c in group]
        return {
            'min': round(min(scores), 2),
            'max': round(max(scores), 2),
            'avg': round(sum(scores) / len(scores), 2)
        }
    
    return {
        'total_applicants': total,
        'round_2': {
            'count': len(round_2),
            'percentage': round((len(round_2) / total * 100) if total > 0 else 0, 1),
            'score_range': get_score_range(round_2),
            'candidates': [
                {'id': c['candidate_id'], 'name': c.get('candidate_name'), 'score': c['final_score'], 'rank': c['rank']}
                for c in round_2
            ]
        },
        'round_1': {
            'count': len(round_1),
            'percentage': round((len(round_1) / total * 100) if total > 0 else 0, 1),
            'score_range': get_score_range(round_1),
            'candidates': [
                {'id': c['candidate_id'], 'name': c.get('candidate_name'), 'score': c['final_score'], 'rank': c['rank']}
                for c in round_1
            ]
        },
        'rejected': {
            'count': len(rejected),
            'percentage': round((len(rejected) / total * 100) if total > 0 else 0, 1),
            'score_range': get_score_range(rejected)
        },
        'advancement_rate': {
            'to_round_1': round(((len(round_1) + len(round_2)) / total * 100) if total > 0 else 0, 1),
            'to_round_2': round((len(round_2) / total * 100) if total > 0 else 0, 1)
        }
    }
