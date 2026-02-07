"""
Sample Data Generator

Generates synthetic candidate data for demonstrating the scoring model.
Creates realistic scenarios with varying scores and resume claims.
"""

import random
import uuid
from typing import List, Dict


# Skill pool for different job types
TECH_SKILLS = [
    'Python', 'JavaScript', 'React', 'Node.js', 'MongoDB',
    'SQL', 'AWS', 'Docker', 'Git', 'REST APIs'
]

SOFT_SKILLS = [
    'Communication', 'Teamwork', 'Problem Solving',
    'Leadership', 'Time Management'
]

# Sample candidate names
FIRST_NAMES = [
    'Sarah', 'Michael', 'Emily', 'David', 'Jessica',
    'Chris', 'Amanda', 'Ryan', 'Nicole', 'Brandon',
    'Ashley', 'Jason', 'Megan', 'Kevin', 'Rachel'
]

LAST_NAMES = [
    'Chen', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson',
    'Anderson', 'Taylor', 'Thomas', 'Lee', 'Patel'
]


def generate_skill_weights(skills: List[str] = None) -> List[Dict]:
    """
    Generate skill weights for a job description.
    
    Args:
        skills: Optional list of skills (defaults to tech skills)
        
    Returns:
        List of skill weight entries
    """
    if skills is None:
        skills = random.sample(TECH_SKILLS, k=min(5, len(TECH_SKILLS)))
    
    # Generate random importances (1-10)
    importances = [random.randint(5, 10) for _ in skills]
    total = sum(importances)
    
    return [
        {
            'skill': skill,
            'weight': round(imp / total, 3),
            'importance': imp
        }
        for skill, imp in zip(skills, importances)
    ]


def generate_candidate(
    candidate_num: int,
    skill_weights: List[Dict],
    performance_tier: str = 'random'
) -> Dict:
    """
    Generate a single candidate with assessment scores and resume claims.
    
    Args:
        candidate_num: Candidate number for ID generation
        skill_weights: Skills to generate scores for
        performance_tier: 'high', 'medium', 'low', or 'random'
        
    Returns:
        Complete candidate data
    """
    # Generate name
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    
    # Determine score range based on tier
    if performance_tier == 'random':
        tier = random.choice(['high', 'high', 'medium', 'medium', 'medium', 'low'])
    else:
        tier = performance_tier
    
    score_ranges = {
        'high': (75, 98),
        'medium': (50, 80),
        'low': (25, 55)
    }
    min_score, max_score = score_ranges[tier]
    
    # Generate skill scores
    skill_scores = []
    resume_claims = []
    
    for sw in skill_weights:
        skill = sw['skill']
        
        # Generate actual score with some variance
        base_score = random.uniform(min_score, max_score)
        variance = random.uniform(-10, 10)
        score = max(0, min(100, base_score + variance))
        
        skill_scores.append({
            'skill': skill,
            'score': round(score, 1),
            'questions_attempted': random.randint(3, 6),
            'correct_answers': int(score / 100 * random.randint(3, 6)),
            'avg_difficulty': round(random.uniform(4, 8), 1)
        })
        
        # Generate resume claim (sometimes inflated)
        if score >= 80:
            claimed = 'Expert'
        elif score >= 65:
            # Sometimes claim higher
            claimed = random.choice(['Expert', 'Advanced', 'Advanced'])
        elif score >= 45:
            claimed = random.choice(['Advanced', 'Intermediate', 'Intermediate'])
        else:
            claimed = random.choice(['Intermediate', 'Beginner'])
        
        # 30% chance of inflating claim (for testing integrity check)
        if random.random() < 0.3 and claimed != 'Expert':
            levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
            current_idx = levels.index(claimed)
            claimed = levels[min(current_idx + 1, len(levels) - 1)]
        
        resume_claims.append({
            'skill': skill,
            'claimed_level': claimed,
            'years_experience': random.randint(1, 8)
        })
    
    return {
        'candidate_id': f'cand_{candidate_num:03d}_{uuid.uuid4().hex[:6]}',
        'candidate_name': f'{first} {last}',
        'skill_scores': skill_scores,
        'resume_claims': resume_claims
    }


def generate_sample_dataset(
    num_candidates: int = 20,
    job_title: str = 'Senior Full-Stack Developer'
) -> Dict:
    """
    Generate a complete sample dataset for testing.
    
    Args:
        num_candidates: Number of candidates to generate
        job_title: Title of the job
        
    Returns:
        Complete dataset with job, candidates, and skill weights
    """
    job_id = f'job_{uuid.uuid4().hex[:8]}'
    
    # Generate skill weights for the job
    skill_weights = generate_skill_weights()
    
    # Generate candidates with varied performance
    candidates = []
    for i in range(num_candidates):
        candidate = generate_candidate(i + 1, skill_weights)
        candidates.append(candidate)
    
    return {
        'job_id': job_id,
        'job_title': job_title,
        'skill_weights': skill_weights,
        'candidates': candidates
    }


def get_demo_data() -> Dict:
    """
    Get pre-configured demo data with predictable results.
    
    Returns:
        Demo dataset
    """
    skill_weights = [
        {'skill': 'React', 'weight': 0.25, 'importance': 9},
        {'skill': 'Python', 'weight': 0.20, 'importance': 7},
        {'skill': 'Node.js', 'weight': 0.20, 'importance': 7},
        {'skill': 'MongoDB', 'weight': 0.15, 'importance': 5},
        {'skill': 'AWS', 'weight': 0.12, 'importance': 4},
        {'skill': 'Communication', 'weight': 0.08, 'importance': 3}
    ]
    
    candidates = [
        # Top performer - honest claims
        {
            'candidate_id': 'demo_001',
            'candidate_name': 'Sarah Chen',
            'skill_scores': [
                {'skill': 'React', 'score': 95, 'questions_attempted': 5, 'correct_answers': 5, 'avg_difficulty': 8},
                {'skill': 'Python', 'score': 88, 'questions_attempted': 5, 'correct_answers': 4, 'avg_difficulty': 7},
                {'skill': 'Node.js', 'score': 85, 'questions_attempted': 4, 'correct_answers': 4, 'avg_difficulty': 7},
                {'skill': 'MongoDB', 'score': 78, 'questions_attempted': 4, 'correct_answers': 3, 'avg_difficulty': 6},
                {'skill': 'AWS', 'score': 70, 'questions_attempted': 3, 'correct_answers': 2, 'avg_difficulty': 6},
                {'skill': 'Communication', 'score': 90, 'questions_attempted': 3, 'correct_answers': 3, 'avg_difficulty': 5}
            ],
            'resume_claims': [
                {'skill': 'React', 'claimed_level': 'Expert', 'years_experience': 5},
                {'skill': 'Python', 'claimed_level': 'Advanced', 'years_experience': 4},
                {'skill': 'Node.js', 'claimed_level': 'Advanced', 'years_experience': 4},
                {'skill': 'MongoDB', 'claimed_level': 'Intermediate', 'years_experience': 3},
                {'skill': 'AWS', 'claimed_level': 'Intermediate', 'years_experience': 2},
                {'skill': 'Communication', 'claimed_level': 'Expert', 'years_experience': 6}
            ]
        },
        # Good performer - slightly inflated claims
        {
            'candidate_id': 'demo_002',
            'candidate_name': 'Michael Johnson',
            'skill_scores': [
                {'skill': 'React', 'score': 82, 'questions_attempted': 5, 'correct_answers': 4, 'avg_difficulty': 7},
                {'skill': 'Python', 'score': 75, 'questions_attempted': 5, 'correct_answers': 4, 'avg_difficulty': 6},
                {'skill': 'Node.js', 'score': 80, 'questions_attempted': 4, 'correct_answers': 3, 'avg_difficulty': 7},
                {'skill': 'MongoDB', 'score': 65, 'questions_attempted': 4, 'correct_answers': 3, 'avg_difficulty': 5},
                {'skill': 'AWS', 'score': 55, 'questions_attempted': 3, 'correct_answers': 2, 'avg_difficulty': 5},
                {'skill': 'Communication', 'score': 85, 'questions_attempted': 3, 'correct_answers': 3, 'avg_difficulty': 5}
            ],
            'resume_claims': [
                {'skill': 'React', 'claimed_level': 'Expert', 'years_experience': 4},
                {'skill': 'Python', 'claimed_level': 'Advanced', 'years_experience': 3},
                {'skill': 'Node.js', 'claimed_level': 'Expert', 'years_experience': 4},
                {'skill': 'MongoDB', 'claimed_level': 'Advanced', 'years_experience': 3},
                {'skill': 'AWS', 'claimed_level': 'Intermediate', 'years_experience': 1},
                {'skill': 'Communication', 'claimed_level': 'Advanced', 'years_experience': 5}
            ]
        },
        # Medium performer
        {
            'candidate_id': 'demo_003',
            'candidate_name': 'Emily Williams',
            'skill_scores': [
                {'skill': 'React', 'score': 68, 'questions_attempted': 5, 'correct_answers': 3, 'avg_difficulty': 6},
                {'skill': 'Python', 'score': 72, 'questions_attempted': 5, 'correct_answers': 4, 'avg_difficulty': 6},
                {'skill': 'Node.js', 'score': 60, 'questions_attempted': 4, 'correct_answers': 2, 'avg_difficulty': 5},
                {'skill': 'MongoDB', 'score': 75, 'questions_attempted': 4, 'correct_answers': 3, 'avg_difficulty': 6},
                {'skill': 'AWS', 'score': 45, 'questions_attempted': 3, 'correct_answers': 1, 'avg_difficulty': 5},
                {'skill': 'Communication', 'score': 80, 'questions_attempted': 3, 'correct_answers': 2, 'avg_difficulty': 5}
            ],
            'resume_claims': [
                {'skill': 'React', 'claimed_level': 'Advanced', 'years_experience': 3},
                {'skill': 'Python', 'claimed_level': 'Advanced', 'years_experience': 3},
                {'skill': 'Node.js', 'claimed_level': 'Intermediate', 'years_experience': 2},
                {'skill': 'MongoDB', 'claimed_level': 'Advanced', 'years_experience': 2},
                {'skill': 'AWS', 'claimed_level': 'Beginner', 'years_experience': 1},
                {'skill': 'Communication', 'claimed_level': 'Advanced', 'years_experience': 4}
            ]
        },
        # Low performer - heavily inflated claims
        {
            'candidate_id': 'demo_004',
            'candidate_name': 'David Brown',
            'skill_scores': [
                {'skill': 'React', 'score': 45, 'questions_attempted': 5, 'correct_answers': 2, 'avg_difficulty': 5},
                {'skill': 'Python', 'score': 40, 'questions_attempted': 5, 'correct_answers': 2, 'avg_difficulty': 4},
                {'skill': 'Node.js', 'score': 35, 'questions_attempted': 4, 'correct_answers': 1, 'avg_difficulty': 4},
                {'skill': 'MongoDB', 'score': 50, 'questions_attempted': 4, 'correct_answers': 2, 'avg_difficulty': 5},
                {'skill': 'AWS', 'score': 30, 'questions_attempted': 3, 'correct_answers': 1, 'avg_difficulty': 4},
                {'skill': 'Communication', 'score': 55, 'questions_attempted': 3, 'correct_answers': 2, 'avg_difficulty': 4}
            ],
            'resume_claims': [
                {'skill': 'React', 'claimed_level': 'Expert', 'years_experience': 5},
                {'skill': 'Python', 'claimed_level': 'Expert', 'years_experience': 4},
                {'skill': 'Node.js', 'claimed_level': 'Advanced', 'years_experience': 3},
                {'skill': 'MongoDB', 'claimed_level': 'Advanced', 'years_experience': 3},
                {'skill': 'AWS', 'claimed_level': 'Intermediate', 'years_experience': 2},
                {'skill': 'Communication', 'claimed_level': 'Advanced', 'years_experience': 4}
            ]
        },
        # Low performer - honest claims
        {
            'candidate_id': 'demo_005',
            'candidate_name': 'Jessica Garcia',
            'skill_scores': [
                {'skill': 'React', 'score': 55, 'questions_attempted': 5, 'correct_answers': 3, 'avg_difficulty': 5},
                {'skill': 'Python', 'score': 48, 'questions_attempted': 5, 'correct_answers': 2, 'avg_difficulty': 4},
                {'skill': 'Node.js', 'score': 52, 'questions_attempted': 4, 'correct_answers': 2, 'avg_difficulty': 5},
                {'skill': 'MongoDB', 'score': 45, 'questions_attempted': 4, 'correct_answers': 2, 'avg_difficulty': 4},
                {'skill': 'AWS', 'score': 40, 'questions_attempted': 3, 'correct_answers': 1, 'avg_difficulty': 4},
                {'skill': 'Communication', 'score': 65, 'questions_attempted': 3, 'correct_answers': 2, 'avg_difficulty': 5}
            ],
            'resume_claims': [
                {'skill': 'React', 'claimed_level': 'Intermediate', 'years_experience': 2},
                {'skill': 'Python', 'claimed_level': 'Intermediate', 'years_experience': 2},
                {'skill': 'Node.js', 'claimed_level': 'Intermediate', 'years_experience': 1},
                {'skill': 'MongoDB', 'claimed_level': 'Beginner', 'years_experience': 1},
                {'skill': 'AWS', 'claimed_level': 'Beginner', 'years_experience': 0},
                {'skill': 'Communication', 'claimed_level': 'Intermediate', 'years_experience': 3}
            ]
        }
    ]
    
    return {
        'job_id': 'demo_job_001',
        'job_title': 'Senior Full-Stack Developer',
        'skill_weights': skill_weights,
        'candidates': candidates
    }
