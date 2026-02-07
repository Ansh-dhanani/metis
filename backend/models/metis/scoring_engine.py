"""
METIS-CORE Scoring Engine v1

Signal-extraction and scoring model for resume evaluation.
Evaluates based on evidence, not claims. Skeptical by default.

Output consumed by:
- AI Interviewer Model
- LangGraph Meta-Evaluator
- Human HR reviewers

Categories (100 points total):
- Skill Evidence Quality: 0-30
- Project & Work Authenticity: 0-25
- Professional Signal Strength: 0-15
- Impact & Outcomes: 0-15
- Resume Integrity & ATS Risk: 0-15
"""

import re
from dataclasses import dataclass, field


@dataclass
class SectionScores:
    """Section scores matching METIS output contract."""
    skill_evidence: int = 0           # max 30
    project_authenticity: int = 0     # max 25
    professional_signals: int = 0     # max 15
    impact_outcomes: int = 0          # max 15
    resume_integrity: int = 15        # max 15 (starts at max, penalized)
    
    @property
    def total(self) -> int:
        return (
            self.skill_evidence +
            self.project_authenticity +
            self.professional_signals +
            self.impact_outcomes +
            self.resume_integrity
        )
    
    def to_dict(self) -> dict:
        return {
            "skill_evidence": self.skill_evidence,
            "project_authenticity": self.project_authenticity,
            "professional_signals": self.professional_signals,
            "impact_outcomes": self.impact_outcomes,
            "resume_integrity": self.resume_integrity,
        }


@dataclass 
class MetisEvaluation:
    """METIS-CORE evaluation result matching strict output contract."""
    model: str = "metis_core_v1"
    overall_score: int = 0
    section_scores: SectionScores = field(default_factory=SectionScores)
    strength_signals: list[str] = field(default_factory=list)
    risk_signals: list[str] = field(default_factory=list)
    ats_flags: list[str] = field(default_factory=list)
    confidence_level: str = "medium"
    final_reasoning: str = ""
    
    def to_dict(self) -> dict:
        """Return strict JSON output - no extra keys."""
        return {
            "model": self.model,
            "overall_score": self.overall_score,
            "section_scores": self.section_scores.to_dict(),
            "strength_signals": self.strength_signals,
            "risk_signals": self.risk_signals,
            "ats_flags": self.ats_flags,
            "confidence_level": self.confidence_level,
            "final_reasoning": self.final_reasoning,
        }


class MetisCoreEngine:
    """
    METIS-CORE Evaluation Engine
    
    Philosophy:
    - Demonstrated skills, not claimed skills
    - Evidence of execution, not buzzwords
    - Clarity of impact, not verbosity
    - Conservative scoring, skeptical by default
    """
    
    def __init__(self):
        self.result = MetisEvaluation()
        self.result.section_scores = SectionScores()
        self._evidence_count = 0
    
    def _has_quantified_evidence(self, text: str) -> list[str]:
        """Find quantified achievements in text."""
        patterns = [
            (r"\d+%", "percentage metric"),
            (r"\$[\d,]+[KMB]?", "revenue/cost metric"),
            (r"\d+\+?\s*users?", "user count"),
            (r"\d+x\s+\w+", "multiplier claim"),
            (r"reduced\s+\w+\s+by\s+\d+", "reduction metric"),
            (r"increased\s+\w+\s+by\s+\d+", "increase metric"),
            (r"saved\s+\$?\d+", "savings metric"),
        ]
        
        found = []
        for pattern, label in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                found.append(label)
        return found
    
    def _count_skill_evidence(
        self,
        resume_data: dict,
        github_data: dict | None,
        portfolio_data: dict | None = None
    ) -> tuple[int, list[str]]:
        """Count skills with actual evidence (projects, roles, GitHub, portfolio)."""
        skills = resume_data.get("skills", [])
        projects = resume_data.get("projects", [])
        experience = resume_data.get("experience", [])
        
        evidenced_skills = set()
        evidence_details = []
        
        # Skills mentioned in project descriptions
        project_text = " ".join(p.get("description", "") + p.get("name", "") for p in projects)
        for skill in skills:
            if skill.lower() in project_text.lower():
                evidenced_skills.add(skill.lower())
        
        # Skills used in work experience
        exp_text = " ".join(e.get("description", "") for e in experience)
        for skill in skills:
            if skill.lower() in exp_text.lower():
                evidenced_skills.add(skill.lower())
        
        # GitHub language verification
        if github_data:
            github_langs = {l.lower() for l in github_data.get("languages", {}).keys()}
            for skill in skills:
                if skill.lower() in github_langs:
                    evidenced_skills.add(skill.lower())
                    evidence_details.append(f"{skill} verified via GitHub")
        
        # Portfolio verification
        if portfolio_data:
            portfolio_skills = {s.lower() for s in portfolio_data.get("skills", [])}
            portfolio_projects = portfolio_data.get("projects", [])
            
            for skill in skills:
                if skill.lower() in portfolio_skills:
                    evidenced_skills.add(skill.lower())
                    evidence_details.append(f"{skill} shown on portfolio")
            
            # Check skills in portfolio project descriptions
            for proj in portfolio_projects:
                for tech in proj.get("technologies", []):
                    if tech.lower() in {s.lower() for s in skills}:
                        evidenced_skills.add(tech.lower())
        
        return len(evidenced_skills), evidence_details
    
    def score_skill_evidence(
        self,
        resume_data: dict,
        github_data: dict | None = None,
        portfolio_data: dict | None = None
    ) -> int:
        """
        A. Skill Evidence Quality (0-30)
        
        Evaluates:
        - Are skills backed by projects, roles, or outcomes?
        - Is there depth, not just mentions?
        - Portfolio and GitHub verification
        """
        score = 0
        skills = resume_data.get("skills", [])
        
        if not skills:
            self.result.risk_signals.append("No skills listed in resume")
            self.result.section_scores.skill_evidence = 0
            return 0
        
        # Count evidenced skills (now includes portfolio)
        evidenced_count, evidence_details = self._count_skill_evidence(
            resume_data, github_data, portfolio_data
        )
        total_skills = len(skills)
        evidence_ratio = evidenced_count / total_skills if total_skills > 0 else 0
        
        # Score based on evidence ratio (max 20)
        if evidence_ratio >= 0.7:
            score += 20
            self.result.strength_signals.append(
                f"{evidenced_count}/{total_skills} skills backed by project/work evidence"
            )
        elif evidence_ratio >= 0.5:
            score += 15
        elif evidence_ratio >= 0.3:
            score += 10
        elif evidence_ratio > 0:
            score += 5
        else:
            self.result.risk_signals.append("Skills listed without supporting evidence")
        
        # GitHub verification bonus (max 5)
        if github_data:
            github_langs = github_data.get("languages", {})
            if len(github_langs) >= 3:
                score += 5
                self.result.strength_signals.append(
                    f"GitHub shows {len(github_langs)} languages with real code"
                )
            elif len(github_langs) >= 1:
                score += 3
        
        # Depth check - detailed project descriptions (max 5)
        projects = resume_data.get("projects", [])
        detailed_projects = sum(1 for p in projects if len(p.get("description", "")) > 50)
        if detailed_projects >= 2:
            score += 5
        elif detailed_projects >= 1:
            score += 3
        
        self._evidence_count = evidenced_count
        score = min(30, score)
        self.result.section_scores.skill_evidence = score
        return score
    
    def score_project_authenticity(
        self,
        resume_data: dict,
        github_data: dict | None = None,
        portfolio_data: dict | None = None
    ) -> int:
        """
        B. Project & Work Authenticity (0-25)
        
        Evaluates:
        - Real-world problems solved
        - Ownership and responsibility
        - Portfolio project evidence
        - Clear scope of work
        """
        score = 0
        projects = resume_data.get("projects", [])
        experience = resume_data.get("experience", [])
        
        # Work experience authenticity (max 12)
        if experience:
            has_clear_roles = sum(1 for e in experience if e.get("title") and e.get("company"))
            has_descriptions = sum(1 for e in experience if len(e.get("description", "")) > 30)
            
            if has_clear_roles >= 2 and has_descriptions >= 2:
                score += 12
                self.result.strength_signals.append(
                    f"{len(experience)} work experiences with clear role definitions"
                )
            elif has_clear_roles >= 1:
                score += 8
            else:
                score += 4
        
        # GitHub authenticity (max 8)
        if github_data:
            original_repos = github_data.get("original_repos", 0)
            forked_repos = github_data.get("forked_repos", 0)
            repos = github_data.get("repositories", [])
            
            # Original work is valued
            if original_repos >= 5:
                score += 8
                self.result.strength_signals.append(
                    f"{original_repos} original repositories showing ownership"
                )
            elif original_repos >= 3:
                score += 6
            elif original_repos >= 1:
                score += 4
            
            # Flag fork-heavy profiles
            if forked_repos > original_repos * 2 and forked_repos > 5:
                self.result.risk_signals.append(
                    f"Fork-heavy GitHub: {forked_repos} forks vs {original_repos} original"
                )
            
            # Check for substantial repos
            substantial = sum(1 for r in repos if r.get("size_kb", 0) > 100 and not r.get("is_fork"))
            if substantial >= 2:
                self.result.strength_signals.append(f"{substantial} substantial codebases")
        else:
            # No GitHub - can't fully verify
            self.result.risk_signals.append("No GitHub profile to verify project claims")
        
        # Resume projects (max 5)
        if projects:
            with_tech = sum(1 for p in projects if p.get("technologies"))
            if with_tech >= 2:
                score += 5
            elif with_tech >= 1:
                score += 3
        
        # Portfolio projects bonus (max 5 additional)
        if portfolio_data:
            portfolio_projects = portfolio_data.get("projects", [])
            portfolio_count = len(portfolio_projects)
            
            if portfolio_count >= 5:
                score += 5
                self.result.strength_signals.append(
                    f"Portfolio shows {portfolio_count} projects with details"
                )
            elif portfolio_count >= 3:
                score += 4
                self.result.strength_signals.append(
                    f"{portfolio_count} projects documented on portfolio"
                )
            elif portfolio_count >= 1:
                score += 2
            
            # Check for demo links in portfolio
            has_demos = sum(1 for p in portfolio_projects if p.get("links"))
            if has_demos >= 2:
                self.result.strength_signals.append(
                    f"{has_demos} portfolio projects with live demos/links"
                )
        
        score = min(25, score)
        self.result.section_scores.project_authenticity = score
        return score
    
    def score_professional_signals(
        self,
        resume_data: dict,
        github_data: dict | None = None
    ) -> int:
        """
        C. Professional Signal Strength (0-15)
        
        Evaluates:
        - Career progression logic
        - Role-to-role consistency
        - Responsibility growth
        """
        score = 0
        experience = resume_data.get("experience", [])
        education = resume_data.get("education", [])
        
        # Career progression (max 8)
        if len(experience) >= 3:
            score += 8
            self.result.strength_signals.append("Clear career progression with multiple roles")
        elif len(experience) >= 2:
            score += 6
        elif len(experience) >= 1:
            score += 4
        else:
            self.result.risk_signals.append("No work experience documented")
        
        # Education (max 4)
        if education:
            has_degree = any(
                any(deg in e.get("degree", "").lower() 
                    for deg in ["bachelor", "master", "b.tech", "m.tech", "phd", "diploma"])
                for e in education
            )
            if has_degree:
                score += 4
            else:
                score += 2
        
        # GitHub community signals (max 3)
        if github_data:
            followers = github_data.get("followers", 0)
            if followers >= 50:
                score += 3
                self.result.strength_signals.append(f"{followers} GitHub followers")
            elif followers >= 10:
                score += 2
            elif followers >= 1:
                score += 1
        
        score = min(15, score)
        self.result.section_scores.professional_signals = score
        return score
    
    def score_impact_outcomes(
        self,
        resume_data: dict
    ) -> int:
        """
        D. Impact & Outcomes (0-15)
        
        Evaluates:
        - Quantified results
        - Business / technical impact
        - Problem → Action → Result clarity
        """
        score = 0
        experience = resume_data.get("experience", [])
        summary = resume_data.get("summary", "")
        projects = resume_data.get("projects", [])
        
        # Combine all text for analysis
        all_text = summary
        all_text += " ".join(e.get("description", "") for e in experience)
        all_text += " ".join(p.get("description", "") for p in projects)
        
        # Check for quantified achievements (max 10)
        evidence = self._has_quantified_evidence(all_text)
        
        if len(evidence) >= 4:
            score += 10
            self.result.strength_signals.append(
                f"Quantified impact: {', '.join(evidence[:3])}"
            )
        elif len(evidence) >= 2:
            score += 6
        elif len(evidence) >= 1:
            score += 3
        else:
            self.result.risk_signals.append("No quantified achievements or metrics")
        
        # Action verbs and clear impact language (max 5)
        impact_patterns = [
            r"\b(built|developed|designed|implemented|created|launched)\b",
            r"\b(led|managed|coordinated|mentored)\b",
            r"\b(improved|optimized|reduced|increased|scaled)\b",
        ]
        
        impact_score = 0
        for pattern in impact_patterns:
            if re.search(pattern, all_text, re.IGNORECASE):
                impact_score += 1
        
        if impact_score >= 3:
            score += 5
        elif impact_score >= 2:
            score += 3
        elif impact_score >= 1:
            score += 1
        
        score = min(15, score)
        self.result.section_scores.impact_outcomes = score
        return score
    
    def score_resume_integrity(
        self,
        resume_data: dict,
        github_data: dict | None = None
    ) -> int:
        """
        E. Resume Integrity & ATS Risk (0-15)
        
        Starts at 15, penalized for:
        - Keyword stuffing
        - Vague claims
        - Inflated titles
        - Irrelevant skill noise
        """
        score = 15
        skills = resume_data.get("skills", [])
        experience = resume_data.get("experience", [])
        
        # Keyword stuffing check (penalty: -3 to -5)
        if len(skills) > 35:
            score -= 5
            self.result.ats_flags.append(f"keyword stuffing ({len(skills)} skills listed)")
        elif len(skills) > 25:
            score -= 3
            self.result.ats_flags.append(f"excessive skills ({len(skills)} listed)")
        
        # Vague claims check
        vague_patterns = [
            r"\bvarious\s+\w+\b",
            r"\bmultiple\s+projects?\b",
            r"\bseveral\s+\w+\b",
            r"\betc\.?\b",
        ]
        
        all_text = " ".join(e.get("description", "") for e in experience)
        vague_count = sum(1 for p in vague_patterns if re.search(p, all_text, re.IGNORECASE))
        
        if vague_count >= 3:
            score -= 3
            self.result.ats_flags.append("vague achievements")
        elif vague_count >= 1:
            score -= 1
        
        # Skills without GitHub evidence (penalty: -2 to -4)
        if github_data:
            github_langs = {l.lower() for l in github_data.get("languages", {}).keys()}
            programming_skills = {"python", "java", "javascript", "typescript", "go", "rust", "c++", "ruby", "php", "c#"}
            
            unverified = []
            for skill in skills[:15]:
                skill_lower = skill.lower()
                if skill_lower in programming_skills:
                    if not any(skill_lower in lang.lower() for lang in github_langs):
                        unverified.append(skill)
            
            if len(unverified) >= 3:
                score -= 4
                self.result.ats_flags.append(f"unverified skills: {', '.join(unverified[:3])}")
            elif len(unverified) >= 1:
                score -= 2
        
        # Inflated title check
        senior_titles = ["senior", "lead", "principal", "architect", "staff", "director", "head"]
        has_senior = any(
            any(t in e.get("title", "").lower() for t in senior_titles)
            for e in experience
        )
        
        if has_senior and len(experience) <= 1:
            score -= 3
            self.result.ats_flags.append("inflated titles (senior role with minimal experience)")
        
        score = max(0, score)
        self.result.section_scores.resume_integrity = score
        return score
    
    def _determine_confidence(self) -> str:
        """Determine confidence level based on data availability."""
        confidence_score = 0
        
        if self._evidence_count >= 5:
            confidence_score += 2
        elif self._evidence_count >= 2:
            confidence_score += 1
        
        if len(self.result.ats_flags) <= 1:
            confidence_score += 1
        
        if len(self.result.strength_signals) >= 3:
            confidence_score += 1
        
        if confidence_score >= 3:
            return "high"
        elif confidence_score >= 1:
            return "medium"
        return "low"
    
    def _generate_reasoning(self) -> str:
        """Generate concise HR-readable reasoning."""
        score = self.result.overall_score
        
        if score >= 75:
            assessment = "Strong candidate"
        elif score >= 55:
            assessment = "Qualified candidate"
        elif score >= 40:
            assessment = "Below average"
        else:
            assessment = "Weak candidate"
        
        parts = [f"{assessment} ({score}/100)."]
        
        # Top strength
        if self.result.strength_signals:
            parts.append(f"Strengths: {self.result.strength_signals[0]}.")
        
        # Key risk
        if self.result.risk_signals:
            parts.append(f"Concerns: {self.result.risk_signals[0]}.")
        
        # ATS issues
        if self.result.ats_flags:
            parts.append(f"ATS flags: {', '.join(self.result.ats_flags[:2])}.")
        
        return " ".join(parts)
    
    def evaluate(
        self,
        resume_data: dict,
        github_data: dict | None = None,
        portfolio_data: dict | None = None
    ) -> dict:
        """
        Run full METIS-CORE evaluation.
        
        Args:
            resume_data: Parsed resume data
            github_data: Analyzed GitHub profile (optional)
            portfolio_data: Analyzed portfolio website (optional)
            
        Returns:
            Strict JSON output matching METIS contract
        """
        # Score each category
        self.score_skill_evidence(resume_data, github_data, portfolio_data)
        self.score_project_authenticity(resume_data, github_data, portfolio_data)
        self.score_professional_signals(resume_data, github_data)
        self.score_impact_outcomes(resume_data)
        self.score_resume_integrity(resume_data, github_data)
        
        # Calculate total
        self.result.overall_score = self.result.section_scores.total
        
        # Determine confidence and generate reasoning
        self.result.confidence_level = self._determine_confidence()
        self.result.final_reasoning = self._generate_reasoning()
        
        return self.result.to_dict()


def evaluate(
    resume_data: dict,
    github_data: dict | None = None,
    portfolio_data: dict | None = None,
    **kwargs  # Ignore extra args for compatibility
) -> dict:
    """Run METIS-CORE evaluation and return strict JSON."""
    engine = MetisCoreEngine()
    return engine.evaluate(resume_data, github_data, portfolio_data)

