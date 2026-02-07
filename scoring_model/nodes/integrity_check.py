"""
Integrity Check Node

Calculates: Integrity Score = consistency(resume_claims, scores)

This node compares what candidates claim on their resume (e.g., "Expert in Python")
against their actual assessment performance. Discrepancies reduce the integrity score.
"""

from typing import Dict, List
from ..state import ScoringState, ConsistencyFlag


# Expected minimum scores for each proficiency level
PROFICIENCY_THRESHOLDS = {
    'Expert': 80,
    'Advanced': 70,
    'Intermediate': 50,
    'Beginner': 30
}

# Severity thresholds based on discrepancy
SEVERITY_THRESHOLDS = {
    'high': 40,    # Claimed Expert but scored < 40
    'medium': 20,  # Significant gap
    'low': 10      # Minor gap
}


def integrity_check_node(state: ScoringState) -> Dict:
    """
    Check consistency between resume claims and assessment scores.
    
    Calculates an integrity score (0-100) where:
    - 100 = Perfect consistency (claims match performance)
    - Lower = More discrepancies found
    
    Args:
        state: Current scoring state with resume_claims and skill_scores
        
    Returns:
        Updated state with integrity_score and consistency_flags
    """
    resume_claims = state.get('resume_claims', [])
    skill_scores = state.get('skill_scores', [])
    
    # Create score lookup map
    score_map = {s['skill'].lower(): s['score'] for s in skill_scores}
    
    consistency_flags: List[ConsistencyFlag] = []
    total_penalty = 0.0
    skills_checked = 0
    
    for claim in resume_claims:
        skill_name = claim['skill']
        skill_key = skill_name.lower()
        claimed_level = claim['claimed_level']
        
        # Skip if skill wasn't in assessment
        if skill_key not in score_map:
            continue
        
        skills_checked += 1
        actual_score = score_map[skill_key]
        expected_score = PROFICIENCY_THRESHOLDS.get(claimed_level, 50)
        
        # Calculate discrepancy (only penalize under-performance)
        discrepancy = expected_score - actual_score
        
        if discrepancy > 0:
            # Candidate under-performed relative to claim
            severity = determine_severity(discrepancy)
            
            # Calculate penalty based on severity
            penalty = calculate_penalty(discrepancy, severity)
            total_penalty += penalty
            
            consistency_flags.append({
                'skill': skill_name,
                'claimed_level': claimed_level,
                'actual_score': round(actual_score, 1),
                'expected_score': expected_score,
                'discrepancy': round(discrepancy, 1),
                'severity': severity
            })
    
    # Calculate integrity score (start at 100, subtract penalties)
    # Cap penalties to ensure score doesn't go below 0
    integrity_score = max(0, 100 - total_penalty)
    

    # Bonus for over-performance (optional enhancement)
    # If candidate exceeds all claims, boost integrity slightly
    if len(consistency_flags) == 0 and skills_checked > 0:
        integrity_score = min(100, integrity_score + 5)
    
    return {
        'integrity_score': round(integrity_score, 2),
        'consistency_flags': consistency_flags
    }


def determine_severity(discrepancy: float) -> str:
    """
    Determine severity level based on discrepancy amount.
    
    Args:
        discrepancy: Points below expected score
        
    Returns:
        'high', 'medium', or 'low'
    """
    if discrepancy >= SEVERITY_THRESHOLDS['high']:
        return 'high'
    elif discrepancy >= SEVERITY_THRESHOLDS['medium']:
        return 'medium'
    else:
        return 'low'


def calculate_penalty(discrepancy: float, severity: str) -> float:
    """
    Calculate integrity penalty based on discrepancy and severity.
    
    Penalty formula scales with severity:
    - High: 1.5x multiplier
    - Medium: 1.0x multiplier  
    - Low: 0.5x multiplier
    
    Args:
        discrepancy: Points below expected score
        severity: 'high', 'medium', or 'low'
        
    Returns:
        Penalty points to subtract from integrity score
    """
    multipliers = {
        'high': 1.5,
        'medium': 1.0,
        'low': 0.5
    }
    
    # Base penalty is the discrepancy, modified by severity
    base_penalty = discrepancy * multipliers.get(severity, 1.0)
    
    # Cap individual skill penalty at 25 points
    return min(25, base_penalty)


def get_claim_analysis(state: ScoringState) -> Dict:
    """
    Generate detailed analysis of resume claims vs actual performance.
    
    Args:
        state: Scoring state with completed integrity check
        
    Returns:
        Analysis summary with insights
    """
    flags = state.get('consistency_flags', [])
    integrity_score = state.get('integrity_score', 100)
    
    high_severity = [f for f in flags if f['severity'] == 'high']
    medium_severity = [f for f in flags if f['severity'] == 'medium']
    low_severity = [f for f in flags if f['severity'] == 'low']
    
    return {
        'integrity_score': integrity_score,
        'total_issues': len(flags),
        'high_severity_count': len(high_severity),
        'medium_severity_count': len(medium_severity),
        'low_severity_count': len(low_severity),
        'recommendation': get_recommendation(integrity_score, len(high_severity)),
        'details': flags
    }


def get_recommendation(integrity_score: float, high_count: int) -> str:
    """Generate recommendation based on integrity analysis."""
    if integrity_score >= 90:
        return "Excellent consistency - resume claims align with performance"
    elif integrity_score >= 70:
        return "Good consistency - minor discrepancies noted"
    elif integrity_score >= 50:
        return "Moderate concerns - verify claims in interview"
    else:
        return "Significant discrepancies - requires careful review"
