"""
Weighted Score Node

Calculates: Weighted Score = Σ(score × weight)

This node takes the skill scores from assessment and skill weights from JD,
then computes a weighted sum representing the candidate's overall performance
relative to the job requirements.
"""

from typing import Dict, List
from ..state import ScoringState


def weighted_score_node(state: ScoringState) -> Dict:
    """
    Calculate weighted score based on skill scores and JD weights.
    
    Formula: Weighted Score = Σ(score_i × weight_i)
    
    Args:
        state: Current scoring state with skill_scores and skill_weights
        
    Returns:
        Updated state with weighted_score and skill_contributions
    """
    skill_scores = state.get('skill_scores', [])
    skill_weights = state.get('skill_weights', [])
    
    # Create lookup maps for efficient access
    score_map = {s['skill'].lower(): s['score'] for s in skill_scores}
    weight_map = {w['skill'].lower(): w['weight'] for w in skill_weights}
    
    weighted_score = 0.0
    skill_contributions = []
    errors = state.get('processing_errors', []).copy()
    
    # Calculate weighted contribution for each skill in the JD
    for weight_entry in skill_weights:
        skill_name = weight_entry['skill']
        skill_key = skill_name.lower()
        weight = weight_entry['weight']
        
        # Find matching score
        if skill_key in score_map:
            score = score_map[skill_key]
            contribution = score * weight
            weighted_score += contribution
            
            skill_contributions.append({
                'skill': skill_name,
                'score': score,
                'weight': weight,
                'contribution': round(contribution, 2),
                'percentage_of_total': 0  # Will be calculated after sum
            })
        else:
            # Skill in JD but not assessed - treat as 0
            skill_contributions.append({
                'skill': skill_name,
                'score': 0,
                'weight': weight,
                'contribution': 0,
                'percentage_of_total': 0,
                'note': 'Skill not assessed'
            })
            errors.append(f"Skill '{skill_name}' in JD but not found in assessment scores")
    
    # Calculate percentage of total for each contribution
    if weighted_score > 0:
        for contrib in skill_contributions:
            contrib['percentage_of_total'] = round(
                (contrib['contribution'] / weighted_score) * 100, 1
            )
    
    # Ensure weighted_score is in 0-100 range
    # (assuming weights sum to 1.0 and scores are 0-100)
    weighted_score = min(100, max(0, weighted_score))
    
    return {
        'weighted_score': round(weighted_score, 2),
        'skill_contributions': skill_contributions,
        'processing_errors': errors
    }


def normalize_weights(skill_weights: List[Dict]) -> List[Dict]:
    """
    Normalize weights to ensure they sum to 1.0
    
    Args:
        skill_weights: List of skill weight entries
        
    Returns:
        Normalized skill weights
    """
    total_weight = sum(w['weight'] for w in skill_weights)
    
    if total_weight == 0:
        # Equal distribution if no weights
        equal_weight = 1.0 / len(skill_weights) if skill_weights else 0
        return [
            {**w, 'weight': equal_weight} 
            for w in skill_weights
        ]
    
    return [
        {**w, 'weight': w['weight'] / total_weight}
        for w in skill_weights
    ]
