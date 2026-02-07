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
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    summary: str = ""
    skills: list[str] = field(default_factory=list)
    experience: list[Experience] = field(default_factory=list)
    education: list[Education] = field(default_factory=list)
    projects: list[Project] = field(default_factory=list)
    certifications: list[str] = field(default_factory=list)
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "location": self.location,
            "summary": self.summary,
            "skills": self.skills,
            "experience": [e.to_dict() for e in self.experience],
            "education": [e.to_dict() for e in self.education],
            "projects": [p.to_dict() for p in self.projects],
            "certifications": self.certifications,
            "linkedin": self.linkedin,
            "github": self.github,
            "portfolio": self.portfolio,
        }


def extract_email(text: str) -> str:
    """Extract email address from text."""
    # More comprehensive email pattern
    pattern = r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b"
    matches = re.findall(pattern, text)
    
    # Return first valid email found
    for email in matches:
        # Skip generic/placeholder emails
        if not any(skip in email.lower() for skip in ['example.com', 'test.com', 'email.com']):
            return email
    
    return ""


def extract_phone(text: str) -> str:
    """Extract phone number from text."""
    patterns = [
        r"\+91[-\s]?\d{10}",  # Indian format with +91
        r"\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
        r"\d{10}",  # Simple 10-digit
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    return ""


def extract_name(text: str) -> str:
    """Extract name from resume text - looks for proper name patterns."""
    lines = text.strip().split("\n")
    
    for line in lines[:5]:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
            
        # Skip lines with common resume keywords
        if re.search(r"(resume|curriculum vitae|cv|portfolio|profile)", line, re.IGNORECASE):
            continue
            
        # Skip lines with email or phone
        if re.search(r"[@+\d]", line):
            continue
            
        # Skip lines that are too short or too long
        if len(line) < 3 or len(line) > 50:
            continue
            
        # Look for name pattern: 2-3 capitalized words
        words = line.split()
        if 2 <= len(words) <= 4:
            # Check if all words start with capital letter
            if all(word[0].isupper() for word in words if word):
                return line
    
    # Fallback: first non-empty line that looks like a name
    for line in lines[:3]:
        line = line.strip()
        if line and len(line) < 50 and not re.search(r"[@#$%^&*(){}[\]\d]", line):
            return line
    
    return ""


def split_name(full_name: str) -> tuple[str, str]:
    """Split full name into first and last name."""
    parts = full_name.strip().split()
    if len(parts) == 0:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def extract_links(text: str) -> dict:
    """Extract LinkedIn, GitHub, and portfolio links from resume text."""
    links = {
        "linkedin": "",
        "github": "",
        "portfolio": ""
    }

    patterns = {
        "linkedin": r"https?://(www\.)?linkedin\.com/[^\s]+",
        "github": r"https?://(www\.)?github\.com/[^\s]+",
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            links[key] = match.group(0)

    # Portfolio - any URL that's not LinkedIn/GitHub
    portfolio_pattern = r"https?://[a-zA-Z0-9.-]+\.(dev|app|com|in|io|vercel\.app)[^\s]*"
    portfolio_matches = re.findall(portfolio_pattern, text, re.IGNORECASE)
    for url in portfolio_matches:
        if 'linkedin' not in url.lower() and 'github' not in url.lower():
            links["portfolio"] = url
            break

    return links


def extract_skills_section(text: str) -> list[str]:
    """Extract skills from skills section."""
    skills = []
    
    # Find skills section - improved pattern
    skills_pattern = r"(?:technical\s+)?skills?\s*[:\-]?\s*\n?(.*?)(?=\n\s*(?:experience|education|projects?|certifications?)\s*\n|\Z)"
    match = re.search(skills_pattern, text, re.IGNORECASE | re.DOTALL)
    
    if match:
        skills_text = match.group(1)
        
        # Remove section headers like "AI & ML:", "Tools & Data:", etc.
        skills_text = re.sub(r"(?:AI & ML|Languages|Tools|Frameworks|Data|Computer Vision)[:\s]*", "", skills_text, flags=re.IGNORECASE)
        
        # Split by common delimiters
        raw_skills = re.split(r"[,|•·]", skills_text)
        
        seen = set()
        for skill in raw_skills:
            skill = skill.strip()
            # Clean up skill text
            skill = re.sub(r"^[-•·\-]\s*", "", skill)
            skill = re.sub(r"\([^)]*\)", "", skill)  # Remove parenthetical info
            skill = skill.strip()
            
            # Skip if it's too short, too long, or already seen
            if (skill and 
                len(skill) > 1 and 
                len(skill) < 50 and
                skill.lower() not in seen and
                not skill.lower() in ['and', 'or', 'the', 'a', 'an']):
                seen.add(skill.lower())
                skills.append(skill)
    
    return skills


def extract_section(text: str, section_name: str) -> str:
    """Extract content of a named section."""
    # Normalize text - handle various section header formats
    # Look for section headers that might have special formatting
    pattern = rf"(?:^|\n)\s*(?:###\s*)?{section_name}\s*[:\-]?\s*\n(.*?)(?=\n\s*(?:###\s*)?(?:experience|education|technical\s+skills?|skills?|projects?|certifications?|summary|objective|professional\s+experience)\s*[:\-]?\s*\n|\Z)"
    
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE)
    if match:
        content = match.group(1).strip()
        return content
    
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
    
    # Split by common separators or degree patterns
    entries = []
    current_entry = []
    
    lines = section.split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Skip lines that are clearly not education-related
        skip_keywords = ['skills:', 'tools:', 'frameworks:', 'languages:', 'ai & ml', 'computer vision', 
                        'pytorch', 'tensorflow', 'python', 'java', 'sql', 'flask', 'opencv']
        if any(keyword in line.lower() for keyword in skip_keywords):
            # If we have a current entry, this marks the end of education section
            if current_entry:
                break
            continue
            
        # Check if this line starts a new education entry (has degree keyword)
        if re.search(degree_pattern, line, re.IGNORECASE):
            if current_entry:
                entries.append('\n'.join(current_entry))
            current_entry = [line]
        else:
            if current_entry:
                current_entry.append(line)
    
    if current_entry:
        entries.append('\n'.join(current_entry))
    
    for entry in entries:
        if not entry.strip():
            continue
        
        degree = ""
        institution = ""
        year = ""
        gpa = ""
        
        # Look for degree
        degree_match = re.search(degree_pattern, entry, re.IGNORECASE)
        if degree_match:
            degree = degree_match.group(0).strip()
        
        # Look for year range (2020-2024 or 2020 – 2024)
        year_match = re.search(r"(20\d{2})\s*[-–]\s*(20\d{2}|present|current)", entry, re.IGNORECASE)
        if year_match:
            year = year_match.group(0)
        elif re.search(r"\b(20\d{2}|19\d{2})\b", entry):
            year = re.search(r"\b(20\d{2}|19\d{2})\b", entry).group(0)
        
        # Look for GPA
        gpa_match = re.search(r"(?:gpa|cgpa)[:\s]*(\d+\.?\d*)", entry, re.IGNORECASE)
        if gpa_match:
            gpa = gpa_match.group(1)
        
        # Institution is typically the line after degree or a capitalized line
        lines = entry.split("\n")
        for line in lines:
            line = line.strip()
            # Skip degree line, year line, gpa line, and skill keywords
            if (line and 
                not re.search(degree_pattern, line, re.IGNORECASE) and
                not re.search(r"^\d{4}", line) and
                not re.search(r"gpa|cgpa", line, re.IGNORECASE) and
                len(line) > 5 and
                not any(kw in line.lower() for kw in ['skills:', 'tools:', 'frameworks:'])):
                institution = line[:100]
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
    """Parse projects section into structured entries with URLs and bullets."""
    projects = []
    section = extract_section(text, "projects?")
    
    if not section:
        return projects
    
    # Split by project headers (capitalized lines followed by content)
    blocks = re.split(r"\n(?=[A-Z][^\n]{3,80}(?:\n|$))", section)
    
    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if len(lines) < 1:
            continue
        
        # First line is project name (may include dates)
        name_line = lines[0]
        # Remove dates from name
        name = re.sub(r"\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})", "", name_line, flags=re.IGNORECASE)
        name = name.strip()
        
        # Extract URL from entire block
        url_match = re.search(r"https?://[^\s]+", block)
        url = url_match.group(0) if url_match else ""
        
        # Extract bullet points (lines starting with • or -)
        bullets = []
        for line in lines[1:]:
            if line.startswith("•") or line.startswith("-"):
                bullet = line.lstrip("•-").strip()
                bullets.append(bullet)
        
        description = " ".join(bullets)
        
        # Extract technologies mentioned
        tech_keywords = [
            "react", "next.js", "nextjs", "node.js", "nodejs", "postgresql", 
            "prisma", "tailwind", "tailwindcss", "docker", "aws", "redis", 
            "mongodb", "python", "javascript", "typescript", "flask", 
            "firebase", "vercel", "git", "jwt", "rest api", "api",
            "shadcn", "ui", "clerk", "auth", "authentication"
        ]
        technologies = []
        block_lower = block.lower()
        for tech in tech_keywords:
            if tech in block_lower:
                technologies.append(tech.title())
        
        # Remove duplicates
        technologies = list(set(technologies))
        
        if name:
            projects.append(Project(
                name=name[:100],
                description=description[:500] if description else "",
                technologies=technologies
            ))
    
    return projects


def parse_certifications_section(text: str) -> list[str]:
    """Parse certifications section into a list of certifications."""
    certifications = []
    
    # Try multiple section name patterns
    section = None
    for pattern in [r"certifications?", r"licenses?", r"credentials?"]:
        section = extract_section(text, pattern)
        if section:
            break
    
    if not section:
        return certifications
    
    # Split by bullet points, newlines, or numbered items
    entries = re.split(r"\n|•|\-|\d+\.", section)
    
    for entry in entries:
        entry = entry.strip()
        if not entry or len(entry) < 5:  # Skip very short entries
            continue
        
        # Clean up common certification patterns
        # Remove dates in parentheses like (2023), (Jan 2023), etc.
        entry = re.sub(r"\s*\([^)]*\d{4}[^)]*\)", "", entry)
        # Remove trailing dates like - 2023, | 2023
        entry = re.sub(r"[\-\|]\s*\d{4}.*$", "", entry)
        # Clean up extra whitespace
        entry = " ".join(entry.split())
        
        if entry and len(entry) >= 5:  # Valid certification
            certifications.append(entry[:100])  # Limit length
    
    return certifications


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
    print(f"DEBUG: Extracted name: [{parsed.name}]")
    
    parsed.first_name, parsed.last_name = split_name(parsed.name)
    print(f"DEBUG: Split name - First: [{parsed.first_name}], Last: [{parsed.last_name}]")
    
    parsed.email = extract_email(resume_text)
    print(f"DEBUG: Extracted email: [{parsed.email}]")
    
    parsed.phone = extract_phone(resume_text)
    print(f"DEBUG: Extracted phone: [{parsed.phone}]")
    
    # Extract social links
    links = extract_links(resume_text)
    parsed.linkedin = links["linkedin"]
    parsed.github = links["github"]
    parsed.portfolio = links["portfolio"]
    print(f"DEBUG: Links - LinkedIn: [{parsed.linkedin}], GitHub: [{parsed.github}], Portfolio: [{parsed.portfolio}]")
    
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
    
    # Extract certifications
    parsed.certifications = parse_certifications_section(resume_text)
    
    return parsed


# Convenience function
def parse(resume_text: str) -> dict:
    """Parse resume and return as dictionary."""
    return parse_resume(resume_text).to_dict()
