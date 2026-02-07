"""
Schema Validation for Model Integration

Validates outputs from Model 1 (JD Parser) and Model 2 (Assessment Evaluator)
before passing to Model 3 (Scoring & Leaderboard).
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


# Valid proficiency levels for resume claims
VALID_PROFICIENCY_LEVELS = ['Expert', 'Advanced', 'Intermediate', 'Beginner']


@dataclass
class ValidationError:
    """Represents a validation error."""
    field: str
    message: str
    severity: str  # 'error' or 'warning'


class SchemaValidator:
    """
    Validates Model 1 and Model 2 outputs for Model 3 integration.
    """
    
    def __init__(self):
        self.errors: List[ValidationError] = []
        self.warnings: List[ValidationError] = []
    
    def validate_model1_output(self, output: Dict) -> Tuple[bool, List[ValidationError]]:
        """
        Validate Model 1 (JD Parser) output.
        
        Expected schema:
        {
            "job_id": str,
            "job_title": str,
            "skill_weights": [
                {"skill": str, "weight": float, "importance": int}
            ]
        }
        
        Returns:
            (is_valid, list of errors/warnings)
        """
        self.errors = []
        self.warnings = []
        
        # Check required fields
        if not output.get('job_id'):
            self._add_error('job_id', 'Missing required field: job_id')
        
        if not output.get('job_title'):
            self._add_warning('job_title', 'Missing job_title (will use "Unknown Position")')
        
        # Validate skill_weights
        skill_weights = output.get('skill_weights', [])
        
        if not skill_weights:
            self._add_error('skill_weights', 'Missing or empty skill_weights array')
        else:
            self._validate_skill_weights(skill_weights)
        
        return len(self.errors) == 0, self.errors + self.warnings
    
    def validate_model2_output(self, output: Dict) -> Tuple[bool, List[ValidationError]]:
        """
        Validate Model 2 (Assessment Evaluator) output for a single candidate.
        
        Expected schema:
        {
            "candidate_id": str,
            "candidate_name": str,
            "skill_scores": [
                {"skill": str, "score": float, ...}
            ],
            "resume_claims": [
                {"skill": str, "claimed_level": str, ...}
            ]
        }
        
        Returns:
            (is_valid, list of errors/warnings)
        """
        self.errors = []
        self.warnings = []
        
        # Check required fields
        if not output.get('candidate_id'):
            self._add_error('candidate_id', 'Missing required field: candidate_id')
        
        if not output.get('candidate_name'):
            self._add_warning('candidate_name', 'Missing candidate_name (will use "Unknown")')
        
        # Validate skill_scores
        skill_scores = output.get('skill_scores', [])
        
        if not skill_scores:
            self._add_error('skill_scores', 'Missing or empty skill_scores array')
        else:
            self._validate_skill_scores(skill_scores)
        
        # Validate resume_claims (optional but recommended)
        resume_claims = output.get('resume_claims', [])
        
        if not resume_claims:
            self._add_warning('resume_claims', 'No resume_claims provided - integrity check will skip')
        else:
            self._validate_resume_claims(resume_claims)
        
        return len(self.errors) == 0, self.errors + self.warnings
    
    def validate_integration(
        self,
        model1_outputs: List[Dict],
        model2_outputs: List[Dict]
    ) -> Tuple[bool, Dict]:
        """
        Validate the complete integration between Model 1 and Model 2 outputs.
        
        Checks:
        - All required fields present
        - Skill names match between Model 1 and Model 2
        - Weight normalization
        
        Returns:
            (is_valid, validation_report)
        """
        all_errors = []
        all_warnings = []
        
        # Validate Model 1 outputs
        if not model1_outputs:
            all_errors.append(ValidationError('model1_outputs', 'No Model 1 outputs provided', 'error'))
        else:
            for i, m1 in enumerate(model1_outputs):
                is_valid, issues = self.validate_model1_output(m1)
                for issue in issues:
                    issue.field = f'model1[{i}].{issue.field}'
                    if issue.severity == 'error':
                        all_errors.append(issue)
                    else:
                        all_warnings.append(issue)
        
        # Validate Model 2 outputs
        if not model2_outputs:
            all_errors.append(ValidationError('model2_outputs', 'No Model 2 outputs provided', 'error'))
        else:
            for i, m2 in enumerate(model2_outputs):
                is_valid, issues = self.validate_model2_output(m2)
                for issue in issues:
                    issue.field = f'model2[{i}].{issue.field}'
                    if issue.severity == 'error':
                        all_errors.append(issue)
                    else:
                        all_warnings.append(issue)
        
        # Cross-validate skills
        if model1_outputs and model2_outputs:
            skill_issues = self._cross_validate_skills(model1_outputs[0], model2_outputs)
            all_warnings.extend(skill_issues)
        
        is_valid = len(all_errors) == 0
        
        return is_valid, {
            'is_valid': is_valid,
            'error_count': len(all_errors),
            'warning_count': len(all_warnings),
            'errors': [{'field': e.field, 'message': e.message} for e in all_errors],
            'warnings': [{'field': w.field, 'message': w.message} for w in all_warnings]
        }
    
    def _validate_skill_weights(self, weights: List[Dict]):
        """Validate skill_weights array."""
        total_weight = 0.0
        skills_seen = set()
        
        for i, w in enumerate(weights):
            prefix = f'skill_weights[{i}]'
            
            # Check skill name
            if not w.get('skill'):
                self._add_error(f'{prefix}.skill', 'Missing skill name')
            elif w['skill'].lower() in skills_seen:
                self._add_warning(f'{prefix}.skill', f'Duplicate skill: {w["skill"]}')
            else:
                skills_seen.add(w['skill'].lower())
            
            # Check weight
            weight = w.get('weight', 0)
            if not isinstance(weight, (int, float)):
                self._add_error(f'{prefix}.weight', 'Weight must be a number')
            elif weight <= 0:
                self._add_error(f'{prefix}.weight', 'Weight must be positive')
            else:
                total_weight += weight
            
            # Check importance (optional)
            importance = w.get('importance')
            if importance is not None:
                if not isinstance(importance, int) or importance < 1 or importance > 10:
                    self._add_warning(f'{prefix}.importance', 'Importance should be 1-10')
        
        # Check weight normalization
        if abs(total_weight - 1.0) > 0.01:
            self._add_warning('skill_weights', 
                f'Weights sum to {total_weight:.2f}, not 1.0 (will auto-normalize)')
    
    def _validate_skill_scores(self, scores: List[Dict]):
        """Validate skill_scores array."""
        for i, s in enumerate(scores):
            prefix = f'skill_scores[{i}]'
            
            # Check skill name
            if not s.get('skill'):
                self._add_error(f'{prefix}.skill', 'Missing skill name')
            
            # Check score
            score = s.get('score')
            if score is None:
                self._add_error(f'{prefix}.score', 'Missing score')
            elif not isinstance(score, (int, float)):
                self._add_error(f'{prefix}.score', 'Score must be a number')
            elif score < 0 or score > 100:
                self._add_warning(f'{prefix}.score', f'Score {score} outside 0-100 range')
    
    def _validate_resume_claims(self, claims: List[Dict]):
        """Validate resume_claims array."""
        for i, c in enumerate(claims):
            prefix = f'resume_claims[{i}]'
            
            # Check skill name
            if not c.get('skill'):
                self._add_error(f'{prefix}.skill', 'Missing skill name')
            
            # Check claimed_level
            level = c.get('claimed_level')
            if not level:
                self._add_error(f'{prefix}.claimed_level', 'Missing claimed_level')
            elif level not in VALID_PROFICIENCY_LEVELS:
                self._add_error(f'{prefix}.claimed_level', 
                    f'Invalid level "{level}". Must be one of: {VALID_PROFICIENCY_LEVELS}')
    
    def _cross_validate_skills(
        self, 
        model1: Dict, 
        model2_outputs: List[Dict]
    ) -> List[ValidationError]:
        """Check skill name consistency between Model 1 and Model 2."""
        warnings = []
        
        # Get skills from Model 1
        m1_skills = {w['skill'].lower() for w in model1.get('skill_weights', [])}
        
        for i, m2 in enumerate(model2_outputs):
            m2_skills = {s['skill'].lower() for s in m2.get('skill_scores', [])}
            
            # Skills in Model 1 but not in Model 2
            missing = m1_skills - m2_skills
            if missing:
                warnings.append(ValidationError(
                    f'model2[{i}].skill_scores',
                    f'Skills in JD but not assessed: {missing}',
                    'warning'
                ))
            
            # Skills in Model 2 but not in Model 1
            extra = m2_skills - m1_skills
            if extra:
                warnings.append(ValidationError(
                    f'model2[{i}].skill_scores',
                    f'Skills assessed but not in JD (will be ignored): {extra}',
                    'warning'
                ))
        
        return warnings
    
    def _add_error(self, field: str, message: str):
        self.errors.append(ValidationError(field, message, 'error'))
    
    def _add_warning(self, field: str, message: str):
        self.warnings.append(ValidationError(field, message, 'warning'))


# Convenience function
def validate_for_model3(
    model1_outputs: List[Dict],
    model2_outputs: List[Dict]
) -> Tuple[bool, Dict]:
    """
    Validate Model 1 and Model 2 outputs before passing to Model 3.
    
    Usage:
        is_valid, report = validate_for_model3(model1_outputs, model2_outputs)
        if is_valid:
            result = run_model3_pipeline(model1_outputs, model2_outputs)
        else:
            print("Validation failed:", report['errors'])
    """
    validator = SchemaValidator()
    return validator.validate_integration(model1_outputs, model2_outputs)
