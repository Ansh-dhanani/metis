"""
Job Description Parser

Extracts skills, seniority level, domain context, and requirements from job descriptions.
"""

import re
from dataclasses import dataclass, field


# Common tech skills by category
SKILL_PATTERNS = {
    # Programming Languages
    "python": r"\bpython\b",
    "java": r"\bjava\b(?!script)",
    "javascript": r"\b(javascript|js)\b",
    "typescript": r"\b(typescript|ts)\b",
    "go": r"\b(golang|go\s+lang)\b",
    "rust": r"\brust\b",
    "c++": r"\b(c\+\+|cpp)\b",
    "c#": r"\b(c#|csharp|c\s+sharp)\b",
    "ruby": r"\bruby\b",
    "php": r"\bphp\b",
    "swift": r"\bswift\b",
    "kotlin": r"\bkotlin\b",
    "dart": r"\bdart\b",
    "sql": r"\bsql\b",
    
    # Frontend
    "react": r"\breact(\.?js)?\b",
    "angular": r"\bangular(\.?js)?\b",
    "vue": r"\bvue(\.?js)?\b",
    "next.js": r"\bnext\.?js\b",
    "html": r"\bhtml5?\b",
    "css": r"\bcss3?\b",
    "tailwind": r"\btailwind\b",
    
    # Backend/Frameworks
    "node.js": r"\bnode(\.?js)?\b",
    "django": r"\bdjango\b",
    "flask": r"\bflask\b",
    "fastapi": r"\bfastapi\b",
    "spring": r"\bspring\s*(boot)?\b",
    "express": r"\bexpress(\.?js)?\b",
    
    # Mobile
    "flutter": r"\bflutter\b",
    "react native": r"\breact\s+native\b",
    "android": r"\bandroid\b",
    "ios": r"\bios\b",
    
    # Cloud & DevOps
    "aws": r"\b(aws|amazon\s+web\s+services)\b",
    "gcp": r"\b(gcp|google\s+cloud)\b",
    "azure": r"\bazure\b",
    "docker": r"\bdocker\b",
    "kubernetes": r"\b(kubernetes|k8s)\b",
    "terraform": r"\bterraform\b",
    "ci/cd": r"\b(ci/?cd|jenkins|github\s+actions)\b",
    
    # Databases
    "postgresql": r"\b(postgresql|postgres)\b",
    "mysql": r"\bmysql\b",
    "mongodb": r"\bmongo(db)?\b",
    "redis": r"\bredis\b",
    "elasticsearch": r"\belasticsearch\b",
    "firebase": r"\bfirebase\b",
    
    # AI/ML
    "machine learning": r"\b(machine\s+learning|ml)\b",
    "deep learning": r"\b(deep\s+learning|dl)\b",
    "tensorflow": r"\btensorflow\b",
    "pytorch": r"\bpytorch\b",
    "llm": r"\b(llm|large\s+language\s+model)\b",
    "nlp": r"\b(nlp|natural\s+language)\b",
    
    # Concepts
    "system design": r"\bsystem\s+design\b",
    "microservices": r"\bmicroservices?\b",
    "rest api": r"\b(rest|restful)\s*(api)?\b",
    "graphql": r"\bgraphql\b",
    "agile": r"\b(agile|scrum)\b",
    "git": r"\bgit(hub|lab)?\b",
}

# Seniority keywords
SENIORITY_PATTERNS = {
    "intern": (r"\b(intern|internship)\b", 0),
    "junior": (r"\b(junior|entry[\s-]?level|associate|jr\.?)\b", 1),
    "mid": (r"\b(mid[\s-]?level|intermediate)\b", 2),
    "senior": (r"\b(senior|sr\.?|experienced)\b", 3),
    "lead": (r"\b(lead|principal|staff)\b", 4),
    "architect": (r"\b(architect|distinguished)\b", 5),
    "manager": (r"\b(manager|director|head\s+of)\b", 5),
}

# Domain/Industry patterns
DOMAIN_PATTERNS = {
    "fintech": r"\b(fintech|financial|banking|payments?|trading)\b",
    "healthcare": r"\b(healthcare|health\s*tech|medical|hipaa|patient)\b",
    "ecommerce": r"\b(e[\s-]?commerce|retail|shopping|marketplace)\b",
    "gaming": r"\b(gaming|game\s+dev|game\s+engine|unity|unreal)\b",
    "edtech": r"\b(edtech|education|learning|lms)\b",
    "saas": r"\b(saas|b2b|enterprise)\b",
    "social": r"\b(social\s+media|community|networking)\b",
    "ai/ml": r"\b(ai[\s/]ml|artificial\s+intelligence|data\s+science)\b",
}


@dataclass
class ParsedJD:
    """Structured representation of a parsed job description."""
    
    raw_text: str
    title: str = ""
    required_skills: list[str] = field(default_factory=list)
    nice_to_have_skills: list[str] = field(default_factory=list)
    seniority: str = "mid"
    seniority_level: int = 2
    years_experience: int | None = None
    domain: str = "general"
    keywords: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "required_skills": self.required_skills,
            "nice_to_have_skills": self.nice_to_have_skills,
            "seniority": self.seniority,
            "seniority_level": self.seniority_level,
            "years_experience": self.years_experience,
            "domain": self.domain,
            "keywords": self.keywords,
        }


def extract_skills(text: str) -> list[str]:
    """Extract technical skills from text using pattern matching."""
    text_lower = text.lower()
    found_skills = []
    
    for skill, pattern in SKILL_PATTERNS.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            found_skills.append(skill)
    
    return found_skills


def extract_seniority(text: str) -> tuple[str, int]:
    """Extract seniority level from text. Returns (level_name, level_number)."""
    text_lower = text.lower()
    
    # Check patterns in order of specificity
    for level, (pattern, score) in SENIORITY_PATTERNS.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            return level, score
    
    return "mid", 2  # Default to mid-level


def extract_years_experience(text: str) -> int | None:
    """Extract years of experience requirement."""
    patterns = [
        r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)",
        r"(?:experience|exp)\s*(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)",
        r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:in|with|of)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return int(match.group(1))
    
    return None


def extract_domain(text: str) -> str:
    """Extract industry/domain context from text."""
    text_lower = text.lower()
    
    for domain, pattern in DOMAIN_PATTERNS.items():
        if re.search(pattern, text_lower, re.IGNORECASE):
            return domain
    
    return "general"


def extract_title(text: str) -> str:
    """Extract job title from first line or common patterns."""
    lines = text.strip().split("\n")
    
    # First non-empty line is often the title
    for line in lines[:3]:
        line = line.strip()
        if line and len(line) < 100:
            # Remove common prefixes
            title = re.sub(r"^(job\s+title|position|role|we're\s+hiring)[\s:]+", "", line, flags=re.IGNORECASE)
            if title:
                return title.strip()
    
    return "Unknown Role"


def parse_job_description(jd_text: str) -> ParsedJD:
    """
    Parse a job description and extract structured information.
    
    Args:
        jd_text: Raw job description text
        
    Returns:
        ParsedJD object with extracted information
    """
    parsed = ParsedJD(raw_text=jd_text)
    
    # Extract title
    parsed.title = extract_title(jd_text)
    
    # Extract all skills found
    all_skills = extract_skills(jd_text)
    
    # Try to separate required vs nice-to-have
    # Look for sections like "nice to have", "preferred", "bonus"
    nice_to_have_section = re.search(
        r"(nice\s+to\s+have|preferred|bonus|plus|optional)[\s:]*(.+?)(?=\n\n|\Z)",
        jd_text,
        re.IGNORECASE | re.DOTALL
    )
    
    if nice_to_have_section:
        nice_skills = extract_skills(nice_to_have_section.group(2))
        parsed.nice_to_have_skills = nice_skills
        parsed.required_skills = [s for s in all_skills if s not in nice_skills]
    else:
        parsed.required_skills = all_skills
    
    # Extract seniority
    parsed.seniority, parsed.seniority_level = extract_seniority(jd_text)
    
    # Extract years of experience
    parsed.years_experience = extract_years_experience(jd_text)
    
    # Extract domain
    parsed.domain = extract_domain(jd_text)
    
    # Store all keywords for reference
    parsed.keywords = all_skills
    
    return parsed


# Convenience function for simple use
def parse(jd_text: str) -> dict:
    """Parse JD and return as dictionary."""
    return parse_job_description(jd_text).to_dict()
