"""
Resume Parser

Extracts structured data from resume text including education, experience,
skills, and projects.
"""

import re
import os
from dataclasses import dataclass, field

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None


@dataclass
class Experience:
    """Work experience entry."""
    title: str
    company: str
    duration: str = ""
    description: str = ""
    
    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "company": self.company,
            "duration": self.duration,
            "description": self.description,
        }


@dataclass
class Education:
    """Education entry."""
    degree: str
    institution: str
    year: str = ""
    gpa: str = ""
    
    def to_dict(self) -> dict:
        return {
            "degree": self.degree,
            "institution": self.institution,
            "year": self.year,
            "gpa": self.gpa,
        }


@dataclass
class Project:
    """Project entry."""
    name: str
    description: str = ""
    technologies: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "technologies": self.technologies,
        }


@dataclass
class ParsedResume:
    """Structured representation of a parsed resume."""
    
    raw_text: str
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    summary: str = ""
    skills: list[str] = field(default_factory=list)
    experience: list[Experience] = field(default_factory=list)
    education: list[Education] = field(default_factory=list)
    projects: list[Project] = field(default_factory=list)
    certifications: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "summary": self.summary,
            "skills": self.skills,
            "experience": [e.to_dict() for e in self.experience],
            "education": [e.to_dict() for e in self.education],
            "projects": [p.to_dict() for p in self.projects],
            "certifications": self.certifications,
        }


def extract_email(text: str) -> str:
    """Extract email address from text."""
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    match = re.search(pattern, text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    """Extract phone number from text."""
    patterns = [
        r"\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
        r"\+\d{10,12}",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return ""


def extract_name(text: str) -> str:
    """Extract name from first line of resume."""
    lines = text.strip().split("\n")
    for line in lines[:3]:
        line = line.strip()
        # Name is typically first line, without special characters
        if line and len(line) < 50 and not re.search(r"[@#$%^&*(){}[\]]", line):
            # Skip if it looks like a header
            if not re.match(r"^(resume|curriculum vitae|cv)$", line, re.IGNORECASE):
                return line
    return ""


def extract_skills_section(text: str) -> list[str]:
    """Extract skills from skills section."""
    skills = []
    
    # Find skills section
    skills_pattern = r"(?:technical\s+)?skills?\s*[:\-]?\s*\n?(.*?)(?=\n\s*\n|\Z|(?:experience|education|projects?))"
    match = re.search(skills_pattern, text, re.IGNORECASE | re.DOTALL)
    
    if match:
        skills_text = match.group(1)
        
        # Split by common delimiters
        raw_skills = re.split(r"[,|•·\n]", skills_text)
        
        for skill in raw_skills:
            skill = skill.strip()
            # Clean up skill text
            skill = re.sub(r"^[-•·]\s*", "", skill)
            skill = re.sub(r"\s*[:]\s*.*$", "", skill)  # Remove sub-items
            
            if skill and len(skill) < 50:
                skills.append(skill)
    
    return skills


def extract_section(text: str, section_name: str) -> str:
    """Extract content of a named section."""
    # Common section headers
    patterns = [
        rf"\n\s*{section_name}\s*\n(.*?)(?=\n\s*(?:experience|education|skills?|projects?|certifications?|summary|objective)\s*\n|\Z)",
        rf"^{section_name}\s*\n(.*?)(?=\n\s*(?:experience|education|skills?|projects?|certifications?|summary|objective)\s*\n|\Z)",
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE)
        if match:
            return match.group(1).strip()
    
    return ""


def parse_experience_section(text: str) -> list[Experience]:
    """Parse experience section into structured entries."""
    experiences = []
    section = extract_section(text, r"(?:work\s+)?experience")
    
    if not section:
        return experiences
    
    # Split by common patterns (company names often on their own line)
    # Look for patterns like "Title | Company" or "Title at Company"
    entries = re.split(r"\n(?=[A-Z][^a-z]*(?:\||at|@|-)\s*[A-Z])", section)
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        lines = entry.split("\n")
        if not lines:
            continue
        
        # First line usually has title and company
        first_line = lines[0]
        
        # Try to parse "Title | Company" or "Title at Company"
        title_company = re.match(
            r"(.+?)\s*(?:\||at|@|-)\s*(.+)",
            first_line,
            re.IGNORECASE
        )
        
        if title_company:
            title = title_company.group(1).strip()
            company = title_company.group(2).strip()
        else:
            title = first_line.strip()
            company = ""
        
        # Look for duration
        duration = ""
        duration_match = re.search(
            r"(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|present|current)",
            entry,
            re.IGNORECASE
        )
        if duration_match:
            duration = f"{duration_match.group(1)} - {duration_match.group(2)}"
        
        # Rest is description
        description = "\n".join(lines[1:]).strip()
        
        if title:
            experiences.append(Experience(
                title=title,
                company=company,
                duration=duration,
                description=description[:500]  # Limit description length
            ))
    
    return experiences


def parse_education_section(text: str) -> list[Education]:
    """Parse education section into structured entries."""
    education_list = []
    section = extract_section(text, "education")
    
    if not section:
        return education_list
    
    # Look for degree patterns
    degree_pattern = r"(bachelor|master|phd|b\.?tech|m\.?tech|b\.?s\.?|m\.?s\.?|diploma|associate)[^,\n]*"
    
    entries = re.split(r"\n(?=[A-Z])", section)
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        degree = ""
        institution = ""
        year = ""
        gpa = ""
        
        # Look for degree
        degree_match = re.search(degree_pattern, entry, re.IGNORECASE)
        if degree_match:
            degree = degree_match.group(0).strip()
        
        # Look for year
        year_match = re.search(r"\b(20\d{2}|19\d{2})\b", entry)
        if year_match:
            year = year_match.group(0)
        
        # Look for GPA
        gpa_match = re.search(r"(?:gpa|cgpa)[:\s]*(\d+\.?\d*)", entry, re.IGNORECASE)
        if gpa_match:
            gpa = gpa_match.group(1)
        
        # Institution is typically a line or phrase not matching other patterns
        lines = entry.split("\n")
        for line in lines:
            line = line.strip()
            if line and not re.search(r"(gpa|bachelor|master|phd|diploma|\d{4})", line, re.IGNORECASE):
                if len(line) > 5:
                    institution = line
                    break
        
        if degree or institution:
            education_list.append(Education(
                degree=degree,
                institution=institution,
                year=year,
                gpa=gpa
            ))
    
    return education_list


def parse_projects_section(text: str) -> list[Project]:
    """Parse projects section into structured entries."""
    projects = []
    section = extract_section(text, "projects?")
    
    if not section:
        return projects
    
    # Split by bullet points or numbered items
    entries = re.split(r"\n(?=[•\-\d]|\n[A-Z])", section)
    
    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        
        # Clean up entry
        entry = re.sub(r"^[•\-\d.]+\s*", "", entry)
        
        lines = entry.split("\n")
        name = lines[0].strip() if lines else ""
        description = " ".join(lines[1:]).strip() if len(lines) > 1 else ""
        
        # Extract technologies mentioned
        tech_keywords = [
            "react", "python", "java", "javascript", "node", "flutter",
            "firebase", "mongodb", "postgresql", "aws", "docker",
            "typescript", "spring", "django", "flask", "angular", "vue"
        ]
        technologies = [t for t in tech_keywords if t in entry.lower()]
        
        if name:
            projects.append(Project(
                name=name[:100],
                description=description[:300],
                technologies=technologies
            ))
    
    return projects


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    if PdfReader is None:
        raise ImportError("pypdf is required for PDF parsing. Install with `pip install pypdf`")
    
    text = []
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text.append(content)
        return "\n".join(text)
    except Exception as e:
        return ""


def read_resume_file(file_path: str) -> str:
    """Read resume content from file (supports .pdf and .txt)."""
    if str(file_path).lower().endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    
    # Default to text
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def parse_resume(resume_text: str) -> ParsedResume:
    """
    Parse resume text and extract structured information.
    
    Args:
        resume_text: Raw resume text
        
    Returns:
        ParsedResume object with extracted information
    """
    parsed = ParsedResume(raw_text=resume_text)
    
    # Extract contact info
    parsed.name = extract_name(resume_text)
    parsed.email = extract_email(resume_text)
    parsed.phone = extract_phone(resume_text)
    
    # Extract summary
    summary_section = extract_section(resume_text, r"(?:summary|objective|about)")
    parsed.summary = summary_section[:500] if summary_section else ""
    
    # Extract skills
    parsed.skills = extract_skills_section(resume_text)
    
    # Extract experience
    parsed.experience = parse_experience_section(resume_text)
    
    # Extract education
    parsed.education = parse_education_section(resume_text)
    
    # Extract projects
    parsed.projects = parse_projects_section(resume_text)
    
    return parsed


# Convenience function
def parse(resume_text: str) -> dict:
    """Parse resume and return as dictionary."""
    return parse_resume(resume_text).to_dict()
