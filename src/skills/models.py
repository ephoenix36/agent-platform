"""
Skill data models for the AI Agent Platform

Provides Pydantic models for skills - lightweight, versioned instruction fragments
that enhance agent capabilities across domains.
"""

from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Literal, Optional
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


class SkillRule(BaseModel):
    """
    Individual rule within a skill - specific behavioral directive
    
    Rules can be conditional based on context, file patterns, or task types.
    """
    
    model_config = ConfigDict(use_enum_values=True)
    
    id: str = Field(
        default_factory=lambda: f"rule-{uuid.uuid4().hex[:8]}",
        description="Unique rule identifier"
    )
    directive: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        description="Specific behavioral instruction or constraint"
    )
    priority: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Rule priority (0-100, higher = more important)"
    )
    activation_patterns: List[str] = Field(
        default_factory=list,
        description="Glob patterns for conditional activation (e.g., '**/*.psd', 'tasks/image-editing/*')"
    )
    condition: Optional[str] = Field(
        default=None,
        description="Optional Python expression for activation (e.g., 'task.complexity > 0.7')"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Categorization tags for rule organization"
    )


class Skill(BaseModel):
    """
    Comprehensive skill representing domain expertise with system prompts,
    rules, tool integrations, and learning capabilities.
    
    Skills are:
    - **Comprehensive**: Include full system prompts and multiple rules
    - **Contextual**: Activate based on patterns, conditions, task types
    - **Tool-Aware**: Reference and optimize specific tool usage
    - **Evolvable**: Improve through optimization and learning
    - **Modular**: Can be composed and applied selectively
    
    Architecture:
    - **System Prompt**: Rich context and role definition for the agent
    - **Rules**: List of specific directives (with optional activation patterns)
    - **Tool Integrations**: References to tools this skill optimizes
    - **Activation Patterns**: Glob patterns for auto-application
    - **Performance Tracking**: Metrics and optimization history
    
    Example Use Cases:
    - Photoshop automation with desktop control
    - Code review with linting tool integration
    - Research with citation management tools
    - Data analysis with visualization libraries
    """
    
    model_config = ConfigDict(
        use_enum_values=True,
        json_schema_extra={
            "example": {
                "name": "Photoshop Expert Automation",
                "domain": "image_processing",
                "system_prompt": "You are an expert Photoshop automation specialist...",
                "rules": [
                    {
                        "directive": "Use keyboard shortcuts (Ctrl+J for duplicate layer) for 3x faster execution",
                        "priority": 90,
                        "activation_patterns": ["**/*.psd"]
                    }
                ],
                "required_tools": ["desktop-control", "screen-capture"],
                "activation_patterns": ["tasks/image-editing/*", "**/*.psd"],
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
    
    # Core Content (Expanded Architecture)
    system_prompt: str = Field(
        default="",
        max_length=10000,
        description="Full system prompt for agent role and context (can be rich and detailed)"
    )
    rules: List[SkillRule] = Field(
        default_factory=list,
        description="List of specific behavioral rules/directives"
    )
    instruction: str = Field(
        default="",
        max_length=2000,
        description="Legacy/summary instruction (optional, use system_prompt + rules instead)"
    )
    
    # Applicability & Activation
    applicable_to: List[Literal["agents", "tools", "agent_groups"]] = Field(
        default_factory=list,
        description="What this skill can be applied to"
    )
    activation_patterns: List[str] = Field(
        default_factory=list,
        description="Glob patterns for automatic skill activation (e.g., '**/*.psd', 'tasks/coding/*')"
    )
    activation_conditions: List[str] = Field(
        default_factory=list,
        description="Python expressions for conditional activation (e.g., 'task.complexity > 0.5')"
    )
    
    # Tool Integration
    required_tools: List[str] = Field(
        default_factory=list,
        description="Tools required for this skill to function (e.g., 'desktop-control', 'screen-capture')"
    )
    optional_tools: List[str] = Field(
        default_factory=list,
        description="Tools that enhance this skill but aren't required"
    )
    tool_configurations: Dict[str, Any] = Field(
        default_factory=dict,
        description="Tool-specific configuration optimized by this skill"
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
    
    # Performance Metrics & Learning
    performance_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Overall performance score from evaluations (0.0-1.0)"
    )
    evaluation_count: int = Field(
        default=0,
        ge=0,
        description="Number of times this skill has been evaluated"
    )
    success_rate: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Task success rate when this skill is active"
    )
    avg_execution_time: float = Field(
        default=0.0,
        ge=0.0,
        description="Average execution time in seconds"
    )
    usage_count: int = Field(
        default=0,
        ge=0,
        description="Number of times this skill has been used in production"
    )
    learning_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Accumulated learning data (tool usage patterns, successful strategies, etc.)"
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
    
    @field_validator("system_prompt")
    @classmethod
    def validate_system_prompt_quality(cls, v: str) -> str:
        """Validate system prompt quality (if provided)"""
        if not v:
            return v  # Optional field
        
        # Check for vague filler words (encourage specificity)
        vague_words = ["maybe", "possibly", "perhaps", "somewhat", "kind of"]
        if any(word in v.lower() for word in vague_words):
            raise ValueError(
                f"System prompt contains vague language. Be specific and actionable."
            )
        
        # Ensure minimum substance if provided
        if len(v.strip()) > 0 and len(v.strip()) < 50:
            raise ValueError(
                f"System prompt too brief. Provide substantial context or leave empty."
            )
        
        return v
    
    @field_validator("instruction")
    @classmethod
    def validate_instruction_quality(cls, v: str) -> str:
        """Validate instruction meets quality standards (legacy field, now optional)"""
        if not v:
            return v  # Now optional since we have system_prompt + rules
        
        # Check for vague filler words (encourage specificity)
        vague_words = ["maybe", "possibly", "perhaps", "somewhat", "kind of"]
        if any(word in v.lower() for word in vague_words):
            raise ValueError(
                f"Instruction contains vague language. Be specific and actionable."
            )
        
        return v
    
    @field_validator("activation_patterns")
    @classmethod
    def validate_activation_patterns(cls, v: List[str]) -> List[str]:
        """Validate glob patterns are well-formed"""
        import fnmatch
        for pattern in v:
            # Basic validation - ensure it's a reasonable glob pattern
            if not pattern or len(pattern) > 500:
                raise ValueError(f"Invalid activation pattern: {pattern}")
        return v
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert skill to dictionary for JSON serialization"""
        return self.model_dump(mode="json")
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Skill":
        """Create skill from dictionary"""
        return cls.model_validate(data)
    
    def add_rule(self, rule: SkillRule) -> None:
        """Add a rule to this skill"""
        self.rules.append(rule)
    
    def remove_rule(self, rule_id: str) -> bool:
        """
        Remove a rule by ID
        
        Returns:
            True if removed, False if not found
        """
        for i, rule in enumerate(self.rules):
            if rule.id == rule_id:
                self.rules.pop(i)
                return True
        return False
    
    def get_active_rules(self, context: Dict[str, Any]) -> List[SkillRule]:
        """
        Get rules that should be active for the given context
        
        Args:
            context: Context dict with keys like 'file_path', 'task', 'complexity'
            
        Returns:
            List of active rules (sorted by priority, descending)
        """
        import fnmatch
        
        active_rules = []
        
        for rule in self.rules:
            # Check activation patterns
            if rule.activation_patterns:
                file_path = context.get('file_path', '')
                if file_path and any(
                    fnmatch.fnmatch(file_path, pattern)
                    for pattern in rule.activation_patterns
                ):
                    active_rules.append(rule)
                    continue
            
            # Check activation condition
            if rule.condition:
                try:
                    # Safe eval with limited context
                    safe_context = {
                        'task': context.get('task', {}),
                        'complexity': context.get('complexity', 0)
                    }
                    if eval(rule.condition, {"__builtins__": {}}, safe_context):
                        active_rules.append(rule)
                        continue
                except Exception:
                    # If condition fails, skip this rule
                    pass
            
            # If no patterns/conditions, rule is always active
            if not rule.activation_patterns and not rule.condition:
                active_rules.append(rule)
        
        # Sort by priority (descending)
        active_rules.sort(key=lambda r: r.priority, reverse=True)
        
        return active_rules
    
    def should_activate(self, context: Dict[str, Any]) -> bool:
        """
        Determine if this skill should activate for the given context
        
        Args:
            context: Context dict with keys like 'file_path', 'task_type', etc.
            
        Returns:
            True if skill should activate
        """
        import fnmatch
        
        # Check activation patterns
        if self.activation_patterns:
            file_path = context.get('file_path', '')
            task_type = context.get('task_type', '')
            
            for pattern in self.activation_patterns:
                if file_path and fnmatch.fnmatch(file_path, pattern):
                    return True
                if task_type and fnmatch.fnmatch(task_type, pattern):
                    return True
        
        # Check activation conditions
        if self.activation_conditions:
            for condition in self.activation_conditions:
                try:
                    safe_context = {
                        'task': context.get('task', {}),
                        'complexity': context.get('complexity', 0),
                        'tools_available': context.get('tools_available', [])
                    }
                    if eval(condition, {"__builtins__": {}}, safe_context):
                        return True
                except Exception:
                    pass
        
        # If no patterns/conditions, skill can always activate
        if not self.activation_patterns and not self.activation_conditions:
            return True
        
        return False
    
    def record_usage(
        self,
        success: bool,
        execution_time: float,
        learned_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Record skill usage for learning and optimization
        
        Args:
            success: Whether the task was successful
            execution_time: Time taken in seconds
            learned_data: Optional data to merge into learning_data
        """
        self.usage_count += 1
        
        # Update success rate (running average)
        if self.usage_count == 1:
            self.success_rate = 1.0 if success else 0.0
        else:
            self.success_rate = (
                (self.success_rate * (self.usage_count - 1) + (1.0 if success else 0.0))
                / self.usage_count
            )
        
        # Update average execution time
        if self.usage_count == 1:
            self.avg_execution_time = execution_time
        else:
            self.avg_execution_time = (
                (self.avg_execution_time * (self.usage_count - 1) + execution_time)
                / self.usage_count
            )
        
        # Merge learned data
        if learned_data:
            for key, value in learned_data.items():
                if key not in self.learning_data:
                    self.learning_data[key] = []
                if isinstance(self.learning_data[key], list):
                    self.learning_data[key].append(value)
    
    def evolve(
        self,
        new_system_prompt: Optional[str] = None,
        new_rules: Optional[List[SkillRule]] = None,
        mutator_id: str = "system"
    ) -> "Skill":
        """
        Create an evolved version of this skill
        
        Args:
            new_system_prompt: Updated system prompt (None to keep current)
            new_rules: Updated rules list (None to keep current)
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
            system_prompt=new_system_prompt or self.system_prompt,
            rules=new_rules or self.rules,
            instruction=self.instruction,  # Keep legacy field
            applicable_to=self.applicable_to,
            activation_patterns=self.activation_patterns,
            activation_conditions=self.activation_conditions,
            required_tools=self.required_tools,
            optional_tools=self.optional_tools,
            tool_configurations=self.tool_configurations,
            version=new_version,
            generation=self.generation + 1,
            parent_skills=[self.id],
            created_by=mutator_id,
            tags=self.tags + ["evolved"],
            # Inherit learning data
            learning_data=self.learning_data.copy()
        )
    
    def __str__(self) -> str:
        """Human-readable string representation"""
        if self.system_prompt:
            preview = self.system_prompt[:100] + "..." if len(self.system_prompt) > 100 else self.system_prompt
            return f"[{self.domain}] {self.name}: {len(self.rules)} rules | {preview}"
        elif self.instruction:
            return f"[{self.domain}] {self.name}: {self.instruction}"
        else:
            return f"[{self.domain}] {self.name}: {len(self.rules)} rules"
    
    def __repr__(self) -> str:
        """Developer-friendly representation"""
        return (
            f"Skill(id={self.id!r}, name={self.name!r}, "
            f"domain={self.domain!r}, score={self.performance_score}, "
            f"rules={len(self.rules)}, usage={self.usage_count})"
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
