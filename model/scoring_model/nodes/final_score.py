"""
Final Score Node

Calculates: Final Score = Weighted Score × Integrity Score

This node combines the weighted assessment score with the integrity multiplier
to produce the final candidate score used for ranking.
"""

from typing import Dict
from ..state import ScoringState


def final_score_node(state: ScoringState) -> Dict:
    """
    Calculate final score by combining weighted score with integrity score.
    
    Formula: Final Score = Weighted Score × (Integrity Score / 100)
    
    This means:
    - A candidate with 80 weighted score and 100 integrity = 80 final
    - A candidate with 80 weighted score and 75 integrity = 60 final
    
    The integrity score acts as a multiplier that penalizes candidates
    whose resume claims don't match their performance.
    
    Args:
        state: Current scoring state with weighted_score and integrity_score
        
    Returns:
        Updated state with final_score
    """
    weighted_score = state.get('weighted_score', 0)
    integrity_score = state.get('integrity_score', 100)
    
    # Validate inputs
    weighted_score = max(0, min(100, weighted_score))
    integrity_score = max(0, min(100, integrity_score))
    
    # Calculate final score
    # Integrity score acts as a percentage multiplier
    final_score = weighted_score * (integrity_score / 100)
    
    # Round to 2 decimal places
    final_score = round(final_score, 2)
    
    return {
        'final_score': final_score
    }


def calculate_score_breakdown(state: ScoringState) -> Dict:
    """
    Generate a detailed breakdown of how the final score was calculated.
    
    Args:
        state: Complete scoring state
        
    Returns:
        Detailed score breakdown for explainability
    """
    weighted_score = state.get('weighted_score', 0)
    integrity_score = state.get('integrity_score', 100)
    final_score = state.get('final_score', 0)
    skill_contributions = state.get('skill_contributions', [])
    consistency_flags = state.get('consistency_flags', [])
    
    # Calculate impact of integrity on score
    integrity_impact = weighted_score - final_score
    
    return {
        'candidate_id': state.get('candidate_id'),
        'candidate_name': state.get('candidate_name'),
        'job_id': state.get('job_id'),
        'job_title': state.get('job_title'),
        
        'scores': {
            'weighted_score': weighted_score,
            'integrity_score': integrity_score,
            'final_score': final_score,
            'integrity_impact': round(integrity_impact, 2)
        },
        
        'formula': f"{weighted_score} × ({integrity_score}/100) = {final_score}",
        
        'skill_breakdown': skill_contributions,
        
        'integrity_issues': [
            {
                'skill': f['skill'],
                'claimed': f['claimed_level'],
                'scored': f['actual_score'],
                'gap': f['discrepancy']
            }
            for f in consistency_flags
        ],
        
        'summary': generate_score_summary(weighted_score, integrity_score, final_score)
    }


def generate_score_summary(weighted: float, integrity: float, final: float) -> str:
    """
    Generate a human-readable summary of the scoring.
    
    Args:
        weighted: Weighted score (0-100)
        integrity: Integrity score (0-100)
        final: Final score (0-100)
        
    Returns:
        Human-readable summary string
    """
    # Assess weighted score
    if weighted >= 80:
        performance = "excellent technical performance"
    elif weighted >= 65:
        performance = "strong technical performance"
    elif weighted >= 50:
        performance = "moderate technical performance"
    else:
        performance = "below average technical performance"
    
    # Assess integrity
    if integrity >= 95:
        consistency = "Outstanding consistency between claims and performance."
    elif integrity >= 80:
        consistency = "Good consistency with minor discrepancies."
    elif integrity >= 60:
        consistency = "Some concerns about resume accuracy."
    else:
        consistency = "Significant discrepancies require verification."
    
    # Assess final
    if final >= 75:
        recommendation = "Strong candidate for advancement."
    elif final >= 55:
        recommendation = "Consider for next round with focus areas."
    else:
        recommendation = "May not meet requirements for this role."
    
    return f"Candidate shows {performance}. {consistency} {recommendation}"
