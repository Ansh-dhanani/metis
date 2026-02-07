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
        Mock AI parsing of a resume.
        """
        # Mock logic
        skills = []
        if "python" in raw_text.lower():
            skills.append({"name": "Python", "proficiency": "Expert"})
        if "react" in raw_text.lower():
            skills.append({"name": "React", "proficiency": "Advanced"})
        if "java" in raw_text.lower():
            skills.append({"name": "Java", "proficiency": "Intermediate"})
            
        return {
            "skills": skills,
            "education": "Bachelor's Degree in Computer Science",
            "experience": "3 years of experience in software development."
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
