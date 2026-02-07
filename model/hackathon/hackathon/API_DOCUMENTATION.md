# METIS-CORE API Documentation

> **Version:** 1.0  
> **Purpose:** Resume signal extraction and scoring for AI hiring pipeline  
> **Consumers:** AI Interviewer Model, LangGraph Meta-Evaluator, HR Systems

---

## Quick Start

```python
from metis.evaluator import evaluate_candidate

result = evaluate_candidate(
    resume_text="Full resume text here...",
    github_url="https://github.com/username",        # optional
    portfolio_url="https://portfolio.example.com",   # optional
)

# result is a strict JSON dictionary
print(result["overall_score"])  # 0-100
print(result["confidence_level"])  # "low" | "medium" | "high"
```

---

## Output Contract (Strict JSON)

Every evaluation returns this exact structure:

```json
{
  "model": "metis_core_v1",
  "overall_score": 54,
  "section_scores": {
    "skill_evidence": 10,
    "project_authenticity": 19,
    "professional_signals": 9,
    "impact_outcomes": 1,
    "resume_integrity": 15
  },
  "strength_signals": [
    "GitHub shows 5 languages with real code",
    "7 original repositories showing ownership"
  ],
  "risk_signals": [
    "No quantified achievements or metrics"
  ],
  "ats_flags": [],
  "confidence_level": "high",
  "final_reasoning": "Below average (54/100). Strengths: GitHub shows 5 languages..."
}
```

---

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `model` | string | Always `"metis_core_v1"` |
| `overall_score` | int | 0-100 total score |
| `section_scores` | object | Breakdown by category (see below) |
| `strength_signals` | string[] | Positive evidence found |
| `risk_signals` | string[] | Concerns or gaps identified |
| `ats_flags` | string[] | Resume quality issues |
| `confidence_level` | enum | `"low"` \| `"medium"` \| `"high"` |
| `final_reasoning` | string | HR-readable summary |

### Section Scores

| Key | Max | Evaluates |
|-----|-----|-----------|
| `skill_evidence` | 30 | Skills backed by projects/GitHub/portfolio |
| `project_authenticity` | 25 | Real work, ownership, portfolio projects |
| `professional_signals` | 15 | Career progression, education |
| `impact_outcomes` | 15 | Quantified results, metrics |
| `resume_integrity` | 15 | Penalizes keyword stuffing |

---

## Input Specification

### Python API

```python
def evaluate_candidate(
    resume_text: str,           # REQUIRED - Full resume text
    github_url: str | None,     # Optional - GitHub profile URL
    portfolio_url: str | None,  # Optional - Portfolio website URL
    linkedin_url: str | None,   # Optional - Not implemented
    jd_text: str | None,        # Optional - Ignored in v1
) -> dict:
    """Returns strict JSON matching output contract."""
```

### CLI

```bash
python main.py --resume <path> [options]

Options:
  --resume PATH       Required. Path to resume text file
  --github URL        Optional. GitHub profile URL
  --portfolio URL     Optional. Portfolio website URL
  --name NAME         Candidate name for reports
  --save              Auto-save with timestamps
  --output-json PATH  Custom JSON output path
  --output-md PATH    Custom Markdown report path
  --format {rich,json} Console output format
  -q, --quiet         Suppress console output
```

---

## Scoring Philosophy

1. **Evidence over claims** - Skills need project/GitHub backing
2. **Conservative scoring** - Skeptical by default, earn points
3. **Quantified impact** - Numbers and metrics valued
4. **Penalty for noise** - Keyword stuffing reduces score

### Score Interpretation

| Score | Assessment | Recommendation |
|-------|------------|----------------|
| 75+ | Strong | Proceed to interview |
| 55-74 | Qualified | Review strengths/risks |
| 40-54 | Below Average | Additional screening |
| <40 | Weak | Consider rejection |

---

## Integration Examples

### Direct Python Import

```python
from metis.evaluator import evaluate_candidate

def process_candidate(resume_text, github_url=None, portfolio_url=None):
    result = evaluate_candidate(
        resume_text=resume_text,
        github_url=github_url,
        portfolio_url=portfolio_url
    )
    
    # Decision logic
    if result["overall_score"] >= 55:
        return {"status": "proceed", "evaluation": result}
    else:
        return {"status": "review", "evaluation": result}
```

### LangGraph Integration

```python
from metis.evaluator import evaluate_candidate

def metis_node(state):
    """METIS evaluation node for LangGraph pipeline."""
    result = evaluate_candidate(
        resume_text=state["resume_text"],
        github_url=state.get("github_url"),
        portfolio_url=state.get("portfolio_url")
    )
    
    return {
        **state,
        "metis_score": result["overall_score"],
        "metis_evaluation": result,
        "proceed_to_interview": result["overall_score"] >= 55
    }
```

### Subprocess/CLI

```bash
# JSON output to stdout
python main.py --resume resume.txt --github https://github.com/user --format json -q

# Save to files
python main.py --resume resume.txt --output-json eval.json --output-md report.md -q
```

---

## Individual Modules

### Resume Parser

```python
from metis.resume_parser import parse

resume_data = parse(resume_text)
# Returns: {skills, experience, education, projects, summary, contact}
```

### GitHub Analyzer

```python
from metis.github_analyzer import analyze

github_data = analyze("https://github.com/username")
# Returns: {repositories, languages, original_repos, forked_repos, followers, ...}
```

### Portfolio Analyzer

```python
from metis.portfolio_analyzer import analyze

portfolio_data = analyze("https://portfolio.example.com")
# Returns: {skills, projects, social_links, has_contact, ...}
```

### Scoring Engine

```python
from metis.scoring_engine import evaluate

result = evaluate(
    resume_data=resume_data,
    github_data=github_data,      # optional
    portfolio_data=portfolio_data  # optional
)
# Returns: strict JSON output
```

---

## Error Handling

Errors return valid JSON with zero score:

```json
{
  "model": "metis_core_v1",
  "overall_score": 0,
  "section_scores": {},
  "strength_signals": [],
  "risk_signals": ["Evaluation error: <message>"],
  "ats_flags": [],
  "confidence_level": "low",
  "final_reasoning": "Evaluation failed due to error."
}
```

---

## File Locations

```
metis/
├── __init__.py
├── evaluator.py          # Main entry point
├── scoring_engine.py     # METIS-CORE v1 scorer
├── resume_parser.py      # Resume text parser
├── github_analyzer.py    # GitHub API analyzer
├── portfolio_analyzer.py # Portfolio scraper
└── jd_parser.py          # Job description parser
```

---

## Confidence Levels

| Level | Meaning | Typical Causes |
|-------|---------|----------------|
| `high` | Reliable evaluation | Multiple data sources, clear evidence |
| `medium` | Reasonable estimate | Some verification available |
| `low` | Limited data | Missing GitHub, sparse resume |
