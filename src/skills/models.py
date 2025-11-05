"""
Skill data models for the AI Agent Platform

Provides Pydantic models for skills - lightweight, versioned instruction fragments
that enhance agent capabilities across domains.
"""

from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict
import uuid
import re


class SkillDomain(str, Enum):
    """
    Skill domain categories aligned with agent specializations
    
    Domains organize skills by their primary application area.
    """
    CODING = "coding"
    RESEARCH = "research"
    ANALYSIS = "analysis"
    COMMUNICATION = "communication"
    PROBLEM_SOLVING = "problem_solving"
    META = "meta"


class Skill(BaseModel):
    """
    A skill represents a concise, high-value instruction or rule
    that can be applied to agents, tools, or agent groups.
    
    Skills are:
    - Concise: 1-2 sentences, typically 50-200 characters
    - Specific: Target one capability or pattern
    - Actionable: Directly applicable to task execution
    - Evolvable: Can be mutated and optimized over generations
    
    Example:
        "Use type hints on all function signatures for clarity and IDE support."
    """
    
    model_config = ConfigDict(
        use_enum_values=True,
        json_schema_extra={
            "example": {
                "name": "Type Hints Best Practice",
                "domain": "coding",
                "instruction": "Use type hints on all function signatures for clarity and IDE support.",
                "applicable_to": ["agents", "tools"],
                "version": "1.0.0"
            }
        }
    )
    
    # Identity
    id: str = Field(
        default_factory=lambda: f"skill-{uuid.uuid4().hex[:12]}",
        description="Unique skill identifier"
    )
    name: str = Field(
        ...,
        min_length=3,
        max_length=100,
        description="Human-readable skill name"
    )
    domain: SkillDomain = Field(
        ...,
        description="Primary domain where this skill applies"
    )
    
    # Core Content
    instruction: str = Field(
        ...,
        min_length=10,
        max_length=500,
        description="Concise instruction (1-2 sentences, high-density)"
    )
    
    # Applicability
    applicable_to: List[Literal["agents", "tools", "agent_groups"]] = Field(
        default_factory=list,
        description="What this skill can be applied to"
    )
    
    # Versioning & Evolution
    version: str = Field(
        default="1.0.0",
        description="Semantic version (MAJOR.MINOR.PATCH)"
    )
    generation: int = Field(
        default=0,
        ge=0,
        description="Evolution generation number (0 = original)"
    )
    parent_skills: List[str] = Field(
        default_factory=list,
        description="IDs of parent skills (for evolution tracking)"
    )
    
    # Performance Metrics
    performance_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Performance score from A/B testing (0.0-1.0)"
    )
    evaluation_count: int = Field(
        default=0,
        ge=0,
        description="Number of times this skill has been evaluated"
    )
    
    # Metadata
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="Skill creation timestamp"
    )
    optimized_at: datetime = Field(
        default_factory=datetime.now,
        description="Last optimization timestamp"
    )
    created_by: str = Field(
        default="system",
        description="Creator (user ID or 'system')"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Searchable tags"
    )
    
    # Validation
    @field_validator("version")
    @classmethod
    def validate_semver(cls, v: str) -> str:
        """Validate semantic version format"""
        if not re.match(r"^\d+\.\d+\.\d+$", v):
            raise ValueError(f"Version must be in semver format (X.Y.Z), got: {v}")
        return v
    
    @field_validator("instruction")
    @classmethod
    def validate_instruction_quality(cls, v: str) -> str:
        """Validate instruction meets quality standards"""
        # Check sentence count (should be 1-2 sentences)
        sentence_count = len([s for s in re.split(r'[.!?]+', v) if s.strip()])
        if sentence_count > 3:
            raise ValueError(
                f"Instruction should be 1-2 sentences for conciseness, got {sentence_count}"
            )
        
        # Check for vague filler words (encourage specificity)
        vague_words = ["maybe", "possibly", "perhaps", "somewhat", "kind of"]
        if any(word in v.lower() for word in vague_words):
            raise ValueError(
                f"Instruction contains vague language. Be specific and actionable."
            )
        
        return v
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert skill to dictionary for JSON serialization"""
        return self.model_dump(mode="json")
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Skill":
        """Create skill from dictionary"""
        return cls.model_validate(data)
    
    def evolve(self, new_instruction: str, mutator_id: str) -> "Skill":
        """
        Create an evolved version of this skill
        
        Args:
            new_instruction: The mutated instruction
            mutator_id: ID of the mutator agent that created this variant
            
        Returns:
            New skill instance (evolved generation)
        """
        # Parse current version
        major, minor, patch = map(int, self.version.split("."))
        
        # Increment patch version for mutations
        new_version = f"{major}.{minor}.{patch + 1}"
        
        return Skill(
            name=f"{self.name} (Gen {self.generation + 1})",
            domain=self.domain,
            instruction=new_instruction,
            applicable_to=self.applicable_to,
            version=new_version,
            generation=self.generation + 1,
            parent_skills=[self.id],
            created_by=mutator_id,
            tags=self.tags + ["evolved"]
        )
    
    def __str__(self) -> str:
        """Human-readable string representation"""
        return f"[{self.domain}] {self.name}: {self.instruction}"
    
    def __repr__(self) -> str:
        """Developer-friendly representation"""
        return (
            f"Skill(id={self.id!r}, name={self.name!r}, "
            f"domain={self.domain!r}, score={self.performance_score})"
        )


class SkillEvaluationResult(BaseModel):
    """
    Result from evaluating a skill's effectiveness
    
    Captures performance delta when skill is applied to an agent.
    """
    
    model_config = ConfigDict(use_enum_values=True)
    
    skill_id: str = Field(..., description="ID of evaluated skill")
    agent_id: str = Field(..., description="ID of agent tested with skill")
    task_id: str = Field(..., description="ID of benchmark task")
    
    # Performance Metrics
    baseline_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Agent performance without skill"
    )
    with_skill_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Agent performance with skill"
    )
    improvement: float = Field(
        ...,
        description="Performance delta (with_skill - baseline)"
    )
    
    # Breakdown
    breakdown: Dict[str, float] = Field(
        default_factory=dict,
        description="Detailed metric breakdown"
    )
    feedback: str = Field(
        default="",
        description="Qualitative evaluation feedback"
    )
    
    # Metadata
    evaluated_at: datetime = Field(
        default_factory=datetime.now,
        description="Evaluation timestamp"
    )
    evaluator_id: str = Field(
        default="skill-evaluator",
        description="ID of evaluator agent"
    )
    
    @property
    def relative_improvement(self) -> float:
        """Calculate relative improvement percentage"""
        if self.baseline_score == 0:
            return 0.0
        return (self.improvement / self.baseline_score) * 100
    
    def is_effective(self, threshold: float = 0.05) -> bool:
        """
        Determine if skill provides meaningful improvement
        
        Args:
            threshold: Minimum improvement to be considered effective
            
        Returns:
            True if improvement exceeds threshold
        """
        return self.improvement >= threshold
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return self.model_dump(mode="json")


class SkillSet(BaseModel):
    """
    A collection of related skills for a specific purpose
    
    SkillSets enable grouping complementary skills for easy application.
    """
    
    model_config = ConfigDict(use_enum_values=True)
    
    id: str = Field(
        default_factory=lambda: f"skillset-{uuid.uuid4().hex[:12]}",
        description="Unique skillset identifier"
    )
    name: str = Field(..., description="Skillset name")
    description: str = Field(..., description="Purpose and applicability")
    domain: SkillDomain = Field(..., description="Primary domain")
    
    skill_ids: List[str] = Field(
        default_factory=list,
        description="IDs of skills in this set"
    )
    
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    def add_skill(self, skill_id: str) -> None:
        """Add a skill to this set"""
        if skill_id not in self.skill_ids:
            self.skill_ids.append(skill_id)
            self.updated_at = datetime.now()
    
    def remove_skill(self, skill_id: str) -> None:
        """Remove a skill from this set"""
        if skill_id in self.skill_ids:
            self.skill_ids.remove(skill_id)
            self.updated_at = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return self.model_dump(mode="json")
