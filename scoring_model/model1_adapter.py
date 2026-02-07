"""
Model 1 Integration Adapter

Converts outputs from METIS Core (Model 1) evaluation format to Model 3 input format.

Model 1 Output (METIS Core):
{
    "overall_score": 54,
    "section_scores": {
        "skill_evidence": 10,      # Max: 30
        "project_authenticity": 19, # Max: 25
        "professional_signals": 9,  # Max: 15
        "impact_outcomes": 1,       # Max: 15
        "resume_integrity": 15      # Max: 15
    },
    "strength_signals": [...],
    "risk_signals": [...],
    "confidence_level": "high"
}

Model 3 Input:
{
    "candidate_id": "...",
    "candidate_name": "...", 
    "skill_scores": [{"skill": "...", "score": ...}],
    "resume_claims": [{"skill": "...", "claimed_level": "..."}]
}
"""

import os
import json
import glob
from typing import Dict, List, Optional, Tuple
from pathlib import Path


# Section score maximums for normalization
SECTION_MAX_SCORES = {
    "skill_evidence": 30,
    "project_authenticity": 25,
    "professional_signals": 15,
    "impact_outcomes": 15,
    "resume_integrity": 15
}

# Map section names to more friendly display names
SECTION_DISPLAY_NAMES = {
    "skill_evidence": "Technical Skills",
    "project_authenticity": "Project Quality",
    "professional_signals": "Professional Experience",
    "impact_outcomes": "Impact & Outcomes",
    "resume_integrity": "Resume Quality"
}

# Default weights for sections (based on their max scores)
SECTION_WEIGHTS = {
    "skill_evidence": 0.30,        # 30/100
    "project_authenticity": 0.25,  # 25/100
    "professional_signals": 0.15,  # 15/100
    "impact_outcomes": 0.15,       # 15/100
    "resume_integrity": 0.15       # 15/100
}


def normalize_section_score(section: str, raw_score: int) -> float:
    """
    Normalize a section score to 0-100 scale.
    
    Args:
        section: Section name
        raw_score: Raw score from Model 1
        
    Returns:
        Normalized score (0-100)
    """
    max_score = SECTION_MAX_SCORES.get(section, 30)
    return min(100.0, (raw_score / max_score) * 100)


def infer_proficiency_level(normalized_score: float) -> str:
    """
    Infer proficiency level from normalized score.
    
    Args:
        normalized_score: Score on 0-100 scale
        
    Returns:
        Proficiency level string
    """
    if normalized_score >= 85:
        return "Expert"
    elif normalized_score >= 65:
        return "Advanced"
    elif normalized_score >= 40:
        return "Intermediate"
    else:
        return "Beginner"


def convert_model1_to_model3(
    model1_output: Dict,
    candidate_id: str,
    candidate_name: str
) -> Dict:
    """
    Convert Model 1 (METIS Core) output to Model 3 input format.
    
    This maps the section_scores from Model 1 to skill_scores for Model 3,
    treating each evaluation section as a "skill" dimension.
    
    Args:
        model1_output: Output from Model 1 evaluation
        candidate_id: Unique candidate identifier
        candidate_name: Candidate's name
        
    Returns:
        Dict in Model 3 input format
    """
    section_scores = model1_output.get("section_scores", {})
    
    # Convert section scores to skill_scores format
    skill_scores = []
    resume_claims = []
    
    for section, raw_score in section_scores.items():
        normalized = normalize_section_score(section, raw_score)
        display_name = SECTION_DISPLAY_NAMES.get(section, section)
        
        skill_scores.append({
            "skill": display_name,
            "score": normalized,
            "raw_score": raw_score,
            "max_score": SECTION_MAX_SCORES.get(section, 30)
        })
        
        # Infer resume claims from scores
        # (In reality, this would come from resume parsing,
        # but we can infer for integration purposes)
        resume_claims.append({
            "skill": display_name,
            "claimed_level": infer_proficiency_level(normalized),
            "evidence_based": True
        })
    
    return {
        "candidate_id": candidate_id,
        "candidate_name": candidate_name,
        "skill_scores": skill_scores,
        "resume_claims": resume_claims,
        # Preserve Model 1 metadata
        "model1_metadata": {
            "overall_score": model1_output.get("overall_score", 0),
            "confidence_level": model1_output.get("confidence_level", "low"),
            "strength_signals": model1_output.get("strength_signals", []),
            "risk_signals": model1_output.get("risk_signals", []),
            "ats_flags": model1_output.get("ats_flags", [])
        }
    }


def get_default_skill_weights() -> List[Dict]:
    """
    Get the default skill weights for Model 1 sections.
    
    These are used as the JD weights when integrating with Model 3.
    
    Returns:
        List of skill weight dicts
    """
    weights = []
    for section, weight in SECTION_WEIGHTS.items():
        display_name = SECTION_DISPLAY_NAMES.get(section, section)
        importance = int(weight * 10 / 0.30 * 3)  # Scale to 1-10
        
        weights.append({
            "skill": display_name,
            "weight": weight,
            "importance": min(10, max(1, importance))
        })
    
    return weights


def load_evaluation_files(evaluations_dir: str) -> List[Tuple[str, Dict]]:
    """
    Load all evaluation JSON files from a directory.
    
    Args:
        evaluations_dir: Path to evaluations directory
        
    Returns:
        List of (filename, evaluation_dict) tuples
    """
    evaluations = []
    
    json_pattern = os.path.join(evaluations_dir, "*.json")
    for filepath in glob.glob(json_pattern):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                filename = os.path.basename(filepath)
                evaluations.append((filename, data))
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not load {filepath}: {e}")
    
    return evaluations


def extract_candidate_name_from_filename(filename: str) -> str:
    """
    Extract candidate name from evaluation filename.
    
    Expected format: name_timestamp.json or name.json
    """
    # Remove .json extension
    name = filename.replace('.json', '')
    
    # Remove timestamp if present (format: _YYYYMMDD_HHMMSS)
    import re
    name = re.sub(r'_\d{8}_\d{6}$', '', name)
    
    # Convert underscores to spaces and title case
    name = name.replace('_', ' ').title()
    
    return name


def process_evaluations_directory(
    evaluations_dir: str,
    job_id: str = "job_metis_eval",
    job_title: str = "METIS Candidate Evaluation"
) -> Dict:
    """
    Process all evaluations in a directory and prepare for Model 3.
    
    Args:
        evaluations_dir: Path to evaluations directory
        job_id: Job ID to use
        job_title: Job title to use
        
    Returns:
        Dict with model1_outputs and model2_outputs ready for run_model3_pipeline
    """
    evaluations = load_evaluation_files(evaluations_dir)
    
    if not evaluations:
        return {"error": "No evaluation files found"}
    
    model2_outputs = []
    
    for i, (filename, eval_data) in enumerate(evaluations):
        candidate_name = extract_candidate_name_from_filename(filename)
        candidate_id = f"cand_{i+1:03d}"
        
        converted = convert_model1_to_model3(
            model1_output=eval_data,
            candidate_id=candidate_id,
            candidate_name=candidate_name
        )
        
        model2_outputs.append(converted)
    
    # Create Model 1 output (JD with skill weights)
    model1_outputs = [{
        "job_id": job_id,
        "job_title": job_title,
        "skill_weights": get_default_skill_weights()
    }]
    
    return {
        "model1_outputs": model1_outputs,
        "model2_outputs": model2_outputs,
        "evaluation_count": len(evaluations),
        "source_directory": evaluations_dir
    }


def integrate_with_model3(evaluations_dir: str) -> Dict:
    """
    Main integration function: Load Model 1 evaluations directly as Round 1 results.
    
    Model 1 candidates are pre-qualified and go directly to Round 1 status.
    
    Args:
        evaluations_dir: Path to evaluations directory
        
    Returns:
        Leaderboard with all Model 1 candidates as Round 1
    """
    evaluations = load_evaluation_files(evaluations_dir)
    
    if not evaluations:
        return {"error": "No evaluation files found in " + evaluations_dir}
    
    entries = []
    
    for i, (filename, eval_data) in enumerate(evaluations):
        candidate_name = extract_candidate_name_from_filename(filename)
        candidate_id = f"cand_{i+1:03d}"
        
        # Get Model 1 overall score
        overall_score = eval_data.get("overall_score", 50)
        section_scores = eval_data.get("section_scores", {})
        
        # Calculate weighted score from section scores
        weighted_score = 0
        for section, raw_score in section_scores.items():
            normalized = normalize_section_score(section, raw_score)
            weight = SECTION_WEIGHTS.get(section, 0.2)
            weighted_score += normalized * weight
        
        # If no section scores, use overall_score
        if not section_scores:
            weighted_score = float(overall_score)
        
        # Model 1 candidates are already validated - high integrity
        integrity_score = 95.0
        
        # Final score calculation
        final_score = weighted_score * (integrity_score / 100)
        
        # All Model 1 candidates go directly to Round 1
        entries.append({
            "rank": i + 1,
            "candidate_id": candidate_id,
            "candidate_name": candidate_name,
            "weighted_score": weighted_score,
            "integrity_score": integrity_score,
            "final_score": final_score,
            "shortlist_status": "round_1",  # Direct Round 1 status
            "model1_score": overall_score,
            "confidence_level": eval_data.get("confidence_level", "medium"),
            "strength_signals": eval_data.get("strength_signals", []),
            "risk_signals": eval_data.get("risk_signals", [])
        })
    
    # Sort by final score descending
    entries.sort(key=lambda x: x['final_score'], reverse=True)
    
    # Re-rank after sorting
    for i, entry in enumerate(entries):
        entry['rank'] = i + 1
    
    # Build the result
    total = len(entries)
    
    return {
        "job_id": "job_model1_round1",
        "job_title": "Model 1 Evaluation - Round 1 Results",
        "total_applicants": total,
        "round_2_count": 0,  # Model 1 goes to Round 1
        "round_1_count": total,  # All are Round 1
        "rejected_count": 0,
        "entries": entries,
        "statistics": {
            "score_distribution": {
                "final_score": {
                    "avg": round(sum(e['final_score'] for e in entries) / total, 1) if total > 0 else 0,
                    "min": round(min(e['final_score'] for e in entries), 1) if total > 0 else 0,
                    "max": round(max(e['final_score'] for e in entries), 1) if total > 0 else 0
                }
            },
            "consistency_issues": {
                "candidates_with_issues": 0
            }
        }
    }


def combine_with_model2(
    model1_candidates: List[Dict],
    model2_scores: Dict[str, Dict],
    weights: Dict[str, float] = None
) -> List[Dict]:
    """
    Combine Model 1 (Resume) scores with Model 2 (Interview) scores.
    
    This function merges Round 1 (resume evaluation) and Round 2 (interview)
    scores to produce the combined input for Model 3 final scoring.
    
    Args:
        model1_candidates: List of candidates with Model 1 scores
            Each should have: candidate_id, candidate_name, model1_score
        model2_scores: Dict mapping candidate_id to interview evaluation
            Each evaluation should have: interview_score, personality_score, 
            technical_approach_score, etc.
        weights: Optional weights for combining scores
            Default: {"model1": 0.4, "model2": 0.6}
            
    Returns:
        List of combined candidate data for Model 3
    """
    if weights is None:
        weights = {"model1": 0.4, "model2": 0.6}
    
    m1_weight = weights.get("model1", 0.4)
    m2_weight = weights.get("model2", 0.6)
    
    combined_candidates = []
    
    for candidate in model1_candidates:
        cand_id = candidate.get("candidate_id", "")
        cand_name = candidate.get("candidate_name", "Unknown")
        
        # Get Model 1 score (normalize to 0-100 if needed)
        m1_score = candidate.get("model1_score", 0)
        if m1_score > 100:
            m1_score = min(100, m1_score)
        
        # Get Model 2 interview score
        m2_data = model2_scores.get(cand_id, {})
        m2_score = m2_data.get("interview_score", 0)
        
        # If no specific interview score, try to calculate from components
        if m2_score == 0 and m2_data:
            personality = m2_data.get("personality_score", 0)
            technical = m2_data.get("technical_approach_score", 0)
            communication = m2_data.get("communication_score", 0)
            problem_solving = m2_data.get("problem_solving_score", 0)
            
            component_scores = [s for s in [personality, technical, communication, problem_solving] if s > 0]
            if component_scores:
                m2_score = sum(component_scores) / len(component_scores)
        
        # Calculate combined score
        combined_score = (m1_score * m1_weight) + (m2_score * m2_weight)
        
        combined_candidate = {
            "candidate_id": cand_id,
            "candidate_name": cand_name,
            "model1_score": m1_score,
            "model2_score": m2_score,
            "combined_score": round(combined_score, 1),
            "round1_complete": m1_score > 0,
            "round2_complete": m2_score > 0,
            # Preserve original data
            "skill_scores": candidate.get("skill_scores", []),
            "resume_claims": candidate.get("resume_claims", []),
            # Model 2 details
            "interview_details": {
                "personality_score": m2_data.get("personality_score", 0),
                "technical_score": m2_data.get("technical_approach_score", 0),
                "communication_score": m2_data.get("communication_score", 0),
                "hire_recommendation": m2_data.get("hire_recommendation", "pending")
            }
        }
        
        combined_candidates.append(combined_candidate)
    
    # Sort by combined score
    combined_candidates.sort(key=lambda x: x["combined_score"], reverse=True)
    
    # Add ranks
    for i, candidate in enumerate(combined_candidates):
        candidate["rank"] = i + 1
        
        # Determine shortlist status based on combined score
        score = candidate["combined_score"]
        m1 = candidate["model1_score"]
        m2 = candidate["model2_score"]
        
        if score >= 75 or (m1 >= 70 and m2 >= 70):
            candidate["shortlist_status"] = "round_2"  # Final shortlist
        elif score >= 55 or m2 >= 60:
            candidate["shortlist_status"] = "round_1"  # Potential
        else:
            candidate["shortlist_status"] = "rejected"
    
    return combined_candidates


def get_combined_leaderboard(
    evaluations_dir: str,
    interview_results: Dict[str, Dict],
    weights: Dict[str, float] = None
) -> Dict:
    """
    Generate a complete leaderboard combining Model 1 and Model 2 scores.
    
    Args:
        evaluations_dir: Path to Model 1 evaluation files
        interview_results: Dict of candidate_id -> interview evaluation
        weights: Score combination weights
        
    Returns:
        Complete leaderboard dict for frontend display
    """
    # Process Model 1 evaluations
    model1_data = process_evaluations_directory(evaluations_dir)
    
    if "error" in model1_data:
        return model1_data
    
    # Combine with Model 2 scores
    combined = combine_with_model2(
        model1_data["candidates"],
        interview_results,
        weights
    )
    
    # Build leaderboard
    round2_count = sum(1 for c in combined if c["shortlist_status"] == "round_2")
    round1_count = sum(1 for c in combined if c["shortlist_status"] == "round_1")
    rejected_count = sum(1 for c in combined if c["shortlist_status"] == "rejected")
    
    return {
        "job_id": model1_data.get("job_id", "combined_job"),
        "job_title": model1_data.get("job_title", "Combined Evaluation"),
        "total_applicants": len(combined),
        "round_2_count": round2_count,
        "round_1_count": round1_count,
        "rejected_count": rejected_count,
        "entries": combined,
        "weights_used": weights or {"model1": 0.4, "model2": 0.6}
    }


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        eval_dir = sys.argv[1]
    else:
        eval_dir = "hackathon/hackathon/evaluations"
    
    print(f"Processing evaluations from: {eval_dir}")
    
    result = integrate_with_model3(eval_dir)
    
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"\nTotal Candidates: {result['total_applicants']}")
        print(f"Round 1 (Model 1 Qualified): {result['round_1_count']}")
        print("\nLeaderboard:")
        for entry in result['entries']:
            print(f"  #{entry['rank']} {entry['candidate_name']}: {entry['final_score']:.1f} (M1 Score: {entry['model1_score']})")

