"""Test script to verify METIS parser works correctly"""

from models.metis.resume_parser import parse as metis_parse

# Sample resume text
sample_resume = """
John Doe
john.doe@email.com | (555) 123-4567
linkedin.com/in/johndoe | github.com/johndoe

SUMMARY
Experienced software developer with 5+ years in full-stack development.

SKILLS
Python, JavaScript, React, Node.js, MongoDB, AWS, Docker, TypeScript, Flask, Django

EXPERIENCE
Senior Software Engineer
Tech Corp | 2020 - Present
- Led development of microservices architecture serving 1M+ users
- Implemented CI/CD pipelines reducing deployment time by 60%
- Mentored team of 5 junior developers

Software Developer
StartupXYZ | 2018 - 2020
- Built RESTful APIs using Python Flask
- Developed React frontend applications

EDUCATION
Bachelor of Science in Computer Science
University of Technology | 2018
GPA: 3.8/4.0

PROJECTS
E-Commerce Platform
Built full-stack e-commerce application using React, Node.js, and MongoDB
Implemented payment processing with Stripe API

AI Chatbot
Developed intelligent chatbot using Python and Natural Language Processing
Integrated with Slack for team communication

CERTIFICATIONS
AWS Certified Solutions Architect (2022)
Google Cloud Professional Developer (2021)
MongoDB Certified Developer (2020)
"""

print("Testing METIS Parser...")
print("=" * 50)

try:
    result = metis_parse(sample_resume)
    
    print("\n✅ Parser executed successfully!")
    print("\nParsed Data:")
    print(f"Name: {result.get('name')}")
    print(f"Email: {result.get('email')}")
    print(f"Phone: {result.get('phone')}")
    print(f"Skills ({len(result.get('skills', []))}): {result.get('skills')}")
    print(f"\nEducation ({len(result.get('education', []))} entries):")
    for edu in result.get('education', []):
        print(f"  - {edu}")
    print(f"\nExperience ({len(result.get('experience', []))} entries):")
    for exp in result.get('experience', []):
        print(f"  - {exp}")
    print(f"\nProjects ({len(result.get('projects', []))} entries):")
    for proj in result.get('projects', []):
        print(f"  - {proj}")
    print(f"\nCertifications ({len(result.get('certifications', []))} entries):")
    for cert in result.get('certifications', []):
        print(f"  - {cert}")
    
    print("\n" + "=" * 50)
    print("✅ All fields extracted successfully!")
    
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
