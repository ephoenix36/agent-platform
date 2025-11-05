"""
Skills package initialization

Provides skill management infrastructure for the AI Agent Platform.
"""

from src.skills.models import (
    Skill,
    SkillRule,
    SkillDomain,
    SkillEvaluationResult,
    SkillSet
)

__all__ = [
    "Skill",
    "SkillRule",
    "SkillDomain",
    "SkillEvaluationResult",
    "SkillSet",
]

__version__ = "2.0.0"  # Major version bump for comprehensive skill architecture
