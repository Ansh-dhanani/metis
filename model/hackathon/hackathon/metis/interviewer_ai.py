"""
METIS Interviewer AI

AI-powered live interviewer using Groq LLM (Llama-3).
Conducts technical and behavioral interviews based on job description.
"""

import os
from typing import List, Dict, Optional
from dataclasses import dataclass, field

# Try to import Groq
try:
    from groq import Groq
except ImportError:
    Groq = None


@dataclass
class InterviewMessage:
    """Single message in interview conversation."""
    role: str  # 'ai' or 'candidate'
    content: str
    timestamp: float = 0.0


@dataclass
class LiveInterviewer:
    """
    AI Interviewer that conducts live interviews.
    
    Uses Groq's Llama-3 model for intelligent question generation
    and response handling.
    """
    job_description: str
    candidate_name: str = "Candidate"
    candidate_context: str = ""  # Profile context from Round 1
    max_questions: int = 10
    
    # Internal state
    conversation_history: List[InterviewMessage] = field(default_factory=list)
    question_count: int = 0
    is_complete: bool = False
    _client: Optional[object] = None
    
    def __post_init__(self):
        """Initialize Groq client."""
        if Groq is None:
            raise ImportError("groq package required. Install with: pip install groq")
        
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable required")
        
        self._client = Groq(api_key=api_key)
        
        # Build candidate context section
        context_section = ""
        if self.candidate_context:
            context_section = f"""

CANDIDATE BACKGROUND (from their resume/portfolio):
{self.candidate_context}

USE THIS CONTEXT:
- Ask about their specific projects and experience
- Reference their GitHub repositories or portfolio projects
- Ask follow-ups based on their stated skills
"""
        
        # Build system prompt
        self._system_prompt = f"""You are an expert technical interviewer conducting a job interview.

JOB DESCRIPTION:
{self.job_description}
{context_section}
INTERVIEW RULES:
1. Ask relevant technical and behavioral questions based on the job description
2. If candidate context is provided, ask about their specific projects
3. Keep questions concise and focused
4. Listen to responses and ask follow-up questions when appropriate
5. Be professional but friendly
6. After {self.max_questions} questions, wrap up the interview
7. Evaluate both technical skills and communication ability

You are interviewing: {self.candidate_name}

Start with a warm greeting and then begin asking questions one at a time."""
    
    def get_opening(self) -> str:
        """Get the interview opening message."""
        messages = [
            {"role": "system", "content": self._system_prompt},
            {"role": "user", "content": "Please start the interview with a greeting and your first question."}
        ]
        
        response = self._call_llm(messages)
        
        self.conversation_history.append(InterviewMessage(
            role="ai",
            content=response
        ))
        self.question_count = 1
        
        return response
    
    def respond_to_candidate(self, candidate_text: str) -> str:
        """
        Process candidate response and generate AI follow-up.
        
        Args:
            candidate_text: Candidate's spoken/typed response
            
        Returns:
            AI's next question or response
        """
        # Add candidate response to history
        self.conversation_history.append(InterviewMessage(
            role="candidate",
            content=candidate_text
        ))
        
        # Build message history for LLM
        messages = [{"role": "system", "content": self._system_prompt}]
        
        for msg in self.conversation_history:
            role = "assistant" if msg.role == "ai" else "user"
            messages.append({"role": role, "content": msg.content})
        
        # Add instruction for next response
        if self.question_count >= self.max_questions:
            messages.append({
                "role": "user",
                "content": "[System: This is the final question. Wrap up the interview politely.]"
            })
            self.is_complete = True
        
        response = self._call_llm(messages)
        
        self.conversation_history.append(InterviewMessage(
            role="ai",
            content=response
        ))
        self.question_count += 1
        
        # Check if interview should end
        if self.question_count > self.max_questions:
            self.is_complete = True
        
        return response
    
    def end_interview(self) -> str:
        """Force end the interview and get closing message."""
        self.is_complete = True
        
        messages = [
            {"role": "system", "content": self._system_prompt},
            {"role": "user", "content": "The candidate wants to end the interview. Please provide a polite closing message thanking them for their time."}
        ]
        
        response = self._call_llm(messages)
        
        self.conversation_history.append(InterviewMessage(
            role="ai",
            content=response
        ))
        
        return response
    
    def get_transcript(self) -> List[Dict]:
        """Get full interview transcript."""
        return [
            {"role": msg.role, "content": msg.content}
            for msg in self.conversation_history
        ]
    
    def _call_llm(self, messages: List[Dict]) -> str:
        """Make LLM API call."""
        try:
            response = self._client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"I apologize, I'm having technical difficulties. Could you repeat that? (Error: {str(e)[:50]})"


# Convenience function for quick testing
def create_interviewer(jd_text: str, name: str = "Candidate") -> LiveInterviewer:
    """Create a new LiveInterviewer instance."""
    return LiveInterviewer(
        job_description=jd_text,
        candidate_name=name
    )
