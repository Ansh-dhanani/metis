"""
LangGraph State Schema for METIS Scoring Model

Defines the state that flows through the scoring pipeline:
Weighted Score → Integrity Check → Final Score → Shortlist
"""

from typing import TypedDict, List, Dict, Optional, Literal
from dataclasses import dataclass


class SkillScore(TypedDict):
    """Individual skill score from assessment"""
    skill: str
    score: float  # 0-100
    questions_attempted: int
    correct_answers: int
    avg_difficulty: float


class SkillWeight(TypedDict):
    """Skill weight from JD parsing"""
    skill: str
    weight: float  # 0-1, sum of all weights = 1
    importance: int  # 1-10


class ResumeClaim(TypedDict):
    """Skill claim from candidate's resume"""
    skill: str
    claimed_level: Literal['Expert', 'Advanced', 'Intermediate', 'Beginner']
    years_experience: Optional[int]


class ConsistencyFlag(TypedDict):
    """Flag for resume vs assessment discrepancy"""
    skill: str
    claimed_level: str
    actual_score: float
    expected_score: float
    discrepancy: float
    severity: Literal['low', 'medium', 'high']


class ScoringState(TypedDict):
    """
    Main state schema for the LangGraph scoring pipeline.
    
    Flow:
    1. Input: candidate_id, job_id, skill_scores, skill_weights, resume_claims
    2. weighted_score_node: Calculates weighted_score
    3. integrity_check_node: Calculates integrity_score, adds consistency_flags
    4. final_score_node: Calculates final_score
    5. shortlist_node: Determines shortlist_status
    """
    
    # Input fields (from Models 1 & 2)
    candidate_id: str
    candidate_name: str
    job_id: str
    job_title: str
    
    # Skill data
    skill_scores: List[SkillScore]
    skill_weights: List[SkillWeight]
    resume_claims: List[ResumeClaim]
    
    # Calculated scores
    weighted_score: float  # Σ(score × weight) - 0-100
    skill_contributions: List[Dict]  # Breakdown of each skill's contribution
    
    # Integrity checking
    integrity_score: float  # 0-100 (100 = perfect consistency)
    consistency_flags: List[ConsistencyFlag]
    
    # Final output
    final_score: float  # weighted_score × (integrity_score / 100)
    rank: Optional[int]
    shortlist_status: Literal['round_1', 'round_2', 'rejected', 'pending']
    
    # Metadata
    processing_errors: List[str]


class LeaderboardEntry(TypedDict):
    """Single entry in the leaderboard"""
    candidate_id: str
    candidate_name: str
    weighted_score: float
    integrity_score: float
    final_score: float
    rank: int
    shortlist_status: str
    skill_breakdown: List[Dict]
    has_consistency_issues: bool


class LeaderboardState(TypedDict):
    """State for the complete leaderboard of a job"""
    job_id: str
    job_title: str
    total_applicants: int
    entries: List[LeaderboardEntry]
    round_1_count: int
    round_2_count: int
    rejected_count: int
    generated_at: str
