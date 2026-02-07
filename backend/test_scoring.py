"""
Test script for the METIS Scoring Model
"""

import sys
sys.path.insert(0, '.')

from scoring_model.sample_data import get_demo_data
from scoring_model.langgraph_model import run_batch_scoring

def test_scoring():
    print("=" * 50)
    print("METIS Scoring Model Test")
    print("=" * 50)
    
    # Load demo data
    data = get_demo_data()
    
    print(f"\nJob: {data['job_title']}")
    print(f"Candidates: {len(data['candidates'])}")
    print(f"Skills: {[sw['skill'] for sw in data['skill_weights']]}")
    
    # Run batch scoring
    result = run_batch_scoring(
        data['job_id'],
        data['job_title'],
        data['skill_weights'],
        data['candidates']
    )
    
    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print(f"\nTotal Candidates: {len(result['entries'])}")
    print(f"Round 2 (Top 10% or 85+): {result['round_2_count']}")
    print(f"Round 1 (Top 30% or 70+): {result['round_1_count']}")
    print(f"Rejected: {result['rejected_count']}")
    
    print("\n" + "-" * 50)
    print("LEADERBOARD")
    print("-" * 50)
    
    for entry in result['entries']:
        status_emoji = {
            'round_2': '🟢',
            'round_1': '🟡',
            'rejected': '🔴'
        }.get(entry['shortlist_status'], '⚪')
        
        integrity_flag = '⚠️' if entry.get('has_consistency_issues') else '✓'
        
        print(f"  #{entry['rank']} {entry['candidate_name']}")
        print(f"      Weighted: {entry['weighted_score']:.1f}")
        print(f"      Integrity: {entry['integrity_score']:.0f}% {integrity_flag}")
        print(f"      Final: {entry['final_score']:.1f}")
        print(f"      Status: {status_emoji} {entry['shortlist_status']}")
        print()
    
    print("=" * 50)
    print("TEST COMPLETE")
    print("=" * 50)

if __name__ == '__main__':
    test_scoring()
