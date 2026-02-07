"""
Groq AI Service

Provides AI-enhanced features using Groq API via LangChain.
Used for generating explanations, recommendations, and interview questions.
"""

import os
from typing import Dict, List, Optional

# Try to import LangChain Groq, provide fallback if not available
try:
    from langchain_groq import ChatGroq
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("Warning: langchain-groq not installed. AI features will use fallback.")


class GroqAIService:
    """
    AI service using Groq API for enhanced scoring features.
    
    Features:
    - Generate scoring explanations
    - Create interview question recommendations
    - Provide hiring insights
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "llama-3.1-8b-instant"):
        """
        Initialize Groq AI service.
        
        Args:
            api_key: Groq API key (or set GROQ_API_KEY env var)
            model: Model to use (default: llama-3.1-8b-instant)
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.model_name = model
        self.llm = None
        
        if GROQ_AVAILABLE and self.api_key:
            self.llm = ChatGroq(
                api_key=self.api_key,
                model_name=self.model_name,
                temperature=0.3
            )
    
    def is_available(self) -> bool:
        """Check if AI service is available."""
        return self.llm is not None
    
    def generate_score_explanation(
        self,
        candidate_name: str,
        weighted_score: float,
        integrity_score: float,
        final_score: float,
        skill_breakdown: List[Dict],
        consistency_flags: List[Dict]
    ) -> str:
        """
        Generate a human-readable explanation of the candidate's score.
        
        Args:
            candidate_name: Name of the candidate
            weighted_score: Weighted assessment score
            integrity_score: Resume consistency score
            final_score: Final combined score
            skill_breakdown: Per-skill scoring breakdown
            consistency_flags: Any integrity issues found
            
        Returns:
            AI-generated explanation text
        """
        if not self.is_available():
            return self._fallback_explanation(
                candidate_name, weighted_score, integrity_score, 
                final_score, skill_breakdown, consistency_flags
            )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an HR analytics expert. Generate a brief, professional 
            explanation of a candidate's assessment score. Be clear and actionable.
            Keep the explanation to 2-3 sentences."""),
            ("user", """Candidate: {candidate_name}
            
Scores:
- Weighted Score (skill performance): {weighted_score}/100
- Integrity Score (resume accuracy): {integrity_score}/100
- Final Score: {final_score}/100

Top Skills: {top_skills}
Weak Skills: {weak_skills}
Integrity Issues: {integrity_issues}

Generate a concise explanation of this candidate's performance.""")
        ])
        
        # Prepare skill summaries
        sorted_skills = sorted(skill_breakdown, key=lambda x: x.get('score', 0), reverse=True)
        top_skills = ", ".join([f"{s['skill']} ({s['score']:.0f})" for s in sorted_skills[:3]])
        weak_skills = ", ".join([f"{s['skill']} ({s['score']:.0f})" for s in sorted_skills[-2:]])
        
        integrity_issues = ", ".join([
            f"{f['skill']} (claimed {f['claimed_level']}, scored {f['actual_score']:.0f})"
            for f in consistency_flags
        ]) if consistency_flags else "None"
        
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            return chain.invoke({
                "candidate_name": candidate_name,
                "weighted_score": weighted_score,
                "integrity_score": integrity_score,
                "final_score": final_score,
                "top_skills": top_skills,
                "weak_skills": weak_skills,
                "integrity_issues": integrity_issues
            })
        except Exception as e:
            print(f"Groq API error: {e}")
            return self._fallback_explanation(
                candidate_name, weighted_score, integrity_score,
                final_score, skill_breakdown, consistency_flags
            )
    
    def generate_interview_questions(
        self,
        candidate_name: str,
        job_title: str,
        strengths: List[Dict],
        weaknesses: List[Dict],
        consistency_flags: List[Dict]
    ) -> Dict:
        """
        Generate targeted interview questions based on assessment results.
        
        Args:
            candidate_name: Name of the candidate
            job_title: Position title
            strengths: Strong skill areas
            weaknesses: Weak skill areas
            consistency_flags: Resume discrepancies
            
        Returns:
            Dictionary of categorized interview questions
        """
        if not self.is_available():
            return self._fallback_interview_questions(strengths, weaknesses, consistency_flags)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert technical interviewer. Generate targeted 
            interview questions based on the candidate's assessment results.
            Format: Return exactly 3 questions for each category, one per line."""),
            ("user", """Job Title: {job_title}
Candidate: {candidate_name}

Strong Skills (probe depth): {strengths}
Weak Skills (assess potential): {weaknesses}
Resume Discrepancies (clarify): {discrepancies}

Generate 3 interview questions for EACH category:
STRENGTHS:
WEAKNESSES:
CLARIFICATIONS:""")
        ])
        
        strengths_str = ", ".join([f"{s['skill']}" for s in strengths[:3]])
        weaknesses_str = ", ".join([f"{s['skill']}" for s in weaknesses[:3]])
        discrepancies_str = ", ".join([
            f"{f['skill']} (claimed {f['claimed_level']})"
            for f in consistency_flags
        ]) if consistency_flags else "None"
        
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            response = chain.invoke({
                "job_title": job_title,
                "candidate_name": candidate_name,
                "strengths": strengths_str,
                "weaknesses": weaknesses_str,
                "discrepancies": discrepancies_str
            })
            
            return self._parse_interview_response(response)
        except Exception as e:
            print(f"Groq API error: {e}")
            return self._fallback_interview_questions(strengths, weaknesses, consistency_flags)
    
    def _fallback_explanation(
        self,
        candidate_name: str,
        weighted_score: float,
        integrity_score: float,
        final_score: float,
        skill_breakdown: List[Dict],
        consistency_flags: List[Dict]
    ) -> str:
        """Fallback explanation when AI is not available."""
        if final_score >= 85:
            performance = "excellent"
            recommendation = "Strongly recommended for advancement."
        elif final_score >= 70:
            performance = "good"
            recommendation = "Recommended for next round."
        elif final_score >= 55:
            performance = "moderate"
            recommendation = "Consider with reservations."
        else:
            performance = "below average"
            recommendation = "May not meet requirements."
        
        consistency = "no integrity concerns" if integrity_score >= 90 else "some resume accuracy concerns"
        
        return f"{candidate_name} showed {performance} technical performance with {consistency}. {recommendation}"
    
    def _fallback_interview_questions(
        self,
        strengths: List[Dict],
        weaknesses: List[Dict],
        consistency_flags: List[Dict]
    ) -> Dict:
        """Fallback interview questions when AI is not available."""
        return {
            "strengths": [
                f"Can you describe a complex project where you leveraged your {s['skill']} expertise?"
                for s in strengths[:2]
            ],
            "weaknesses": [
                f"How are you working to improve your {w['skill']} skills?"
                for w in weaknesses[:2]
            ],
            "clarifications": [
                f"Your resume indicates {f['claimed_level']} level in {f['skill']}, but your assessment suggests otherwise. Can you explain?"
                for f in consistency_flags[:2]
            ] if consistency_flags else ["No clarifications needed."]
        }
    
    def _parse_interview_response(self, response: str) -> Dict:
        """Parse AI response into structured questions."""
        lines = response.strip().split('\n')
        result = {"strengths": [], "weaknesses": [], "clarifications": []}
        current_category = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if "STRENGTH" in line.upper():
                current_category = "strengths"
            elif "WEAKNESS" in line.upper():
                current_category = "weaknesses"
            elif "CLARIF" in line.upper():
                current_category = "clarifications"
            elif current_category and line:
                # Remove numbering if present
                if line[0].isdigit() and '.' in line[:3]:
                    line = line.split('.', 1)[1].strip()
                result[current_category].append(line)
        
        return result


# Global service instance (initialized lazily)
_groq_service = None


def get_groq_service() -> GroqAIService:
    """Get or create the global Groq AI service instance."""
    global _groq_service
    if _groq_service is None:
        _groq_service = GroqAIService()
    return _groq_service
