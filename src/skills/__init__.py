"""
Skills package initialization

Provides skill management infrastructure for the AI Agent Platform.
"""

from src.skills.models import (
    Skill,
    SkillDomain,
    SkillEvaluationResult,
    SkillSet
)

__all__ = [
    "Skill",
    "SkillDomain",
    "SkillEvaluationResult",
    "SkillSet",
]

__version__ = "1.0.0"
