import json
import random

class AIService:
    def parse_job_description(self, raw_text):
        """
        Mock AI parsing of a job description.
        Returns structured data including skills and experience level.
        """
        # Mock logic: extract some common keywords if present, else return defaults
        skills = []
        if "react" in raw_text.lower():
            skills.append({"skill": "React", "importance": 9, "category": "technical"})
        if "python" in raw_text.lower():
            skills.append({"skill": "Python", "importance": 8, "category": "technical"})
        if "mongodb" in raw_text.lower():
            skills.append({"skill": "MongoDB", "importance": 7, "category": "technical"})
        
        # Default skills if none found
        if not skills:
            skills = [
                {"skill": "Communication", "importance": 8, "category": "soft"},
                {"skill": "Problem Solving", "importance": 9, "category": "soft"}
            ]

        return {
            "requiredSkills": skills,
            "experienceLevel": "Senior" if "senior" in raw_text.lower() else "Mid-Level",
            "summary": "This is a mocked parsed summary of the JD."
        }

    def generate_question(self, skill, difficulty):
        """
        Mock generation of a question for a given skill and difficulty.
        """
        return {
            "questionId": f"q_{random.randint(1000, 9999)}",
            "skill": skill,
            "difficulty": difficulty,
            "text": f"What is a key concept in {skill} (Difficulty: {difficulty})?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": f"Option A is correct because it relates to {skill} principles."
        }

    def parse_resume(self, raw_text):
        """
        Enhanced AI parsing of a resume with comprehensive extraction.
        Returns structured data matching the expected format.
        """
        import re
        
        text_lower = raw_text.lower()
        
        # Extract skills
        skills = []
        skill_keywords = ['python', 'java', 'javascript', 'react', 'node', 'mongodb', 'sql', 
                         'aws', 'docker', 'kubernetes', 'git', 'typescript', 'angular', 
                         'vue', 'django', 'flask', 'spring', 'html', 'css', 'c++', 'c#',
                         'go', 'rust', 'machine learning', 'ai', 'data science']
        
        for skill in skill_keywords:
            if skill in text_lower:
                skills.append(skill.title())
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, raw_text)
        email = emails[0] if emails else ""
        
        # Extract phone number
        phone_pattern = r'[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}'
        phones = re.findall(phone_pattern, raw_text)
        phone = phones[0] if phones else ""
        
        # Extract LinkedIn URL
        linkedin_pattern = r'linkedin\.com/in/[\w-]+'
        linkedin_matches = re.findall(linkedin_pattern, raw_text.lower())
        linkedinUrl = f"https://{linkedin_matches[0]}" if linkedin_matches else ""
        
        # Extract GitHub URL
        github_pattern = r'github\.com/[\w-]+'
        github_matches = re.findall(github_pattern, raw_text.lower())
        githubUrl = f"https://{github_matches[0]}" if github_matches else ""
        
        # Extract portfolio/website URL
        portfolio_pattern = r'https?://(?:www\.)?[\w-]+\.[\w.]+/?[\w.-]*'
        portfolio_matches = re.findall(portfolio_pattern, raw_text)
        # Filter out linkedin/github from portfolio
        portfolioUrl = next((url for url in portfolio_matches 
                           if 'linkedin' not in url.lower() and 'github' not in url.lower()), "")
        
        # Extract education (parse degree, institution, duration)
        education = []
        education_keywords = ['bachelor', 'master', 'phd', 'degree', 'university', 'college', 'institute']
        lines = raw_text.split('\n')
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in education_keywords):
                degree = line.strip()
                institution = lines[i+1].strip() if i+1 < len(lines) else ""
                duration = ""
                # Look for year patterns like 2018-2022 or 2018 - 2022
                year_pattern = r'20\d{2}\s*[-–]\s*20\d{2}|20\d{2}\s*[-–]\s*present'
                year_match = re.search(year_pattern, line + " " + (lines[i+1] if i+1 < len(lines) else ""), re.IGNORECASE)
                if year_match:
                    duration = year_match.group(0)
                
                education.append({
                    "degree": degree,
                    "institution": institution,
                    "duration": duration,
                    "details": ""
                })
                if len(education) >= 3:  # Limit to 3 education entries
                    break
        
        # If no education found, add empty entry
        if not education:
            education = []
        
        # Extract projects (look for project section)
        projects = []
        project_section_found = False
        for i, line in enumerate(lines):
            if 'project' in line.lower() and len(line.strip()) < 50:
                project_section_found = True
                continue
            if project_section_found and line.strip() and not any(kw in line.lower() for kw in ['experience', 'education', 'skill', 'certification']):
                if len(line.strip()) > 20:  # Likely a project title
                    description = lines[i+1].strip() if i+1 < len(lines) else ""
                    projects.append({
                        "name": line.strip(),
                        "description": description,
                        "technologies": ", ".join(skills[:3]) if skills else "",
                        "url": ""
                    })
                if len(projects) >= 3:  # Limit to 3 projects
                    break
        
        # Extract certifications
        certifications = []
        cert_keywords = ['certified', 'certification', 'certificate', 'aws', 'azure', 'google cloud', 'comptia', 'cisco']
        for line in lines:
            if any(cert in line.lower() for cert in cert_keywords):
                cert_text = line.strip()
                if cert_text and len(cert_text) < 100:
                    certifications.append(cert_text)
                if len(certifications) >= 5:  # Limit to 5 certifications
                    break
        
        # Extract experience summary
        experience_text = ""
        exp_section = False
        for line in lines:
            if 'experience' in line.lower() and len(line.strip()) < 50:
                exp_section = True
                continue
            if exp_section and line.strip():
                experience_text += line + "\n"
                if len(experience_text) > 500:  # Limit experience text
                    break
        
        return {
            "skills": skills[:15],  # Limit to top 15 skills
            "email": email,
            "phone": phone,
            "linkedinUrl": linkedinUrl,
            "githubUrl": githubUrl,
            "portfolioUrl": portfolioUrl,
            "education": education,
            "projects": projects,
            "certifications": certifications,
            "experience": experience_text.strip() or "Experience details not found in resume"
        }

    def generate_interview_question(self, skill, type, context):
        """
        Mock generation of an interview question.
        """
        questions = {
            'depth_probe': f"Tell me about a complex challenge you faced with {skill}. {context}",
            'gap_exploration': f"How would you go about learning more advanced concepts in {skill}? {context}",
            'clarification': f"Can you explain your experience level with {skill} in more detail? {context}"
        }
        return questions.get(type, f"General question about {skill}.")

ai_service = AIService()
