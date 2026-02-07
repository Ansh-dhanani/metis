"""
LangGraph Scoring Model (v1.0.8 Compatible)

Main workflow definition that chains together:
1. Input Aggregator: Combines scores from Model 1 and Model 2
2. Weighted Score Node: Σ(score × weight)
3. Integrity Check Node: consistency(resume_claims, scores)
4. Final Score Node: Weighted Score × Integrity Score
5. Shortlist Node: Determine round advancement

This creates a directed graph for the scoring pipeline using LangGraph 1.0.8.
Integrates with Groq API via LangChain for AI-enhanced features.
"""

from typing import Dict, List, Optional, Annotated
from typing_extensions import TypedDict
import operator
import os

from langgraph.graph import StateGraph, END, START

from .state import ScoringState, LeaderboardEntry
from .nodes import (
    weighted_score_node,
    integrity_check_node,
    final_score_node,
    shortlist_node
)
from .nodes.shortlist import batch_shortlist, get_shortlist_statistics


def create_scoring_graph() -> StateGraph:
    """
    Create the LangGraph scoring workflow (v1.0.8 compatible).
    
    Graph Flow:
    START → weighted_score → integrity_check → final_score → shortlist → END
    
    Returns:
        Compiled StateGraph ready for execution
    """
    # Initialize graph with state schema
    workflow = StateGraph(ScoringState)
    
    # Add nodes
    workflow.add_node("weighted_score", weighted_score_node)
    workflow.add_node("integrity_check", integrity_check_node)
    workflow.add_node("final_score", final_score_node)
    workflow.add_node("shortlist", shortlist_node)
    
    # Define edges (linear flow) - LangGraph 1.0.8 syntax
    workflow.add_edge(START, "weighted_score")
    workflow.add_edge("weighted_score", "integrity_check")
    workflow.add_edge("integrity_check", "final_score")
    workflow.add_edge("final_score", "shortlist")
    workflow.add_edge("shortlist", END)
    
    # Compile the graph
    return workflow.compile()


def combine_model_scores(
    model1_output: Dict,
    model2_output: Dict
) -> Dict:
    """
    Combine outputs from Model 1 (JD Parser) and Model 2 (Assessment Evaluator).
    
    This is the integration point where Model 3 receives data from the other models.
    
    Args:
        model1_output: Output from Model 1 containing:
            - job_id, job_title
            - skill_weights: [{skill, weight, importance}]
        model2_output: Output from Model 2 containing:
            - candidate_id, candidate_name
            - skill_scores: [{skill, score, ...}]
            - resume_claims: [{skill, claimed_level, ...}]
    
    Returns:
        Combined input ready for Model 3 scoring pipeline
    """
    return {
        # From Model 1
        'job_id': model1_output.get('job_id'),
        'job_title': model1_output.get('job_title'),
        'skill_weights': model1_output.get('skill_weights', []),
        
        # From Model 2
        'candidate_id': model2_output.get('candidate_id'),
        'candidate_name': model2_output.get('candidate_name'),
        'skill_scores': model2_output.get('skill_scores', []),
        'resume_claims': model2_output.get('resume_claims', [])
    }


def run_scoring_pipeline(
    candidate_id: str,
    candidate_name: str,
    job_id: str,
    job_title: str,
    skill_scores: List[Dict],
    skill_weights: List[Dict],
    resume_claims: List[Dict]
) -> ScoringState:
    """
    Run the complete scoring pipeline for a single candidate.
    
    This is Model 3's main processing function that:
    1. Takes inputs from Model 1 (skill_weights) and Model 2 (skill_scores, resume_claims)
    2. Calculates Weighted Score, Integrity Score, Final Score
    3. Determines shortlist status (Round 1, Round 2, or Rejected)
    
    Args:
        candidate_id: Unique candidate identifier
        candidate_name: Candidate's full name
        job_id: Job posting ID (from Model 1)
        job_title: Job title (from Model 1)
        skill_scores: Skill assessment scores (from Model 2)
        skill_weights: Skill weights from JD (from Model 1)
        resume_claims: Resume skill claims (from Model 2)
        
    Returns:
        Complete scoring state with all calculated values
    """
    # Create initial state
    initial_state: ScoringState = {
        'candidate_id': candidate_id,
        'candidate_name': candidate_name,
        'job_id': job_id,
        'job_title': job_title,
        'skill_scores': skill_scores,
        'skill_weights': skill_weights,
        'resume_claims': resume_claims,
        'weighted_score': 0.0,
        'skill_contributions': [],
        'integrity_score': 100.0,
        'consistency_flags': [],
        'final_score': 0.0,
        'rank': None,
        'shortlist_status': 'pending',
        'processing_errors': []
    }
    
    # Create and run graph
    graph = create_scoring_graph()
    result = graph.invoke(initial_state)
    
    return result


def run_model3_pipeline(
    model1_outputs: List[Dict],
    model2_outputs: List[Dict]
) -> Dict:
    """
    Run Model 3 scoring pipeline using outputs from Model 1 and Model 2.
    
    This is the main entry point when integrating all 3 models.
    
    Args:
        model1_outputs: List containing job data with skill_weights
                       (typically one entry per job)
        model2_outputs: List of candidate evaluations from Model 2
                       [{candidate_id, candidate_name, skill_scores, resume_claims}, ...]
    
    Returns:
        Complete leaderboard with rankings and shortlist decisions
    """
    from datetime import datetime
    
    # Get job data from Model 1 (assume single job for now)
    model1_data = model1_outputs[0] if model1_outputs else {}
    job_id = model1_data.get('job_id', 'unknown')
    job_title = model1_data.get('job_title', 'Unknown Position')
    skill_weights = model1_data.get('skill_weights', [])
    
    # Process each candidate from Model 2
    scored_candidates = []
    
    for model2_data in model2_outputs:
        combined = combine_model_scores(model1_data, model2_data)
        
        result = run_scoring_pipeline(
            candidate_id=combined['candidate_id'],
            candidate_name=combined['candidate_name'],
            job_id=combined['job_id'],
            job_title=combined['job_title'],
            skill_scores=combined['skill_scores'],
            skill_weights=combined['skill_weights'],
            resume_claims=combined['resume_claims']
        )
        scored_candidates.append(result)
    
    # Apply batch shortlisting with percentile logic
    ranked_candidates = batch_shortlist(scored_candidates, use_percentile=True)
    
    # Get statistics
    stats = get_shortlist_statistics(ranked_candidates)
    
    # Build leaderboard entries
    leaderboard_entries: List[LeaderboardEntry] = []
    for candidate in ranked_candidates:
        entry: LeaderboardEntry = {
            'candidate_id': candidate['candidate_id'],
            'candidate_name': candidate['candidate_name'],
            'weighted_score': candidate['weighted_score'],
            'integrity_score': candidate['integrity_score'],
            'final_score': candidate['final_score'],
            'rank': candidate['rank'],
            'shortlist_status': candidate['shortlist_status'],
            'skill_breakdown': candidate.get('skill_contributions', []),
            'has_consistency_issues': len(candidate.get('consistency_flags', [])) > 0
        }
        leaderboard_entries.append(entry)
    
    return {
        'job_id': job_id,
        'job_title': job_title,
        'total_applicants': len(model2_outputs),
        'entries': leaderboard_entries,
        'round_1_count': stats['round_1']['count'],
        'round_2_count': stats['round_2']['count'],
        'rejected_count': stats['rejected']['count'],
        'statistics': stats,
        'generated_at': datetime.now().isoformat()
    }


def run_batch_scoring(
    job_id: str,
    job_title: str,
    skill_weights: List[Dict],
    candidates: List[Dict]
) -> Dict:
    """
    Run scoring pipeline for multiple candidates and generate leaderboard.
    
    Convenience wrapper that formats inputs for the Model 3 pipeline.
    
    Args:
        job_id: Job posting ID
        job_title: Job title
        skill_weights: Skill weights from JD (from Model 1)
        candidates: List of candidate data with skill_scores and resume_claims (from Model 2)
        
    Returns:
        Complete leaderboard with rankings and statistics
    """
    # Format as Model 1 and Model 2 outputs
    model1_outputs = [{
        'job_id': job_id,
        'job_title': job_title,
        'skill_weights': skill_weights
    }]
    
    model2_outputs = candidates
    
    return run_model3_pipeline(model1_outputs, model2_outputs)


# Visualization helper for debugging
def visualize_graph():
    """
    Generate a visualization of the scoring graph.
    
    Returns:
        Mermaid diagram string representation
    """
    return """
```mermaid
graph TD
    subgraph Model1["Model 1: JD Parser (LangGraph)"]
        A[Job Description] --> B[Parse with Groq/LangChain]
        B --> C[skill_weights output]
    end
    
    subgraph Model2["Model 2: Assessment Evaluator (LangGraph)"]
        D[Candidate Resume] --> E[Parse with Groq/LangChain]
        F[Assessment Answers] --> G[Evaluate with Groq/LangChain]
        E --> H[skill_scores + resume_claims output]
        G --> H
    end
    
    subgraph Model3["Model 3: Scoring & Leaderboard (THIS MODEL)"]
        I[Combine Model 1 + Model 2 Outputs]
        J[Weighted Score Node]
        K[Integrity Check Node]
        L[Final Score Node]
        M[Shortlist Node]
        
        I --> J
        J --> K
        K --> L
        L --> M
    end
    
    C --> I
    H --> I
    M --> N[Round 1 Shortlist]
    M --> O[Round 2 Shortlist]
    M --> P[Rejected]
```
    """
