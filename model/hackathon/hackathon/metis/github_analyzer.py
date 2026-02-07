"""
GitHub Profile Analyzer

Fetches and analyzes GitHub profiles via REST API to assess project depth,
commit activity, and contribution patterns.
"""

import re
from dataclasses import dataclass, field
from datetime import datetime

import httpx


@dataclass
class Repository:
    """GitHub repository data."""
    name: str
    description: str
    language: str
    stars: int
    forks: int
    size_kb: int
    is_fork: bool
    has_readme: bool
    created_at: str
    updated_at: str
    topics: list[str] = field(default_factory=list)
    commit_count: int = 0
    
    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "language": self.language,
            "stars": self.stars,
            "forks": self.forks,
            "size_kb": self.size_kb,
            "is_fork": self.is_fork,
            "has_readme": self.has_readme,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "topics": self.topics,
            "commit_count": self.commit_count,
        }


@dataclass
class GitHubProfile:
    """Analyzed GitHub profile data."""
    username: str
    name: str = ""
    bio: str = ""
    followers: int = 0
    following: int = 0
    public_repos: int = 0
    created_at: str = ""
    repositories: list[Repository] = field(default_factory=list)
    
    # Computed metrics
    total_stars: int = 0
    original_repos: int = 0
    forked_repos: int = 0
    languages: dict[str, int] = field(default_factory=dict)  # language -> repo count
    recent_activity_days: int = 0  # Days since last commit
    
    def to_dict(self) -> dict:
        return {
            "username": self.username,
            "name": self.name,
            "bio": self.bio,
            "followers": self.followers,
            "following": self.following,
            "public_repos": self.public_repos,
            "created_at": self.created_at,
            "repositories": [r.to_dict() for r in self.repositories],
            "total_stars": self.total_stars,
            "original_repos": self.original_repos,
            "forked_repos": self.forked_repos,
            "languages": self.languages,
            "recent_activity_days": self.recent_activity_days,
        }


def extract_username(github_url: str) -> str:
    """Extract username from GitHub URL or return as-is if already username."""
    # Handle URLs like https://github.com/username or github.com/username
    match = re.search(r"github\.com/([a-zA-Z0-9_-]+)", github_url)
    if match:
        return match.group(1)
    
    # Assume it's already a username
    return github_url.strip().strip("/")


async def fetch_user_data(client: httpx.AsyncClient, username: str) -> dict:
    """Fetch user profile data from GitHub API."""
    url = f"https://api.github.com/users/{username}"
    response = await client.get(url)
    
    if response.status_code == 404:
        raise ValueError(f"GitHub user '{username}' not found")
    
    response.raise_for_status()
    return response.json()


async def fetch_repos(client: httpx.AsyncClient, username: str, limit: int = 30) -> list[dict]:
    """Fetch user repositories from GitHub API."""
    url = f"https://api.github.com/users/{username}/repos"
    params = {"sort": "updated", "per_page": limit}
    
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


async def fetch_recent_commits(client: httpx.AsyncClient, username: str, repo_name: str, limit: int = 5) -> list[dict]:
    """Fetch recent commits for a repository."""
    url = f"https://api.github.com/repos/{username}/{repo_name}/commits"
    params = {"per_page": limit}
    
    try:
        response = await client.get(url, params=params)
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    
    return []


def parse_repository(repo_data: dict) -> Repository:
    """Parse API response into Repository object."""
    return Repository(
        name=repo_data.get("name", ""),
        description=repo_data.get("description") or "",
        language=repo_data.get("language") or "Unknown",
        stars=repo_data.get("stargazers_count", 0),
        forks=repo_data.get("forks_count", 0),
        size_kb=repo_data.get("size", 0),
        is_fork=repo_data.get("fork", False),
        has_readme=True,  # Assume true, would need separate API call to verify
        created_at=repo_data.get("created_at", ""),
        updated_at=repo_data.get("updated_at", ""),
        topics=repo_data.get("topics", []),
    )


def calculate_days_since(date_string: str) -> int:
    """Calculate days since a given ISO date string."""
    if not date_string:
        return 999
    
    try:
        date = datetime.fromisoformat(date_string.replace("Z", "+00:00"))
        now = datetime.now(date.tzinfo)
        return (now - date).days
    except Exception:
        return 999


async def analyze_github_profile(github_url: str, fetch_commits: bool = True) -> GitHubProfile:
    """
    Analyze a GitHub profile and return structured data.
    
    Args:
        github_url: GitHub profile URL or username
        fetch_commits: Whether to fetch commit data (slower but more accurate)
        
    Returns:
        GitHubProfile object with analysis results
    """
    username = extract_username(github_url)
    
    async with httpx.AsyncClient(
        headers={"Accept": "application/vnd.github.v3+json"},
        timeout=30.0
    ) as client:
        # Fetch user data
        user_data = await fetch_user_data(client, username)
        
        profile = GitHubProfile(
            username=username,
            name=user_data.get("name") or username,
            bio=user_data.get("bio") or "",
            followers=user_data.get("followers", 0),
            following=user_data.get("following", 0),
            public_repos=user_data.get("public_repos", 0),
            created_at=user_data.get("created_at", ""),
        )
        
        # Fetch repositories
        repos_data = await fetch_repos(client, username)
        
        languages: dict[str, int] = {}
        most_recent_update = ""
        
        for repo_data in repos_data:
            repo = parse_repository(repo_data)
            
            # Fetch commit count for top repos (if enabled)
            if fetch_commits and not repo.is_fork and len(profile.repositories) < 5:
                commits = await fetch_recent_commits(client, username, repo.name)
                repo.commit_count = len(commits)
            
            profile.repositories.append(repo)
            
            # Aggregate metrics
            profile.total_stars += repo.stars
            
            if repo.is_fork:
                profile.forked_repos += 1
            else:
                profile.original_repos += 1
            
            if repo.language and repo.language != "Unknown":
                languages[repo.language] = languages.get(repo.language, 0) + 1
            
            # Track most recent activity
            if repo.updated_at > most_recent_update:
                most_recent_update = repo.updated_at
        
        profile.languages = languages
        profile.recent_activity_days = calculate_days_since(most_recent_update)
        
        return profile


def analyze_sync(github_url: str, fetch_commits: bool = True) -> GitHubProfile:
    """Synchronous wrapper for analyze_github_profile."""
    import asyncio
    return asyncio.run(analyze_github_profile(github_url, fetch_commits))


def analyze(github_url: str) -> dict:
    """Analyze GitHub profile and return as dictionary."""
    return analyze_sync(github_url).to_dict()
