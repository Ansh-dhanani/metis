#!/usr/bin/env python3
"""
Test script to verify METIS models integration
"""

import sys
import os

# Add models to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'models'))

print("=" * 60)
print("METIS Models Integration Test")
print("=" * 60)

# Test 1: METIS-CORE Import
print("\n1. Testing METIS-CORE imports...")
try:
    from metis.evaluator import evaluate_candidate
    from metis.resume_parser import parse as parse_resume
    print("   ✅ METIS-CORE imported successfully")
    METIS_OK = True
except ImportError as e:
    print(f"   ❌ METIS-CORE import failed: {e}")
    METIS_OK = False

# Test 2: AI Interviewer Import
print("\n2. Testing AI Interviewer imports...")
try:
    from metis.interviewer_ai import LiveInterviewer
    from metis.transcriber import transcribe_audio
    from metis.tts import speak_async
    print("   ✅ AI Interviewer imported successfully")
    INTERVIEWER_OK = True
except ImportError as e:
    print(f"   ❌ AI Interviewer import failed: {e}")
    INTERVIEWER_OK = False

# Test 3: LangGraph Scoring Import
print("\n3. Testing LangGraph Scoring imports...")
try:
    from scoring.leaderboard import LeaderboardService
    from scoring.langgraph_model import run_scoring_pipeline
    print("   ✅ LangGraph Scoring imported successfully")
    SCORING_OK = True
except ImportError as e:
    print(f"   ❌ LangGraph Scoring import failed: {e}")
    SCORING_OK = False

# Test 4: METIS Resume Parsing
if METIS_OK:
    print("\n4. Testing METIS resume parsing...")
    try:
        sample_resume = """
        John Doe
        Software Engineer
        john@example.com | +1-234-567-8900
        
        SKILLS
        Python, JavaScript, React, Node.js, MongoDB, Docker
        
        EXPERIENCE
        Senior Developer at Tech Corp (2020-2024)
        - Led team of 5 developers
        - Built scalable microservices
        - Reduced latency by 40%
        
        EDUCATION
        BS Computer Science, MIT, 2020
        """
        
        parsed = parse_resume(sample_resume)
        print(f"   ✅ Parsed resume: {parsed.get('name', 'Unknown')}")
        print(f"   ✅ Found {len(parsed.get('skills', []))} skills")
        print(f"   ✅ Found {len(parsed.get('experience', []))} experiences")
    except Exception as e:
        print(f"   ❌ Resume parsing failed: {e}")

# Test 5: Check Environment
print("\n5. Checking environment...")
groq_key = os.getenv('GROQ_API_KEY')
if groq_key:
    print(f"   ✅ GROQ_API_KEY is set ({groq_key[:10]}...)")
else:
    print("   ⚠️  GROQ_API_KEY not set (required for AI features)")

mongo_uri = os.getenv('MONGO_URI') or os.getenv('DATABASE_URL')
if mongo_uri:
    print("   ✅ MongoDB URI is set")
else:
    print("   ⚠️  MONGO_URI not set (required for database)")

# Summary
print("\n" + "=" * 60)
print("INTEGRATION TEST SUMMARY")
print("=" * 60)
print(f"METIS-CORE:       {'✅ PASS' if METIS_OK else '❌ FAIL'}")
print(f"AI Interviewer:   {'✅ PASS' if INTERVIEWER_OK else '❌ FAIL'}")
print(f"LangGraph Scoring: {'✅ PASS' if SCORING_OK else '❌ FAIL'}")
print("=" * 60)

if METIS_OK and INTERVIEWER_OK and SCORING_OK:
    print("\n🎉 All models integrated successfully!")
    print("\nNext steps:")
    print("1. Set GROQ_API_KEY in .env file")
    print("2. Run: python app.py")
    print("3. Test API endpoints")
    sys.exit(0)
else:
    print("\n⚠️  Some models failed to load")
    print("Check error messages above and install missing dependencies")
    sys.exit(1)
