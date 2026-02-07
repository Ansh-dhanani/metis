"""
Metis Backend API Testing Script
Run this to test all backend routes
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}→ {msg}{Colors.END}")

def test_endpoint(method, endpoint, data=None, headers=None, expected_status=200):
    url = f"{BASE_URL}{endpoint}"
    print_info(f"Testing {method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        if response.status_code == expected_status:
            print_success(f"Status: {response.status_code}")
            return response.json() if response.content else None
        else:
            print_error(f"Expected {expected_status}, got {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

def main():
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}Metis Backend API Testing{Colors.END}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}\n")
    
    # Test 1: Register HR
    print(f"\n{Colors.YELLOW}1. Testing User Registration (HR){Colors.END}")
    hr_data = {
        "email": "hr@test.com",
        "password": "test123",
        "firstName": "Test",
        "lastName": "HR",
        "role": "hr"
    }
    hr_result = test_endpoint("POST", "/users/register", data=hr_data, expected_status=201)
    hr_token = hr_result.get("token") if hr_result else None
    hr_id = hr_result.get("userId") if hr_result else None
    
    # Test 2: Login HR
    print(f"\n{Colors.YELLOW}2. Testing User Login (HR){Colors.END}")
    login_data = {"email": "hr@test.com", "password": "test123"}
    login_result = test_endpoint("POST", "/users/login", data=login_data)
    if login_result:
        hr_token = login_result.get("token")
        hr_id = login_result.get("userId")
    
    # Test 3: Get Profile
    if hr_token:
        print(f"\n{Colors.YELLOW}3. Testing Get Profile{Colors.END}")
        headers = {"Authorization": f"Bearer {hr_token}"}
        test_endpoint("GET", "/users/profile", headers=headers)
    
    # Test 4: Create Job
    print(f"\n{Colors.YELLOW}4. Testing Create Job{Colors.END}")
    job_data = {
        "title": "Senior Software Engineer",
        "description": "We are looking for a senior software engineer with expertise in Python, JavaScript, and React. The ideal candidate should have 5+ years of experience in full-stack development.",
        "location": "San Francisco, CA",
        "type": "full-time",
        "hrId": hr_id,
        "skillWeights": [
            {"skill": "Python", "weight": 0.3},
            {"skill": "JavaScript", "weight": 0.3},
            {"skill": "React", "weight": 0.4}
        ]
    }
    job_result = test_endpoint("POST", "/jobs", data=job_data, headers=headers, expected_status=201)
    job_id = job_result.get("jobId") if job_result else None
    
    # Test 5: Get All Jobs
    print(f"\n{Colors.YELLOW}5. Testing Get All Jobs{Colors.END}")
    test_endpoint("GET", "/jobs")
    
    # Test 6: Get Single Job
    if job_id:
        print(f"\n{Colors.YELLOW}6. Testing Get Single Job{Colors.END}")
        test_endpoint("GET", f"/jobs/{job_id}")
    
    # Test 7: Register Candidate
    print(f"\n{Colors.YELLOW}7. Testing User Registration (Candidate){Colors.END}")
    candidate_data = {
        "email": "candidate@test.com",
        "password": "test123",
        "firstName": "Test",
        "lastName": "Candidate",
        "role": "candidate"
    }
    candidate_result = test_endpoint("POST", "/users/register", data=candidate_data, expected_status=201)
    candidate_token = candidate_result.get("token") if candidate_result else None
    candidate_id = candidate_result.get("userId") if candidate_result else None
    
    # Test 8: Create Assessment
    if job_id and candidate_id:
        print(f"\n{Colors.YELLOW}8. Testing Create Assessment{Colors.END}")
        assessment_data = {
            "jobId": job_id,
            "candidateId": candidate_id
        }
        candidate_headers = {"Authorization": f"Bearer {candidate_token}"}
        assessment_result = test_endpoint("POST", "/assessments", data=assessment_data, headers=candidate_headers, expected_status=201)
        assessment_id = assessment_result.get("assessmentId") if assessment_result else None
        
        # Test 9: Get Assessment
        if assessment_id:
            print(f"\n{Colors.YELLOW}9. Testing Get Assessment{Colors.END}")
            get_assessment = test_endpoint("GET", f"/assessments/{assessment_id}", headers=candidate_headers)
            
            # Test 10: Complete Assessment
            if get_assessment and "questions" in get_assessment:
                print(f"\n{Colors.YELLOW}10. Testing Complete Assessment{Colors.END}")
                questions = get_assessment["questions"]
                responses = []
                for q in questions:
                    responses.append({
                        "questionId": q["_id"],
                        "skill": q["skill"],
                        "selectedAnswer": q["options"][0],  # Select first option
                        "isCorrect": True  # Mock correct answer
                    })
                
                complete_data = {"responses": responses}
                test_endpoint("POST", f"/assessments/{assessment_id}/complete", data=complete_data, headers=candidate_headers)
            
            # Test 11: Get Job Assessments
            print(f"\n{Colors.YELLOW}11. Testing Get Job Assessments{Colors.END}")
            test_endpoint("GET", f"/assessments/job/{job_id}", headers=headers)
            
            # Test 12: Get Candidate Assessments
            print(f"\n{Colors.YELLOW}12. Testing Get Candidate Assessments{Colors.END}")
            test_endpoint("GET", f"/assessments/candidate/{candidate_id}", headers=candidate_headers)
            
            # Test 13: Generate Rankings
            print(f"\n{Colors.YELLOW}13. Testing Generate Rankings{Colors.END}")
            test_endpoint("POST", f"/rankings/job/{job_id}/generate", headers=headers)
            
            # Test 14: Get Rankings
            print(f"\n{Colors.YELLOW}14. Testing Get Rankings{Colors.END}")
            test_endpoint("GET", f"/rankings/job/{job_id}", headers=headers)
            
            # Test 15: Generate Interview Questions
            print(f"\n{Colors.YELLOW}15. Testing Generate Interview Questions{Colors.END}")
            interview_data = {"assessmentId": assessment_id}
            test_endpoint("POST", "/interview/generate", data=interview_data, headers=headers)
            
            # Test 16: Get Interview Questions
            print(f"\n{Colors.YELLOW}16. Testing Get Interview Questions{Colors.END}")
            test_endpoint("GET", f"/interview/assessment/{assessment_id}", headers=headers)
    
    print(f"\n{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.GREEN}Testing Complete!{Colors.END}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}\n")

if __name__ == "__main__":
    main()
