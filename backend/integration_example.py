"""
Model Integration Example

Demonstrates how to connect Model 1 (JD Parser) and Model 2 (Assessment Evaluator)
outputs to Model 3 (Scoring & Leaderboard).

Run this file to see a complete integration example:
    python integration_example.py
"""

from scoring_model import run_model3_pipeline
from scoring_model.schema_validator import validate_for_model3


def create_model1_output():
    """
    Example Model 1 (JD Parser) output.
    
    This would typically come from your LangChain/Groq JD parsing pipeline.
    Model 1 parses the job description and extracts:
    - Skills required
    - Importance/weight of each skill
    """
    return {
        "job_id": "job_sr_dev_001",
        "job_title": "Senior Full-Stack Developer",
        "skill_weights": [
            # Technical skills (higher weights for more important skills)
            {"skill": "React", "weight": 0.22, "importance": 9},
            {"skill": "Python", "weight": 0.18, "importance": 8},
            {"skill": "Node.js", "weight": 0.16, "importance": 7},
            {"skill": "MongoDB", "weight": 0.12, "importance": 5},
            {"skill": "AWS", "weight": 0.12, "importance": 5},
            {"skill": "Docker", "weight": 0.10, "importance": 4},
            # Soft skills
            {"skill": "Communication", "weight": 0.10, "importance": 4}
        ]
        # Note: weights sum to 1.0
    }


def create_model2_outputs():
    """
    Example Model 2 (Assessment Evaluator) outputs.
    
    This would typically come from your LangChain/Groq assessment evaluation pipeline.
    Model 2 evaluates each candidate and produces:
    - Skill scores from assessments
    - Resume claims (parsed from resume)
    """
    return [
        # Candidate 1: Strong performer, honest claims
        {
            "candidate_id": "cand_001",
            "candidate_name": "Alice Johnson",
            "skill_scores": [
                {"skill": "React", "score": 92, "questions_attempted": 5, "correct_answers": 5},
                {"skill": "Python", "score": 85, "questions_attempted": 5, "correct_answers": 4},
                {"skill": "Node.js", "score": 88, "questions_attempted": 4, "correct_answers": 4},
                {"skill": "MongoDB", "score": 75, "questions_attempted": 4, "correct_answers": 3},
                {"skill": "AWS", "score": 70, "questions_attempted": 3, "correct_answers": 2},
                {"skill": "Docker", "score": 65, "questions_attempted": 3, "correct_answers": 2},
                {"skill": "Communication", "score": 90, "questions_attempted": 3, "correct_answers": 3}
            ],
            "resume_claims": [
                {"skill": "React", "claimed_level": "Expert", "years_experience": 5},
                {"skill": "Python", "claimed_level": "Advanced", "years_experience": 4},
                {"skill": "Node.js", "claimed_level": "Advanced", "years_experience": 4},
                {"skill": "MongoDB", "claimed_level": "Intermediate", "years_experience": 2},
                {"skill": "AWS", "claimed_level": "Intermediate", "years_experience": 2},
                {"skill": "Docker", "claimed_level": "Intermediate", "years_experience": 1},
                {"skill": "Communication", "claimed_level": "Expert", "years_experience": 6}
            ]
        },
        
        # Candidate 2: Good performer, slightly inflated claims
        {
            "candidate_id": "cand_002",
            "candidate_name": "Bob Smith",
            "skill_scores": [
                {"skill": "React", "score": 78, "questions_attempted": 5, "correct_answers": 4},
                {"skill": "Python", "score": 72, "questions_attempted": 5, "correct_answers": 3},
                {"skill": "Node.js", "score": 80, "questions_attempted": 4, "correct_answers": 3},
                {"skill": "MongoDB", "score": 65, "questions_attempted": 4, "correct_answers": 2},
                {"skill": "AWS", "score": 55, "questions_attempted": 3, "correct_answers": 2},
                {"skill": "Docker", "score": 50, "questions_attempted": 3, "correct_answers": 1},
                {"skill": "Communication", "score": 85, "questions_attempted": 3, "correct_answers": 3}
            ],
            "resume_claims": [
                {"skill": "React", "claimed_level": "Expert", "years_experience": 4},  # Claimed Expert but scored 78
                {"skill": "Python", "claimed_level": "Advanced", "years_experience": 3},
                {"skill": "Node.js", "claimed_level": "Expert", "years_experience": 4},  # Claimed Expert but scored 80
                {"skill": "MongoDB", "claimed_level": "Advanced", "years_experience": 2},  # Claimed Advanced but scored 65
                {"skill": "AWS", "claimed_level": "Intermediate", "years_experience": 1},
                {"skill": "Docker", "claimed_level": "Intermediate", "years_experience": 1},
                {"skill": "Communication", "claimed_level": "Advanced", "years_experience": 4}
            ]
        },
        
        # Candidate 3: Average performer
        {
            "candidate_id": "cand_003",
            "candidate_name": "Carol Davis",
            "skill_scores": [
                {"skill": "React", "score": 65, "questions_attempted": 5, "correct_answers": 3},
                {"skill": "Python", "score": 70, "questions_attempted": 5, "correct_answers": 3},
                {"skill": "Node.js", "score": 55, "questions_attempted": 4, "correct_answers": 2},
                {"skill": "MongoDB", "score": 72, "questions_attempted": 4, "correct_answers": 3},
                {"skill": "AWS", "score": 45, "questions_attempted": 3, "correct_answers": 1},
                {"skill": "Docker", "score": 40, "questions_attempted": 3, "correct_answers": 1},
                {"skill": "Communication", "score": 80, "questions_attempted": 3, "correct_answers": 2}
            ],
            "resume_claims": [
                {"skill": "React", "claimed_level": "Intermediate", "years_experience": 2},
                {"skill": "Python", "claimed_level": "Advanced", "years_experience": 3},
                {"skill": "Node.js", "claimed_level": "Intermediate", "years_experience": 2},
                {"skill": "MongoDB", "claimed_level": "Intermediate", "years_experience": 2},
                {"skill": "AWS", "claimed_level": "Beginner", "years_experience": 1},
                {"skill": "Docker", "claimed_level": "Beginner", "years_experience": 0},
                {"skill": "Communication", "claimed_level": "Advanced", "years_experience": 4}
            ]
        },
        
        # Candidate 4: Poor performer with heavily inflated claims
        {
            "candidate_id": "cand_004",
            "candidate_name": "David Wilson",
            "skill_scores": [
                {"skill": "React", "score": 42, "questions_attempted": 5, "correct_answers": 2},
                {"skill": "Python", "score": 38, "questions_attempted": 5, "correct_answers": 2},
                {"skill": "Node.js", "score": 35, "questions_attempted": 4, "correct_answers": 1},
                {"skill": "MongoDB", "score": 48, "questions_attempted": 4, "correct_answers": 2},
                {"skill": "AWS", "score": 30, "questions_attempted": 3, "correct_answers": 1},
                {"skill": "Docker", "score": 25, "questions_attempted": 3, "correct_answers": 0},
                {"skill": "Communication", "score": 55, "questions_attempted": 3, "correct_answers": 2}
            ],
            "resume_claims": [
                {"skill": "React", "claimed_level": "Expert", "years_experience": 5},  # BIG gap
                {"skill": "Python", "claimed_level": "Expert", "years_experience": 4},  # BIG gap
                {"skill": "Node.js", "claimed_level": "Advanced", "years_experience": 3},
                {"skill": "MongoDB", "claimed_level": "Advanced", "years_experience": 3},
                {"skill": "AWS", "claimed_level": "Intermediate", "years_experience": 2},
                {"skill": "Docker", "claimed_level": "Intermediate", "years_experience": 1},
                {"skill": "Communication", "claimed_level": "Advanced", "years_experience": 4}
            ]
        }
    ]


def run_integration_example():
    """Run the complete integration example."""
    print("=" * 60)
    print("METIS Model Integration Example")
    print("=" * 60)
    
    # Step 1: Get outputs from Model 1 and Model 2
    print("\n📋 Step 1: Get Model 1 and Model 2 outputs")
    model1_output = create_model1_output()
    model2_outputs = create_model2_outputs()
    
    print(f"   Job: {model1_output['job_title']}")
    print(f"   Skills: {[s['skill'] for s in model1_output['skill_weights']]}")
    print(f"   Candidates: {len(model2_outputs)}")
    
    # Step 2: Validate the data
    print("\n✅ Step 2: Validate data before Model 3")
    is_valid, report = validate_for_model3(
        [model1_output],
        model2_outputs
    )
    
    print(f"   Valid: {is_valid}")
    print(f"   Errors: {report['error_count']}")
    print(f"   Warnings: {report['warning_count']}")
    
    if report['warnings']:
        print("   Warnings:")
        for w in report['warnings'][:3]:  # Show first 3
            print(f"      - {w['field']}: {w['message']}")
    
    if not is_valid:
        print("\n❌ Validation failed! Fix errors before proceeding.")
        for e in report['errors']:
            print(f"   Error: {e['field']}: {e['message']}")
        return
    
    # Step 3: Run Model 3
    print("\n🚀 Step 3: Run Model 3 (Scoring & Leaderboard)")
    result = run_model3_pipeline(
        model1_outputs=[model1_output],
        model2_outputs=model2_outputs
    )
    
    # Step 4: Display results
    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    
    print(f"\n📊 Shortlist Summary:")
    print(f"   Total Applicants: {result['total_applicants']}")
    print(f"   Round 2 (Top 10% or 85+): {result['round_2_count']}")
    print(f"   Round 1 (Top 30% or 70+): {result['round_1_count']}")
    print(f"   Rejected: {result['rejected_count']}")
    
    print("\n🏆 Leaderboard:")
    print("-" * 60)
    print(f"{'Rank':<6}{'Name':<20}{'Weighted':<10}{'Integrity':<10}{'Final':<10}{'Status'}")
    print("-" * 60)
    
    for entry in result['entries']:
        status_icon = {
            'round_2': '🟢',
            'round_1': '🟡',
            'rejected': '🔴'
        }.get(entry['shortlist_status'], '⚪')
        
        print(f"#{entry['rank']:<5}{entry['candidate_name']:<20}"
              f"{entry['weighted_score']:<10.1f}"
              f"{entry['integrity_score']:<10.0f}"
              f"{entry['final_score']:<10.1f}"
              f"{status_icon} {entry['shortlist_status']}")
    
    print("\n" + "=" * 60)
    print("✅ Integration Complete!")
    print("=" * 60)
    
    return result


if __name__ == "__main__":
    run_integration_example()
