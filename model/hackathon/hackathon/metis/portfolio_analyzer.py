"""
Portfolio Website Analyzer

Scrapes candidate portfolio websites to extract project information,
technologies used, and work evidence for METIS scoring.

Uses httpx for simple HTML sites. For JavaScript-rendered sites,
will return limited data.
"""

import re
from dataclasses import dataclass, field
from urllib.parse import urlparse

import httpx


@dataclass
class Project:
    """Project extracted from portfolio."""
    name: str
    description: str = ""
    technologies: list[str] = field(default_factory=list)
    links: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "technologies": self.technologies,
            "links": self.links,
        }


@dataclass
class PortfolioData:
    """Analyzed portfolio website data."""
    url: str
    name: str = ""
    headline: str = ""
    about: str = ""
    skills: list[str] = field(default_factory=list)
    projects: list[Project] = field(default_factory=list)
    social_links: dict[str, str] = field(default_factory=dict)
    has_contact: bool = False
    page_text: str = ""
    error: str = ""
    
    def to_dict(self) -> dict:
        return {
            "url": self.url,
            "name": self.name,
            "headline": self.headline,
            "about": self.about,
            "skills": self.skills,
            "projects": [p.to_dict() for p in self.projects],
            "social_links": self.social_links,
            "has_contact": self.has_contact,
            "project_count": len(self.projects),
            "error": self.error if self.error else None,
        }


# Tech keywords to look for
TECH_KEYWORDS = [
    "react", "vue", "angular", "next.js", "nextjs", "nuxt", "svelte",
    "node", "nodejs", "express", "django", "flask", "fastapi", "spring",
    "python", "javascript", "typescript", "java", "golang", "go", "rust",
    "mongodb", "postgresql", "mysql", "redis", "firebase", "supabase",
    "aws", "gcp", "azure", "docker", "kubernetes", "vercel", "netlify",
    "flutter", "react native", "swift", "kotlin", "android", "ios",
    "tensorflow", "pytorch", "machine learning", "ml", "ai", "llm",
    "tailwind", "tailwindcss", "bootstrap", "css", "html", "sass",
    "git", "github", "graphql", "rest", "api",
]


def extract_technologies(text: str) -> list[str]:
    """Extract technology mentions from text."""
    text_lower = text.lower()
    found = []
    
    for tech in TECH_KEYWORDS:
        pattern = rf"\b{re.escape(tech)}\b"
        if re.search(pattern, text_lower):
            # Normalize tech names
            normalized = tech.replace("nodejs", "node.js").replace("nextjs", "next.js")
            if normalized not in found:
                found.append(normalized)
    
    return found


def extract_social_links(text: str, html: str = "") -> dict[str, str]:
    """Extract social media links."""
    social = {}
    combined = text + " " + html
    
    patterns = {
        "github": r"github\.com/([a-zA-Z0-9_-]+)",
        "linkedin": r"linkedin\.com/in/([a-zA-Z0-9_-]+)",
        "twitter": r"(?:twitter|x)\.com/([a-zA-Z0-9_]+)",
        "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
    }
    
    for platform, pattern in patterns.items():
        match = re.search(pattern, combined, re.IGNORECASE)
        if match:
            social[platform] = match.group(0) if platform == "email" else match.group(1)
    
    return social


def parse_projects_from_html(html: str, text: str) -> list[Project]:
    """Extract projects from HTML content."""
    projects = []
    
    # Look for common project card patterns in HTML
    # Pattern 1: divs/sections with project-related classes
    project_patterns = [
        r'class="[^"]*project[^"]*"[^>]*>([^<]{10,500})',
        r'<article[^>]*>([^<]{20,500})',
        r'id="[^"]*project[^"]*"[^>]*>([^<]{10,500})',
    ]
    
    for pattern in project_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE | re.DOTALL)
        for match in matches[:5]:
            clean_text = re.sub(r'<[^>]+>', ' ', match).strip()
            if len(clean_text) > 20:
                # Extract title (first line or first sentence)
                lines = clean_text.split('\n')
                title = lines[0].strip()[:80]
                desc = ' '.join(lines[1:3]).strip()[:200] if len(lines) > 1 else ""
                
                if title and len(title) > 3:
                    projects.append(Project(
                        name=title,
                        description=desc,
                        technologies=extract_technologies(clean_text),
                    ))
    
    # Pattern 2: Look for "Projects" section in text
    projects_section = re.search(
        r'(?:projects?|work|portfolio)\s*[:\s]*(.*?)(?:contact|about|skills|experience|$)',
        text,
        re.IGNORECASE | re.DOTALL
    )
    
    if projects_section and len(projects) < 3:
        section_text = projects_section.group(1)
        # Split by common delimiters
        parts = re.split(r'\n{2,}|(?=\d+\.)|(?=[A-Z][a-z]+\s+[-–])', section_text)
        
        for part in parts[:5]:
            part = part.strip()
            if len(part) > 30:
                lines = part.split('\n')
                title = lines[0].strip()[:80]
                if title and not any(skip in title.lower() for skip in ['home', 'about', 'contact']):
                    projects.append(Project(
                        name=title,
                        description=' '.join(lines[1:2]).strip()[:200],
                        technologies=extract_technologies(part),
                    ))
    
    # Deduplicate
    seen = set()
    unique = []
    for p in projects:
        if p.name.lower() not in seen:
            seen.add(p.name.lower())
            unique.append(p)
    
    return unique[:10]


async def fetch_portfolio(url: str) -> tuple[str, str]:
    """Fetch portfolio page content."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    
    async with httpx.AsyncClient(
        timeout=30.0,
        follow_redirects=True,
        headers=headers
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        html = response.text
        
        # Convert HTML to text
        text = html
        text = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text)
        text = text.replace("&nbsp;", " ").replace("&amp;", "&")
        
        return text.strip(), html


async def analyze_portfolio(portfolio_url: str) -> PortfolioData:
    """Analyze a portfolio website."""
    data = PortfolioData(url=portfolio_url)
    
    try:
        text, html = await fetch_portfolio(portfolio_url)
        data.page_text = text[:5000]
        
        # Extract title/name
        title_match = re.search(r"<title>([^<]+)</title>", html, re.IGNORECASE)
        if title_match:
            data.name = title_match.group(1).strip()[:100]
        
        # Extract skills
        data.skills = extract_technologies(text)
        
        # Extract social links
        data.social_links = extract_social_links(text, html)
        
        # Check for contact
        data.has_contact = bool(re.search(
            r"contact|email|get in touch|reach out|hire me",
            text,
            re.IGNORECASE
        ))
        
        # Extract about section
        about_match = re.search(
            r"(?:about\s*(?:me)?|i am|i'm|hello|hi)[,:\s]*(.{30,400}?)(?=\.|projects?|skills?|experience|$)",
            text,
            re.IGNORECASE | re.DOTALL
        )
        if about_match:
            data.about = about_match.group(1).strip()[:300]
        
        # Extract projects
        data.projects = parse_projects_from_html(html, text)
        
        # Extract links from HTML
        links = re.findall(r'href="(https?://[^"]+)"', html)
        for proj in data.projects:
            for link in links:
                if any(kw in link.lower() for kw in ['github.com', 'demo', 'live', 'deploy']):
                    if link not in proj.links:
                        proj.links.append(link)
                        if len(proj.links) >= 2:
                            break
        
    except httpx.HTTPStatusError as e:
        data.error = f"HTTP {e.response.status_code}"
    except httpx.ConnectError:
        data.error = "Connection failed"
    except Exception as e:
        data.error = str(e)[:100]
    
    return data


def analyze_sync(portfolio_url: str) -> PortfolioData:
    """Synchronous wrapper."""
    import asyncio
    return asyncio.run(analyze_portfolio(portfolio_url))


def analyze(portfolio_url: str) -> dict:
    """Analyze portfolio and return as dictionary."""
    result = analyze_sync(portfolio_url).to_dict()
    # Remove None values
    return {k: v for k, v in result.items() if v is not None}
