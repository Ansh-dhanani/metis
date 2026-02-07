"""
Test Model 1 Integration

Loads evaluations from hackathon folder and runs through Model 3.
"""

import sys
sys.path.insert(0, '.')

from scoring_model.model1_adapter import integrate_with_model3, process_evaluations_directory

def main():
    print("=" * 60)
    print("Model 1 -> Model 3 Integration Test")
    print("=" * 60)
    
    eval_dir = "hackathon/hackathon/evaluations"
    print(f"\nLoading evaluations from: {eval_dir}")
    
    # First show what we're processing
    data = process_evaluations_directory(eval_dir)
    
    if "error" in data:
        print(f"Error: {data['error']}")
        return
    
    print(f"Found {data['evaluation_count']} evaluation files")
    print("\nCandidates loaded:")
    for candidate in data['model2_outputs']:
        print(f"  - {candidate['candidate_name']} ({candidate['candidate_id']})")
        print(f"    Overall Score (M1): {candidate['model1_metadata']['overall_score']}")
        
    print("\nSkill weights for scoring:")
    for sw in data['model1_outputs'][0]['skill_weights']:
        print(f"  - {sw['skill']}: {sw['weight']:.0%}")
    
    # Run Model 3
    print("\n" + "=" * 60)
    print("Running Model 3 Pipeline...")
    print("=" * 60)
    
    result = integrate_with_model3(eval_dir)
    
    if "error" in result:
        print(f"Error: {result['error']}")
        return
    
    print(f"\nTotal Candidates: {result['total_applicants']}")
    print(f"Round 2 (Top 10% or 85+): {result['round_2_count']}")
    print(f"Round 1 (Top 30% or 70+): {result['round_1_count']}")
    print(f"Rejected: {result['rejected_count']}")
    
    print("\n" + "-" * 60)
    print("LEADERBOARD")
    print("-" * 60)
    
    for entry in result['entries']:
        status_icon = {
            'round_2': '🟢',
            'round_1': '🟡',
            'rejected': '🔴'
        }.get(entry['shortlist_status'], '⚪')
        
        print(f"  #{entry['rank']} {entry['candidate_name']}")
        print(f"      Weighted: {entry['weighted_score']:.1f}")
        print(f"      Integrity: {entry['integrity_score']:.0f}%")
        print(f"      Final: {entry['final_score']:.1f}")
        print(f"      Status: {status_icon} {entry['shortlist_status']}")
        print()
    
    print("=" * 60)
    print("Integration Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
