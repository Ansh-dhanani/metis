"""
METIS Interview Evaluator

Evaluates interview transcripts to produce personality and technical scores.
Uses Groq LLM for structured evaluation.
"""

import os
import json
from typing import Dict, List, Optional

# Try to import Groq
try:
    from groq import Groq
except ImportError:
    Groq = None


def evaluate_interview(
    job_description: str,
    transcript: List[Dict],
    candidate_name: str = "Candidate"
) -> Dict:
    """
    Evaluate an interview transcript.
    
    Args:
        job_description: The job description text
        transcript: List of {role, content} message dicts
        candidate_name: Name of candidate
        
    Returns:
        Dict with evaluation scores and feedback
    """
    if Groq is None:
        raise ImportError("groq package required. Install with: pip install groq")
    
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable required")
    
    client = Groq(api_key=api_key)
    
    # Format transcript for evaluation
    transcript_text = ""
    for msg in transcript:
        role = "AI Interviewer" if msg.get("role") == "ai" else candidate_name
        transcript_text += f"{role}: {msg.get('content', '')}\n\n"
    
    # Build evaluation prompt
    eval_prompt = f"""You are an expert interview evaluator. Analyze this interview transcript and provide a structured evaluation.

JOB DESCRIPTION:
{job_description}

INTERVIEW TRANSCRIPT:
{transcript_text}

Provide your evaluation in the following JSON format:
{{
    "personality_score": <0-100>,
    "technical_approach_score": <0-100>,
    "communication_score": <0-100>,
    "problem_solving_score": <0-100>,
    "strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["area1", "area2"],
    "overall_assessment": "Brief 2-3 sentence summary",
    "hire_recommendation": "strong_yes|yes|maybe|no|strong_no"
}}

SCORING GUIDELINES:
- personality_score: Professionalism, enthusiasm, cultural fit (0-100)
- technical_approach_score: Technical knowledge, problem-solving ability (0-100)
- communication_score: Clarity, articulation, listening skills (0-100)
- problem_solving_score: Analytical thinking, creativity (0-100)

Return ONLY valid JSON, no other text."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert interview evaluator. Always respond with valid JSON."},
                {"role": "user", "content": eval_prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON
        try:
            # Handle potential markdown code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            evaluation = json.loads(result_text)
            
            # Ensure required fields exist
            evaluation.setdefault("personality_score", 50)
            evaluation.setdefault("technical_approach_score", 50)
            evaluation.setdefault("communication_score", 50)
            evaluation.setdefault("problem_solving_score", 50)
            evaluation.setdefault("strengths", [])
            evaluation.setdefault("areas_for_improvement", [])
            evaluation.setdefault("overall_assessment", "Evaluation complete.")
            evaluation.setdefault("hire_recommendation", "maybe")
            
            # Calculate overall interview score (Round 2 score)
            evaluation["interview_score"] = round(
                (evaluation["personality_score"] + 
                 evaluation["technical_approach_score"] +
                 evaluation["communication_score"] +
                 evaluation["problem_solving_score"]) / 4,
                1
            )
            
            return evaluation
            
        except json.JSONDecodeError:
            # Return fallback scores
            return {
                "personality_score": 50,
                "technical_approach_score": 50,
                "communication_score": 50,
                "problem_solving_score": 50,
                "interview_score": 50,
                "strengths": [],
                "areas_for_improvement": [],
                "overall_assessment": "Evaluation could not be fully parsed.",
                "hire_recommendation": "maybe",
                "raw_response": result_text
            }
            
    except Exception as e:
        return {
            "personality_score": 0,
            "technical_approach_score": 0,
            "communication_score": 0,
            "problem_solving_score": 0,
            "interview_score": 0,
            "strengths": [],
            "areas_for_improvement": [],
            "overall_assessment": f"Evaluation failed: {str(e)}",
            "hire_recommendation": "no",
            "error": str(e)
        }


def get_round2_score(evaluation: Dict) -> float:
    """
    Extract the Round 2 interview score from evaluation.
    
    Args:
        evaluation: Evaluation dict from evaluate_interview
        
    Returns:
        Interview score (0-100)
    """
    return evaluation.get("interview_score", 
                         (evaluation.get("personality_score", 0) + 
                          evaluation.get("technical_approach_score", 0)) / 2)
