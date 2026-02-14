"""
Resume Parser - Improved version with comprehensive data extraction

Extracts structured data from resume text including education, experience,
skills, projects, certifications, and contact information without losing data.
"""

import re
import os
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None


@dataclass
class Experience:
    """Work experience entry with comprehensive field support."""
    title: str = ""
    position: str = ""  # Alias for title
    company: str = ""
    organization: str = ""  # Alias for company
    employer: str = ""  # Another alias
    duration: str = ""
    period: str = ""  # Alias for duration
    dates: str = ""  # Another alias
    start_date: str = ""
    end_date: str = ""
    location: str = ""
    description: str = ""
    responsibilities: List[str] = field(default_factory=list)
    achievements: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to dictionary with normalized field names."""
        # Normalize: use primary fields, fallback to aliases
        title_value = self.title or self.position
        company_value = self.company or self.organization or self.employer
        duration_value = self.duration or self.period or self.dates
        
        # If we have start/end dates but no duration, construct it
        if not duration_value and (self.start_date or self.end_date):
            duration_value = f"{self.start_date} - {self.end_date}".strip(" -")
        
        # Combine description with responsibilities/achievements
        full_description = self.description
        if self.responsibilities:
            full_description += "\n" + "\n".join(f"• {r}" for r in self.responsibilities)
        if self.achievements:
            full_description += "\n" + "\n".join(f"• {a}" for a in self.achievements)
        
        return {
            "title": title_value,
            "position": title_value,
            "company": company_value,
            "organization": company_value,
            "duration": duration_value,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "location": self.location,
            "description": full_description.strip(),
            "responsibilities": self.responsibilities,
            "achievements": self.achievements,
        }


@dataclass
class Education:
    """Education entry with comprehensive field support."""
    degree: str = ""
    qualification: str = ""  # Alias
    institution: str = ""
    school: str = ""  # Alias
    university: str = ""  # Alias
    college: str = ""  # Alias
    field: str = ""
    field_of_study: str = ""  # Alias
    major: str = ""  # Alias
    specialization: str = ""  # Alias
    stream: str = ""  # Alias
    year: str = ""
    graduation_year: str = ""  # Alias
    start_date: str = ""
    end_date: str = ""
    gpa: str = ""
    cgpa: str = ""
    percentage: str = ""
    location: str = ""
    
    def to_dict(self) -> dict:
        """Convert to dictionary with normalized field names."""
        degree_value = self.degree or self.qualification
        institution_value = self.institution or self.school or self.university or self.college
        field_value = self.field or self.field_of_study or self.major or self.specialization or self.stream
        year_value = self.year or self.graduation_year
        
        # If we have start/end dates but no year, construct it
        if not year_value and (self.start_date or self.end_date):
            year_value = f"{self.start_date} - {self.end_date}".strip(" -")
        
        gpa_value = self.gpa or self.cgpa or self.percentage
        
        return {
            "degree": degree_value,
            "qualification": degree_value,
            "institution": institution_value,
            "school": institution_value,
            "university": institution_value,
            "field": field_value,
            "field_of_study": field_value,
            "major": field_value,
            "year": year_value,
            "graduation_year": year_value,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "gpa": gpa_value,
            "cgpa": self.cgpa,
            "percentage": self.percentage,
            "location": self.location,
        }


@dataclass
class Project:
    """Project entry with comprehensive field support."""
    name: str = ""
    title: str = ""  # Alias
    project_name: str = ""  # Alias
    description: str = ""
    summary: str = ""  # Alias
    details: str = ""  # Alias
    technologies: List[str] = field(default_factory=list)
    tech_stack: List[str] = field(default_factory=list)  # Alias
    tools: List[str] = field(default_factory=list)  # Alias
    url: str = ""
    link: str = ""  # Alias
    project_url: str = ""  # Alias
    github: str = ""
    repository: str = ""  # Alias
    duration: str = ""
    role: str = ""
    team_size: str = ""
    highlights: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to dictionary with normalized field names."""
        name_value = self.name or self.title or self.project_name
        description_value = self.description or self.summary or self.details
        
        # Merge all technology-related lists
        all_techs = list(set(
            self.technologies + self.tech_stack + self.tools
        ))
        
        url_value = self.url or self.link or self.project_url or self.github or self.repository
        
        # Add highlights to description if present
        if self.highlights:
            description_value += "\n" + "\n".join(f"• {h}" for h in self.highlights)
        
        return {
            "name": name_value,
            "title": name_value,
            "description": description_value.strip(),
            "summary": description_value.strip(),
            "technologies": all_techs,
            "tech_stack": all_techs,
            "tools": all_techs,
            "url": url_value,
            "link": url_value,
            "github": self.github,
            "repository": self.repository,
            "duration": self.duration,
            "role": self.role,
            "team_size": self.team_size,
            "highlights": self.highlights,
        }


@dataclass
class Certification:
    """Certification entry with comprehensive field support."""
    name: str = ""
    title: str = ""  # Alias
    certification_name: str = ""  # Alias
    issuer: str = ""
    organization: str = ""  # Alias
    issued_by: str = ""  # Alias
    provider: str = ""  # Alias
    date: str = ""
    issue_date: str = ""  # Alias
    issued_date: str = ""  # Alias
    year: str = ""  # Alias
    issued: str = ""  # Alias
    expiry_date: str = ""
    credential_id: str = ""
    credential_url: str = ""
    
    def to_dict(self) -> dict:
        """Convert to dictionary with normalized field names."""
        name_value = self.name or self.title or self.certification_name
        issuer_value = self.issuer or self.organization or self.issued_by or self.provider
        date_value = self.date or self.issue_date or self.issued_date or self.year or self.issued
        
        return {
            "name": name_value,
            "title": name_value,
            "issuer": issuer_value,
            "organization": issuer_value,
            "date": date_value,
            "issue_date": date_value,
            "year": date_value,
            "expiry_date": self.expiry_date,
            "credential_id": self.credential_id,
            "credential_url": self.credential_url,
        }


@dataclass
class ParsedResume:
    """Comprehensive structured representation of a parsed resume."""
    
    raw_text: str
    name: str = ""
    full_name: str = ""  # Alias
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    email_address: str = ""  # Alias
    phone: str = ""
    phone_number: str = ""  # Alias
    mobile: str = ""  # Alias
    contact: str = ""  # Alias
    location: str = ""
    address: str = ""  # Alias
    city: str = ""
    state: str = ""
    country: str = ""
    summary: str = ""
    objective: str = ""  # Alias
    profile: str = ""  # Alias
    about: str = ""  # Alias
    skills: List[str] = field(default_factory=list)
    technical_skills: List[str] = field(default_factory=list)
    soft_skills: List[str] = field(default_factory=list)
    experience: List[Experience] = field(default_factory=list)
    work_experience: List[Experience] = field(default_factory=list)  # Alias
    education: List[Education] = field(default_factory=list)
    academic: List[Education] = field(default_factory=list)  # Alias
    projects: List[Project] = field(default_factory=list)
    certifications: List[Certification] = field(default_factory=list)
    licenses: List[Certification] = field(default_factory=list)  # Alias
    linkedin: str = ""
    linkedin_url: str = ""  # Alias
    github: str = ""
    github_url: str = ""  # Alias
    portfolio: str = ""
    portfolio_url: str = ""  # Alias
    website: str = ""  # Alias
    languages: List[str] = field(default_factory=list)
    awards: List[str] = field(default_factory=list)
    publications: List[str] = field(default_factory=list)
    volunteer: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        """Convert to dictionary with all fields and aliases."""
        # Merge experience lists
        all_experience = self.experience + self.work_experience
        # Remove duplicates based on company and title
        seen_exp = set()
        unique_experience = []
        for exp in all_experience:
            key = (exp.company or exp.organization, exp.title or exp.position)
            if key not in seen_exp and key != ("", ""):
                seen_exp.add(key)
                unique_experience.append(exp)
        
        # Merge education lists
        all_education = self.education + self.academic
        seen_edu = set()
        unique_education = []
        for edu in all_education:
            key = (edu.institution or edu.school, edu.degree)
            if key not in seen_edu and key != ("", ""):
                seen_edu.add(key)
                unique_education.append(edu)
        
        # Merge certifications
        all_certs = self.certifications + self.licenses
        seen_certs = set()
        unique_certs = []
        for cert in all_certs:
            if isinstance(cert, Certification):
                key = (cert.name or cert.title, cert.issuer)
                if key not in seen_certs and key != ("", ""):
                    seen_certs.add(key)
                    unique_certs.append(cert)
            elif isinstance(cert, str) and cert not in seen_certs:
                seen_certs.add(cert)
                unique_certs.append(cert)
        
        # Merge all skills
        all_skills = list(set(
            self.skills + self.technical_skills + self.soft_skills
        ))
        
        # Normalize contact info
        email_value = self.email or self.email_address
        phone_value = self.phone or self.phone_number or self.mobile or self.contact
        location_value = self.location or self.address
        if self.city or self.state or self.country:
            location_parts = [p for p in [self.city, self.state, self.country] if p]
            location_value = location_value or ", ".join(location_parts)
        
        summary_value = self.summary or self.objective or self.profile or self.about
        
        linkedin_value = self.linkedin or self.linkedin_url
        github_value = self.github or self.github_url
        portfolio_value = self.portfolio or self.portfolio_url or self.website
        
        return {
            "name": self.name or self.full_name,
            "full_name": self.name or self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": email_value,
            "email_address": email_value,
            "phone": phone_value,
            "phone_number": phone_value,
            "mobile": phone_value,
            "location": location_value,
            "address": location_value,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "summary": summary_value,
            "objective": summary_value,
            "skills": all_skills,
            "technical_skills": self.technical_skills,
            "soft_skills": self.soft_skills,
            "experience": [e.to_dict() for e in unique_experience],
            "work_experience": [e.to_dict() for e in unique_experience],
            "education": [e.to_dict() for e in unique_education],
            "academic": [e.to_dict() for e in unique_education],
            "projects": [p.to_dict() for p in self.projects],
            "certifications": [c.to_dict() if isinstance(c, Certification) else {"name": c, "issuer": "", "date": ""} for c in unique_certs],
            "licenses": [c.to_dict() if isinstance(c, Certification) else {"name": c, "issuer": "", "date": ""} for c in unique_certs],
            "linkedin": linkedin_value,
            "linkedin_url": linkedin_value,
            "linkedinUrl": linkedin_value,  # Frontend format
            "github": github_value,
            "github_url": github_value,
            "githubUrl": github_value,  # Frontend format
            "portfolio": portfolio_value,
            "portfolio_url": portfolio_value,
            "portfolioUrl": portfolio_value,  # Frontend format
            "website": portfolio_value,
            "languages": self.languages,
            "awards": self.awards,
            "publications": self.publications,
            "volunteer": self.volunteer,
        }


def extract_email(text: str) -> str:
    """Extract email address from text with multiple patterns."""
    patterns = [
        r"\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b",
        r"[Ee]mail\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
        r"[Ee]-?mail\s*:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})",
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for email in matches:
            # Skip generic/placeholder emails
            if not any(skip in email.lower() for skip in ['example.com', 'test.com', 'email.com', 'sample.com']):
                return email
    
    return ""


def extract_phone(text: str) -> str:
    """Extract phone number from text with comprehensive patterns."""
    patterns = [
        r"\+91[-\s]?\d{10}",  # Indian format with +91
        r"\+91[-\s]?\d{5}[-\s]?\d{5}",  # Indian format with space
        r"\+1[-\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",  # US format
        r"\+\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",  # International
        r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",  # Standard format
        r"\d{10}",  # Simple 10-digit
        r"\d{3}[-.\s]\d{3}[-.\s]\d{4}",  # Formatted
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            phone = match.group(0)
            # Validate it looks like a phone number
            digits = re.sub(r'\D', '', phone)
            if 10 <= len(digits) <= 15:
                return phone
    
    return ""


def extract_name(text: str) -> str:
    """Extract name from resume text with improved patterns."""
    lines = [l.strip() for l in text.strip().split("\n") if l.strip()]
    
    for i, line in enumerate(lines[:10]):  # Check first 10 lines
        # Skip common header keywords
        if re.search(r"(resume|curriculum vitae|cv|portfolio|profile)", line, re.IGNORECASE):
            continue
        
        # Skip lines with contact info patterns
        if re.search(r"[@+\(\)\d]|email|phone|linkedin|github", line, re.IGNORECASE):
            continue
        
        # Skip lines that are too short or too long
        if len(line) < 3 or len(line) > 60:
            continue
        
        # Skip lines with special characters or numbers
        if re.search(r"[#$%^&*(){}[\]\\|<>]|\d{2,}", line):
            continue
        
        # Look for name pattern: 2-4 capitalized words
        words = line.split()
        if 2 <= len(words) <= 4:
            # Check if words look like names (capitalized, mostly letters)
            if all(
                word[0].isupper() and 
                len(re.sub(r'[^a-zA-Z]', '', word)) >= 2
                for word in words if word
            ):
                return line
        
        # Single capitalized word might be a name if it's the first non-empty line
        if i == 0 and len(words) == 1 and words[0][0].isupper() and len(words[0]) > 2:
            # Check if next line might be last name
            if i + 1 < len(lines):
                next_words = lines[i + 1].split()
                if len(next_words) == 1 and next_words[0][0].isupper():
                    return f"{words[0]} {next_words[0]}"
            return words[0]
    
    return ""


def split_name(full_name: str) -> Tuple[str, str]:
    """Split full name into first and last name."""
    parts = full_name.strip().split()
    if len(parts) == 0:
        return "", ""
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def extract_location(text: str) -> Dict[str, str]:
    """Extract location information from text."""
    location_info = {
        "full": "",
        "city": "",
        "state": "",
        "country": ""
    }
    
    # Look for location patterns
    patterns = [
        r"(?:Location|Address|City)\s*:\s*([^\n]+)",
        r"\b([A-Z][a-z]+),\s*([A-Z]{2})\s*\d{5}\b",  # City, State ZIP
        r"\b([A-Z][a-z]+),\s*([A-Z][a-z]+),\s*([A-Z][a-z]+)\b",  # City, State, Country
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            location_info["full"] = match.group(0)
            break
    
    return location_info


def extract_links(text: str) -> Dict[str, str]:
    """Extract social media and portfolio links with comprehensive patterns."""
    links = {
        "linkedin": "",
        "linkedin_url": "",
        "github": "",
        "github_url": "",
        "portfolio": "",
        "portfolio_url": "",
        "website": ""
    }

    # LinkedIn patterns
    linkedin_patterns = [
        r"https?://(?:www\.)?linkedin\.com/in/[^\s<>\"\']+",
        r"linkedin\.com/in/[^\s<>\"\']+",
        r"(?:LinkedIn|Linkedin)\s*:\s*(https?://[^\s]+|[^\s]+linkedin[^\s]+)",
    ]
    for pattern in linkedin_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            url = match.group(0) if match.group(0).startswith('http') else f"https://{match.group(0)}"
            links["linkedin"] = url
            links["linkedin_url"] = url
            break

    # GitHub patterns
    github_patterns = [
        r"https?://(?:www\.)?github\.com/[^\s<>\"\']+",
        r"github\.com/[^\s<>\"\']+",
        r"(?:GitHub|Github)\s*:\s*(https?://[^\s]+|[^\s]+github[^\s]+)",
    ]
    for pattern in github_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            url = match.group(0) if match.group(0).startswith('http') else f"https://{match.group(0)}"
            links["github"] = url
            links["github_url"] = url
            break

    # Portfolio/Website - comprehensive TLD list
    portfolio_pattern = r"https?://[a-zA-Z0-9.-]+\.(?:dev|app|com|in|io|net|org|xyz|co|me|tech|online|site|vercel\.app|github\.io|netlify\.app|herokuapp\.com|web\.app|firebaseapp\.com|repl\.co|glitch\.me|now\.sh|surge\.sh)(?:/[^\s<>\"\']*)?(?=\s|$|<|>|\"|\|)"
    all_urls = re.findall(portfolio_pattern, text, re.IGNORECASE)
    
    for url in all_urls:
        url_lower = url.lower()
        # Skip LinkedIn and GitHub URLs
        if 'linkedin.com' not in url_lower and 'github.com' not in url_lower:
            links["portfolio"] = url
            links["portfolio_url"] = url
            links["website"] = url
            break

    return links


def extract_skills_section(text: str) -> List[str]:
    """Extract skills with improved pattern matching and cleaning."""
    skills = []
    
    # Multiple section header patterns
    section_patterns = [
        r"(?:technical\s+)?(?:skills?|competencies|expertise|technologies)\s*[:\-]?\s*\n?(.*?)(?=\n\s*(?:experience|education|projects?|certifications?|work\s+history|employment|academic|background|awards?|languages?|interests?)\s*[:\-]?\s*\n|\Z)",
        r"(?:skills?\s+and\s+)?(?:abilities|proficiencies)\s*[:\-]?\s*\n?(.*?)(?=\n\s*(?:experience|education|projects?)\s*[:\-]?\s*\n|\Z)",
    ]
    
    skills_text = ""
    for pattern in section_patterns:
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            skills_text = match.group(1)
            break
    
    if not skills_text:
        return skills
    
    # Remove subsection headers
    subsection_headers = [
        r"(?:AI\s*&\s*ML|Machine\s+Learning|Deep\s+Learning)",
        r"(?:Languages?\s*(?:&|and)?\s*Frameworks?|Programming\s+Languages?)",
        r"(?:Tools?\s*(?:&|and)?\s*(?:Data|Technologies|Platforms))",
        r"(?:Computer\s+Vision|Natural\s+Language\s+Processing|NLP)",
        r"(?:Web\s+Development|Frontend|Backend|Full[-\s]?Stack)",
        r"(?:Database|Data\s+Management|Cloud|DevOps)",
        r"(?:Soft\s+Skills?|Professional\s+Skills?|Core\s+Competencies)",
        r"(?:Technical|Programming|Development)",
    ]
    
    for header in subsection_headers:
        skills_text = re.sub(f"{header}\\s*:", ",", skills_text, flags=re.IGNORECASE)
    
    # Split by various delimiters
    raw_skills = re.split(r"[,|•·\n]", skills_text)
    
    seen = set()
    for skill in raw_skills:
        # Clean up skill text
        skill = skill.strip()
        skill = re.sub(r"^[-•·\-\*\+\s\d\.]+", "", skill)  # Remove leading bullets/numbers
        skill = re.sub(r"[-•·\-\*\+\s]+$", "", skill)  # Remove trailing bullets
        skill = re.sub(r"\([^)]*\)", "", skill)  # Remove parenthetical info
        skill = re.sub(r"\.$", "", skill)  # Remove trailing periods
        skill = " ".join(skill.split())  # Clean whitespace
        
        # Validation criteria
        skip_words = {
            'and', 'or', 'the', 'a', 'an', 'in', 'at', 'to', 'for', 'with', 
            'of', 'on', 'as', 'by', 'from', 'into', 'about', 'like', 'through',
            'over', 'before', 'between', 'under', 'during', 'including',
        }
        
        if (skill and 
            2 <= len(skill) <= 80 and
            skill.lower() not in seen and
            skill.lower() not in skip_words and
            not re.match(r'^\d+$', skill) and  # Skip pure numbers
            not re.match(r'^[:\-\.\,\;\(\)]+$', skill) and  # Skip pure punctuation
            not skill.lower().startswith(('http', 'www')) and  # Skip URLs
            len(re.sub(r'[^a-zA-Z]', '', skill)) >= 2):  # At least 2 letters
            seen.add(skill.lower())
            skills.append(skill)
    
    return skills


def extract_section(text: str, section_pattern: str) -> str:
    """Extract content of a named section with improved pattern matching."""
    # Common section names that mark the end of current section
    end_sections = [
        "experience", "education", "technical\\s+skills?", "skills?", 
        "projects?", "certifications?", "summary", "objective", 
        "professional\\s+experience", "work\\s+history", "employment",
        "academic", "background", "awards?", "achievements?", "languages?",
        "publications?", "volunteer", "interests?", "hobbies", "references?"
    ]
    
    end_pattern = "|".join(end_sections)
    
    # Try with markdown headers (###)
    pattern = rf"(?:^|\n)\s*(?:###\s*)?{section_pattern}\s*[:\-]?\s*\n(.*?)(?=\n\s*(?:###\s*)?(?:{end_pattern})\s*[:\-]?\s*\n|\Z)"
    
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL | re.MULTILINE)
    if match:
        return match.group(1).strip()
    
    return ""


def parse_experience_section(text: str) -> List[Experience]:
    """Parse experience section with comprehensive field extraction."""
    experiences = []
    section = extract_section(text, r"(?:work\s+)?(?:experience|employment|work\s+history|professional\s+experience)")
    
    if not section:
        return experiences
    
    # Split by patterns that typically indicate new job entry
    # Look for capitalized titles followed by company indicators
    split_patterns = [
        r"\n(?=[A-Z][^a-z\n]{5,80}(?:\n|$))",  # All caps title
        r"\n(?=[A-Z][^\n]{10,80}(?:\||at|@|·|•|-{2,})[^\n]+)",  # Title with separator and company
        r"\n(?=\d{4}\s*[-–]\s*(?:\d{4}|Present|Current))",  # Starting with date range
    ]
    
    entries = [section]
    for pattern in split_patterns:
        new_entries = []
        for entry in entries:
            new_entries.extend(re.split(pattern, entry))
        entries = new_entries
    
    for entry in entries:
        entry = entry.strip()
        if len(entry) < 20:  # Too short to be a real experience
            continue
        
        exp = Experience()
        lines = [l.strip() for l in entry.split("\n") if l.strip()]
        
        if not lines:
            continue
        
        # Parse first line - usually has title and company
        first_line = lines[0]
        
        # Try various patterns for title | company
        patterns = [
            r"^(.+?)\s*[\|]\s*(.+?)$",  # Title | Company
            r"^(.+?)\s+at\s+(.+?)$",  # Title at Company
            r"^(.+?)\s*[@•·–-]\s*(.+?)$",  # Title @/•/· Company
        ]
        
        title_company_found = False
        for pattern in patterns:
            match = re.match(pattern, first_line, re.IGNORECASE)
            if match:
                exp.title = match.group(1).strip()
                exp.position = exp.title
                exp.company = match.group(2).strip()
                exp.organization = exp.company
                exp.employer = exp.company
                title_company_found = True
                break
        
        if not title_company_found:
            exp.title = first_line.strip()
            exp.position = exp.title
            # Try to find company in second line
            if len(lines) > 1:
                second_line = lines[1].strip()
                # If second line doesn't look like a date, it might be company
                if not re.search(r"\d{4}", second_line):
                    exp.company = second_line
                    exp.organization = exp.company
        
        # Look for duration/dates anywhere in the entry
        duration_patterns = [
            r"(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|present|current)",
            r"(\d{1,2}/\d{4})\s*[-–]\s*(\d{1,2}/\d{4}|present|current)",
            r"(\d{4})\s*[-–]\s*(\d{4}|present|current)",
        ]
        
        for pattern in duration_patterns:
            match = re.search(pattern, entry, re.IGNORECASE)
            if match:
                exp.start_date = match.group(1)
                exp.end_date = match.group(2)
                exp.duration = f"{exp.start_date} - {exp.end_date}"
                exp.period = exp.duration
                exp.dates = exp.duration
                break
        
        # Look for location
        location_match = re.search(r"(?:Location|City)\s*:\s*([^\n]+)", entry, re.IGNORECASE)
        if location_match:
            exp.location = location_match.group(1).strip()
        
        # Extract description and bullet points
        description_lines = []
        bullets = []
        
        for line in lines[1:]:  # Skip first line (title/company)
            line = line.strip()
            
            # Skip if it's just the duration or company line
            if re.search(r"^\d{4}|^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)", line, re.IGNORECASE):
                continue
            if line == exp.company:
                continue
            
            # Check if it's a bullet point
            if re.match(r"^[•\-\*\+]", line) or line.startswith("- "):
                bullet = re.sub(r"^[•\-\*\+]\s*", "", line)
                bullets.append(bullet)
                exp.responsibilities.append(bullet)
            else:
                if len(line) > 10:  # Meaningful content
                    description_lines.append(line)
        
        exp.description = "\n".join(description_lines + bullets)
        
        # Only add if we have at least a title or company
        if exp.title or exp.company:
            experiences.append(exp)
    
    return experiences


def parse_education_section(text: str) -> List[Education]:
    """Parse education section with comprehensive field extraction."""
    education_list = []
    section = extract_section(text, "education")
    
    if not section:
        return education_list
    
    # Split by degree patterns or institution patterns
    entries = re.split(r"\n(?=[A-Z][^\n]{10,}(?:University|College|Institute|School|Academy))", section)
    
    # If that didn't work, try splitting by degree keywords
    if len(entries) <= 1:
        degree_pattern = r"\n(?=(?:Bachelor|Master|PhD|Ph\.D|B\.Tech|M\.Tech|B\.S\.|M\.S\.|B\.A\.|M\.A\.|Associate|Diploma))"
        entries = re.split(degree_pattern, section, flags=re.IGNORECASE)
    
    for entry in entries:
        entry = entry.strip()
        if len(entry) < 10:
            continue
        
        edu = Education()
        lines = [l.strip() for l in entry.split('\n') if l.strip()]
        
        # Extract degree
        degree_patterns = [
            r"(Bachelor.*?(?:of|in|degree)|B\.?(?:Tech|S|A|Sc)\.?.*)",
            r"(Master.*?(?:of|in|degree)|M\.?(?:Tech|S|A|Sc)\.?.*)",
            r"((?:PhD|Ph\.D|Doctorate).*)",
            r"(Associate.*?(?:of|in|degree))",
            r"(Diploma.*)",
        ]
        
        for pattern in degree_patterns:
            match = re.search(pattern, entry, re.IGNORECASE)
            if match:
                edu.degree = match.group(1).strip()
                edu.qualification = edu.degree
                break
        
        # Extract institution
        institution_keywords = ["University", "College", "Institute", "School", "Academy", "Polytechnic"]
        for line in lines:
            if any(keyword in line for keyword in institution_keywords):
                edu.institution = line[:150]
                edu.school = edu.institution
                edu.university = edu.institution
                edu.college = edu.institution
                break
        
        # Extract field of study
        field_patterns = [
            r"(?:in|of)\s+([A-Z][^\n,]{10,60})",
            r"(?:Major|Specialization|Focus|Field|Stream)\s*:\s*([^\n]+)",
        ]
        for pattern in field_patterns:
            match = re.search(pattern, entry, re.IGNORECASE)
            if match:
                field = match.group(1).strip()
                # Clean up common suffixes
                field = re.sub(r"\s*\(.*?\).*$", "", field)
                edu.field = field
                edu.field_of_study = field
                edu.major = field
                edu.specialization = field
                edu.stream = field
                break
        
        # Extract year/date range
        year_patterns = [
            r"(20\d{2})\s*[-–]\s*(20\d{2}|present|current|expected)",
            r"(?:Class\s+of|Graduated)\s*:?\s*(20\d{2})",
            r"\b(20\d{2})\b",
        ]
        for pattern in year_patterns:
            match = re.search(pattern, entry, re.IGNORECASE)
            if match:
                if match.lastindex == 2:
                    edu.start_date = match.group(1)
                    edu.end_date = match.group(2)
                    edu.year = f"{edu.start_date} - {edu.end_date}"
                else:
                    edu.year = match.group(1)
                edu.graduation_year = edu.year
                break
        
        # Extract GPA/CGPA/Percentage
        gpa_patterns = [
            r"(?:GPA|CGPA)\s*:?\s*(\d+\.?\d*)\s*(?:/\s*(\d+\.?\d*))?",
            r"(?:Grade|Score)\s*:?\s*(\d+\.?\d*)%",
            r"(\d+\.?\d*)%",
        ]
        for pattern in gpa_patterns:
            match = re.search(pattern, entry, re.IGNORECASE)
            if match:
                if 'cgpa' in pattern.lower() or 'gpa' in pattern.lower():
                    edu.gpa = match.group(1)
                    edu.cgpa = match.group(1)
                else:
                    edu.percentage = match.group(1)
                break
        
        # Extract location
        location_match = re.search(r",\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*$", entry)
        if location_match:
            edu.location = location_match.group(1)
        
        # Only add if we have degree or institution
        if edu.degree or edu.institution:
            education_list.append(edu)
    
    return education_list


def parse_projects_section(text: str) -> List[Project]:
    """Parse projects section with comprehensive field extraction."""
    projects = []
    section = extract_section(text, "projects?")
    
    if not section:
        return projects
    
    # Split by project headers
    entries = re.split(r"\n(?=[A-Z][^\n]{5,100}(?:\n|$))", section)
    
    for entry in entries:
        entry = entry.strip()
        if len(entry) < 15:
            continue
        
        proj = Project()
        lines = [l.strip() for l in entry.split("\n") if l.strip()]
        
        if not lines:
            continue
        
        # First line is typically project name
        first_line = lines[0]
        
        # Extract URL from name line if present
        url_in_name = re.search(r"https?://[^\s]+", first_line)
        if url_in_name:
            proj.url = url_in_name.group(0)
            proj.link = proj.url
            proj.project_url = proj.url
            first_line = first_line.replace(proj.url, "").strip()
        
        # Clean name
        name = re.sub(r"[•\-–|]", " ", first_line)
        name = re.sub(r"\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\s*[-–]\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})", "", name, flags=re.IGNORECASE)
        proj.name = " ".join(name.split()).strip()
        proj.title = proj.name
        proj.project_name = proj.name
        
        # Extract duration
        duration_match = re.search(r"(\w+\s+\d{4})\s*[-–]\s*(\w+\s+\d{4}|Present|Current)", entry, re.IGNORECASE)
        if duration_match:
            proj.duration = f"{duration_match.group(1)} - {duration_match.group(2)}"
        
        # Extract role
        role_match = re.search(r"(?:Role|Position)\s*:\s*([^\n]+)", entry, re.IGNORECASE)
        if role_match:
            proj.role = role_match.group(1).strip()
        
        # Extract team size
        team_match = re.search(r"(?:Team\s+Size)\s*:\s*(\d+)", entry, re.IGNORECASE)
        if team_match:
            proj.team_size = team_match.group(1)
        
        # Extract URLs
        url_patterns = [
            r"(?:GitHub|Repository|Repo|Source)\s*:\s*(https?://[^\s]+)",
            r"(?:Live|Demo|Link|URL|Website)\s*:\s*(https?://[^\s]+)",
            r"(https?://github\.com/[^\s]+)",
            r"(https?://[^\s]+)",
        ]
        
        for pattern in url_patterns:
            match = re.search(pattern, entry, re.IGNORECASE)
            if match:
                url = match.group(1)
                if 'github' in url.lower():
                    proj.github = url
                    proj.repository = url
                    if not proj.url:
                        proj.url = url
                        proj.link = url
                else:
                    if not proj.url:
                        proj.url = url
                        proj.link = url
                        proj.project_url = url
        
        # Extract bullet points and description
        bullets = []
        description_parts = []
        
        for line in lines[1:]:
            # Skip URL-only lines
            if line.startswith('http'):
                continue
            
            # Check for bullet points
            if re.match(r"^[•\-\*\+]", line):
                bullet = re.sub(r"^[•\-\*\+]\s*", "", line)
                bullets.append(bullet)
                proj.highlights.append(bullet)
            else:
                if len(line) > 15 and not line.lower().startswith(('role:', 'team:', 'duration:')):
                    description_parts.append(line)
        
        # Combine description
        all_text = " ".join(description_parts + bullets)
        proj.description = all_text[:600]
        proj.summary = proj.description
        proj.details = proj.description
        
        # Extract technologies
        # Common tech keywords
        tech_keywords = [
            # Frontend
            "React", "Next.js", "Vue", "Angular", "Svelte", "HTML", "CSS", 
            "JavaScript", "TypeScript", "Tailwind", "Bootstrap", "SASS",
            # Backend
            "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", 
            "Ruby on Rails", ".NET", "PHP", "Laravel",
            # Databases
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle",
            "DynamoDB", "Cassandra", "Prisma", "Supabase",
            # Cloud/DevOps
            "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "CI/CD",
            "Terraform", "Ansible", "Vercel", "Netlify", "Heroku",
            # Languages
            "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
            # ML/AI
            "TensorFlow", "PyTorch", "Keras", "scikit-learn", "OpenCV", 
            "YOLO", "NumPy", "Pandas", "Matplotlib",
            # Mobile
            "React Native", "Flutter", "iOS", "Android", "Kotlin", "Swift",
            # Other
            "GraphQL", "REST", "API", "Git", "GitHub", "GitLab", "Firebase",
            "JWT", "OAuth", "WebSocket", "Microservices",
        ]
        
        entry_lower = entry.lower()
        found_techs = []
        for tech in tech_keywords:
            if tech.lower() in entry_lower:
                found_techs.append(tech)
        
        proj.technologies = list(set(found_techs))
        proj.tech_stack = proj.technologies
        proj.tools = proj.technologies
        
        # Only add if we have a name
        if proj.name:
            projects.append(proj)
    
    return projects


def parse_certifications_section(text: str) -> List[Certification]:
    """Parse certifications section with comprehensive field extraction."""
    certifications = []
    
    section = None
    for pattern in [r"certifications?", r"licenses?", r"credentials?", r"professional\s+development"]:
        section = extract_section(text, pattern)
        if section:
            break
    
    if not section:
        return certifications
    
    # Split by common patterns
    entries = re.split(r"\n(?=[A-Z•\-\*])", section)
    
    for entry in entries:
        entry = entry.strip()
        if len(entry) < 5:
            continue
        
        cert = Certification()
        
        # Clean up bullet points
        entry = re.sub(r"^[•\-\*\+\d\.]\s*", "", entry)
        
        lines = [l.strip() for l in entry.split("\n") if l.strip()]
        if not lines:
            continue
        
        # First line is typically certification name
        first_line = lines[0]
        
        # Try to extract issuer from first line if it's in format "Cert Name - Issuer"
        parts = re.split(r"\s*[-|–]\s*", first_line)
        if len(parts) >= 2:
            cert.name = parts[0].strip()
            cert.title = cert.name
            cert.certification_name = cert.name
            cert.issuer = parts[1].strip()
            cert.organization = cert.issuer
            cert.issued_by = cert.issuer
            cert.provider = cert.issuer
        else:
            cert.name = first_line
            cert.title = cert.name
            cert.certification_name = cert.name
            
            # Look for issuer in next line or in parentheses
            if len(lines) > 1:
                second_line = lines[1]
                if not re.search(r"\d{4}", second_line):  # Not a date
                    cert.issuer = second_line
                    cert.organization = cert.issuer
        
        # Extract dates
        date_patterns = [
            r"(?:Issued|Earned|Obtained|Completed)\s*:?\s*(\w+\s+\d{4})",
            r"(?:Date|Year)\s*:?\s*(\w+\s+\d{4}|\d{4})",
            r"\b(\w+\s+\d{4})\b",
            r"\b(20\d{2})\b",
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, entry, re.IGNORECASE)
            if match:
                cert.date = match.group(1)
                cert.issue_date = cert.date
                cert.issued_date = cert.date
                cert.year = cert.date
                cert.issued = cert.date
                break
        
        # Extract expiry date
        expiry_match = re.search(r"(?:Expires|Valid\s+until)\s*:?\s*(\w+\s+\d{4})", entry, re.IGNORECASE)
        if expiry_match:
            cert.expiry_date = expiry_match.group(1)
        
        # Extract credential ID
        cred_match = re.search(r"(?:Credential|Certificate|License)\s*(?:ID|#|Number)\s*:?\s*([A-Z0-9-]+)", entry, re.IGNORECASE)
        if cred_match:
            cert.credential_id = cred_match.group(1)
        
        # Extract credential URL
        url_match = re.search(r"https?://[^\s]+", entry)
        if url_match:
            cert.credential_url = url_match.group(0)
        
        if cert.name:
            certifications.append(cert)
    
    return certifications


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF using best available library."""
    if pdfplumber is not None:
        try:
            text = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    content = page.extract_text()
                    if content:
                        text.append(content)
            if text:
                return "\n".join(text)
        except Exception as e:
            print(f"pdfplumber extraction failed: {e}")
    
    if PdfReader is not None:
        try:
            text = []
            reader = PdfReader(file_path)
            for page in reader.pages:
                content = page.extract_text()
                if content:
                    text.append(content)
            return "\n".join(text)
        except Exception as e:
            print(f"pypdf extraction failed: {e}")
            return ""
    
    raise ImportError("No PDF library available. Install pdfplumber or pypdf")


def read_resume_file(file_path: str) -> str:
    """Read resume content from file."""
    if str(file_path).lower().endswith('.pdf'):
        return extract_text_from_pdf(file_path)
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def parse_resume(resume_text: str) -> ParsedResume:
    """
    Parse resume text and extract ALL structured information.
    
    Args:
        resume_text: Raw resume text
        
    Returns:
        ParsedResume object with comprehensive extracted information
    """
    parsed = ParsedResume(raw_text=resume_text)
    
    # Extract contact info
    parsed.name = extract_name(resume_text)
    parsed.full_name = parsed.name
    parsed.first_name, parsed.last_name = split_name(parsed.name)
    
    parsed.email = extract_email(resume_text)
    parsed.email_address = parsed.email
    
    parsed.phone = extract_phone(resume_text)
    parsed.phone_number = parsed.phone
    parsed.mobile = parsed.phone
    parsed.contact = parsed.phone
    
    # Extract location
    location_info = extract_location(resume_text)
    parsed.location = location_info["full"]
    parsed.address = location_info["full"]
    parsed.city = location_info.get("city", "")
    parsed.state = location_info.get("state", "")
    parsed.country = location_info.get("country", "")
    
    # Extract social links
    links = extract_links(resume_text)
    parsed.linkedin = links["linkedin"]
    parsed.linkedin_url = links["linkedin_url"]
    parsed.github = links["github"]
    parsed.github_url = links["github_url"]
    parsed.portfolio = links["portfolio"]
    parsed.portfolio_url = links["portfolio_url"]
    parsed.website = links["website"]
    
    # Extract summary/objective
    for section_name in [r"summary", r"objective", r"about", r"profile", r"professional\s+summary"]:
        summary_section = extract_section(resume_text, section_name)
        if summary_section:
            parsed.summary = summary_section[:800]
            parsed.objective = parsed.summary
            parsed.profile = parsed.summary
            parsed.about = parsed.summary
            break
    
    # Extract skills
    parsed.skills = extract_skills_section(resume_text)
    parsed.technical_skills = parsed.skills  # Alias
    
    # Extract experience
    parsed.experience = parse_experience_section(resume_text)
    parsed.work_experience = parsed.experience  # Alias
    
    # Extract education
    parsed.education = parse_education_section(resume_text)
    parsed.academic = parsed.education  # Alias
    
    # Extract projects
    parsed.projects = parse_projects_section(resume_text)
    
    # Extract certifications
    parsed.certifications = parse_certifications_section(resume_text)
    parsed.licenses = parsed.certifications  # Alias
    
    return parsed


def parse(resume_text: str) -> dict:
    """Parse resume and return as comprehensive dictionary."""
    return parse_resume(resume_text).to_dict()


# For testing
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        text = read_resume_file(file_path)
        result = parse(text)
        
        import json
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python resume_parser_improved.py <resume_file.pdf|txt>")