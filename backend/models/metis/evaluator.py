"""
METIS Evaluator

Main orchestrator that combines parsers and analyzers to produce
METIS-CORE evaluation output.
"""

import json
from dataclasses import dataclass, field

from . import jd_parser
from . import resume_parser
from . import github_analyzer
from . import portfolio_analyzer
from . import scoring_engine


@dataclass
class CandidateInput:
    """Input data for candidate evaluation."""
    resume_text: str
    github_url: str | None = None
    linkedin_url: str | None = None
    portfolio_url: str | None = None


@dataclass
class EvaluationContext:
    """Context for evaluation including all parsed data."""
    resume_data: dict = field(default_factory=dict)
    github_data: dict = field(default_factory=dict)
    portfolio_data: dict = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)


class MetisEvaluator:
    """
    METIS-CORE Evaluator
    
    Orchestrates the complete candidate evaluation pipeline.
    Returns strict JSON matching METIS output contract.
    """
    
    def __init__(self):
        self.context = EvaluationContext()
    
    def parse_resume(self, resume_text: str) -> dict:
        """Parse resume text and store in context."""
        try:
            self.context.resume_data = resume_parser.parse(resume_text)
            return self.context.resume_data
        except Exception as e:
            self.context.errors.append(f"Resume parsing error: {str(e)}")
            return {}
    
    def analyze_github(self, github_url: str) -> dict:
        """Analyze GitHub profile and store in context."""
        if not github_url:
            return {}
        
        try:
            self.context.github_data = github_analyzer.analyze(github_url)
            return self.context.github_data
        except ValueError as e:
            self.context.errors.append(f"GitHub error: {str(e)}")
            return {}
        except Exception as e:
            self.context.errors.append(f"GitHub analysis failed: {str(e)}")
            return {}
    
    def analyze_portfolio(self, portfolio_url: str) -> dict:
        """Analyze portfolio website and store in context."""
        if not portfolio_url:
            return {}
        
        try:
            self.context.portfolio_data = portfolio_analyzer.analyze(portfolio_url)
            return self.context.portfolio_data
        except Exception as e:
            self.context.errors.append(f"Portfolio analysis failed: {str(e)}")
            return {}
    
    def evaluate(self, candidate: CandidateInput) -> dict:
        """
        Run METIS-CORE evaluation for a candidate.
        
        Args:
            candidate: CandidateInput with resume and optional URLs
            
        Returns:
            Strict JSON matching METIS output contract
        """
        # Parse resume
        if candidate.resume_text:
            self.parse_resume(candidate.resume_text)
        else:
            self.context.errors.append("Resume text is required")
            return {
                "model": "metis_core_v1",
                "overall_score": 0,
                "section_scores": {},
                "strength_signals": [],
                "risk_signals": ["No resume provided"],
                "ats_flags": [],
                "confidence_level": "low",
                "final_reasoning": "Cannot evaluate without resume."
            }
        
        # Analyze GitHub if provided
        if candidate.github_url:
            self.analyze_github(candidate.github_url)
        
        # Analyze portfolio if provided
        if candidate.portfolio_url:
            self.analyze_portfolio(candidate.portfolio_url)
        
        # Run METIS-CORE scoring engine
        result = scoring_engine.evaluate(
            resume_data=self.context.resume_data,
            github_data=self.context.github_data if self.context.github_data else None,
            portfolio_data=self.context.portfolio_data if self.context.portfolio_data else None,
        )
        
        return result


def evaluate_candidate(
    resume_text: str,
    github_url: str | None = None,
    linkedin_url: str | None = None,
    portfolio_url: str | None = None,
    jd_text: str | None = None,  # Ignored per spec unless explicitly provided
) -> dict:
    """
    Convenience function for single candidate evaluation.
    
    Args:
        resume_text: Resume text (primary source)
        github_url: Optional GitHub profile URL
        linkedin_url: Optional LinkedIn profile URL (not implemented)
        portfolio_url: Optional portfolio website URL
        jd_text: Job description (ignored unless explicitly needed)
        
    Returns:
        Strict METIS JSON output
    """
    evaluator = MetisEvaluator()
    
    candidate = CandidateInput(
        resume_text=resume_text,
        github_url=github_url,
        linkedin_url=linkedin_url,
        portfolio_url=portfolio_url,
    )
    
    return evaluator.evaluate(candidate)


def format_result_json(result: dict, indent: int = 2) -> str:
    """Format evaluation result as pretty JSON."""
    return json.dumps(result, indent=indent, ensure_ascii=False)
