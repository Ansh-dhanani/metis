"""
Candidate Profile Service

Combines data from multiple sources (resume, GitHub, portfolio) into a
unified candidate profile for use in Round 1 scoring and Round 2 interviews.
"""

import uuid
import asyncio
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime


@dataclass
class CandidateProfile:
    """Unified candidate profile combining all parsed sources."""
    
    # Identity
    candidate_id: str
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    
    # Parsed summary
    headline: str = ""
    summary: str = ""
    
    # Skills (deduplicated from all sources)
    skills: List[str] = field(default_factory=list)
    
    # Experience from resume
    experience: List[Dict] = field(default_factory=list)
    education: List[Dict] = field(default_factory=list)
    
    # GitHub data
    github_username: str = ""
    github_repos: List[Dict] = field(default_factory=list)
    github_languages: Dict[str, int] = field(default_factory=dict)
    github_stars: int = 0
    
    # Portfolio data
    portfolio_url: str = ""
    portfolio_projects: List[Dict] = field(default_factory=list)
    
    # LinkedIn (if available)
    linkedin_url: str = ""
    
    # Source data (raw parsed)
    resume_data: Dict = field(default_factory=dict)
    github_data: Dict = field(default_factory=dict)
    portfolio_data: Dict = field(default_factory=dict)
    
    # Metadata
    created_at: str = ""
    round1_score: float = 0.0
    round1_complete: bool = False
    round2_complete: bool = False
    
    def to_dict(self) -> Dict:
        return {
            "candidate_id": self.candidate_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "headline": self.headline,
            "summary": self.summary,
            "skills": self.skills,
            "experience": self.experience,
            "education": self.education,
            "github": {
                "username": self.github_username,
                "repos": self.github_repos[:5],  # Top 5 only
                "languages": self.github_languages,
                "total_stars": self.github_stars
            },
            "portfolio": {
                "url": self.portfolio_url,
                "projects": self.portfolio_projects
            },
            "linkedin_url": self.linkedin_url,
            "created_at": self.created_at,
            "round1_score": self.round1_score,
            "round1_complete": self.round1_complete,
            "round2_complete": self.round2_complete
        }
    
    def get_interview_context(self) -> str:
        """Generate context string for AI interviewer."""
        context_parts = []
        
        context_parts.append(f"Candidate: {self.name}")
        
        if self.headline:
            context_parts.append(f"Title: {self.headline}")
        
        if self.skills:
            context_parts.append(f"Skills: {', '.join(self.skills[:10])}")
        
        if self.experience:
            recent = self.experience[0] if self.experience else {}
            if recent:
                context_parts.append(
                    f"Current/Recent Role: {recent.get('title', '')} at {recent.get('company', '')}"
                )
        
        if self.github_repos:
            top_repos = [r.get('name', '') for r in self.github_repos[:3]]
            context_parts.append(f"Notable GitHub Projects: {', '.join(top_repos)}")
        
        if self.portfolio_projects:
            projects = [p.get('name', '') for p in self.portfolio_projects[:3]]
            context_parts.append(f"Portfolio Projects: {', '.join(projects)}")
        
        return "\n".join(context_parts)


# In-memory storage for demo
_profiles: Dict[str, CandidateProfile] = {}


def generate_candidate_id() -> str:
    """Generate a unique candidate ID."""
    return f"CAND-{uuid.uuid4().hex[:8].upper()}"


def create_profile(
    name: str = "",
    email: str = "",
    resume_data: Dict = None,
    github_data: Dict = None,
    portfolio_data: Dict = None
) -> CandidateProfile:
    """
    Create a unified candidate profile from parsed sources.
    
    Args:
        name: Candidate name (can be extracted from resume)
        email: Candidate email
        resume_data: Parsed resume data from resume_parser
        github_data: Parsed GitHub data from github_analyzer
        portfolio_data: Parsed portfolio data from portfolio_analyzer
        
    Returns:
        CandidateProfile with combined data
    """
    resume_data = resume_data or {}
    github_data = github_data or {}
    portfolio_data = portfolio_data or {}
    
    profile = CandidateProfile(
        candidate_id=generate_candidate_id(),
        created_at=datetime.now().isoformat()
    )
    
    # Extract from resume
    if resume_data:
        profile.name = resume_data.get("name", name) or name
        profile.email = resume_data.get("email", email) or email
        profile.phone = resume_data.get("phone", "")
        profile.headline = resume_data.get("headline", "")
        profile.summary = resume_data.get("summary", "")
        profile.experience = resume_data.get("experience", [])
        profile.education = resume_data.get("education", [])
        profile.skills = list(resume_data.get("skills", []))
        profile.resume_data = resume_data
    
    # Add GitHub data
    if github_data:
        profile.github_username = github_data.get("username", "")
        profile.github_repos = github_data.get("repositories", [])
        profile.github_languages = github_data.get("languages", {})
        profile.github_stars = github_data.get("total_stars", 0)
        profile.github_data = github_data
        
        # Merge skills from GitHub languages
        for lang in profile.github_languages.keys():
            if lang not in profile.skills:
                profile.skills.append(lang)
    
    # Add portfolio data
    if portfolio_data:
        profile.portfolio_url = portfolio_data.get("url", "")
        profile.portfolio_projects = portfolio_data.get("projects", [])
        profile.portfolio_data = portfolio_data
        
        # Merge skills from portfolio
        for skill in portfolio_data.get("skills", []):
            if skill not in profile.skills:
                profile.skills.append(skill)
    
    # Fallback name
    if not profile.name:
        profile.name = github_data.get("name", "") or "Unknown Candidate"
    
    # Store in memory
    _profiles[profile.candidate_id] = profile
    
    return profile


def get_profile(candidate_id: str) -> Optional[CandidateProfile]:
    """Get a candidate profile by ID."""
    return _profiles.get(candidate_id)


def update_profile(candidate_id: str, updates: Dict) -> Optional[CandidateProfile]:
    """Update a candidate profile."""
    profile = _profiles.get(candidate_id)
    if not profile:
        return None
    
    for key, value in updates.items():
        if hasattr(profile, key):
            setattr(profile, key, value)
    
    return profile


def list_profiles() -> List[Dict]:
    """List all candidate profiles."""
    return [p.to_dict() for p in _profiles.values()]


def delete_profile(candidate_id: str) -> bool:
    """Delete a candidate profile."""
    if candidate_id in _profiles:
        del _profiles[candidate_id]
        return True
    return False


async def build_profile_async(
    resume_text: str = "",
    github_url: str = "",
    portfolio_url: str = ""
) -> CandidateProfile:
    """
    Build a candidate profile by parsing all sources asynchronously.
    
    Args:
        resume_text: Raw resume text content
        github_url: GitHub profile URL
        portfolio_url: Portfolio website URL
        
    Returns:
        Complete CandidateProfile
    """
    resume_data = {}
    github_data = {}
    portfolio_data = {}
    
    # Parse resume
    if resume_text:
        try:
            from . import resume_parser
            resume_data = resume_parser.parse_resume(resume_text)
        except Exception as e:
            print(f"Resume parse error: {e}")
    
    # Parse GitHub (async)
    if github_url:
        try:
            from . import github_analyzer
            profile = await github_analyzer.analyze_github_profile(github_url)
            github_data = profile.to_dict()
        except Exception as e:
            print(f"GitHub analyze error: {e}")
    
    # Parse Portfolio (async)
    if portfolio_url:
        try:
            from . import portfolio_analyzer
            portfolio = await portfolio_analyzer.analyze_portfolio(portfolio_url)
            portfolio_data = portfolio.to_dict()
        except Exception as e:
            print(f"Portfolio analyze error: {e}")
    
    return create_profile(
        resume_data=resume_data,
        github_data=github_data,
        portfolio_data=portfolio_data
    )


def build_profile(
    resume_text: str = "",
    github_url: str = "",
    portfolio_url: str = ""
) -> CandidateProfile:
    """Synchronous wrapper for build_profile_async."""
    return asyncio.run(build_profile_async(resume_text, github_url, portfolio_url))
