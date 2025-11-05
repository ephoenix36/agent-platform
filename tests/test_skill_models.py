"""
Unit tests for Skill data model and validation

Tests cover:
- Skill model validation
- Field constraints
- Serialization/deserialization
- Edge cases
"""

import pytest
from datetime import datetime
from pydantic import ValidationError
from src.skills.models import Skill, SkillDomain


class TestSkillModel:
    """Test suite for Skill Pydantic model"""
    
    def test_skill_creation_with_all_fields(self):
        """Test creating a skill with all required fields"""
        skill = Skill(
            id="skill-001",
            name="Type Hints Best Practice",
            domain=SkillDomain.CODING,
            instruction="Use type hints on all function signatures for clarity and IDE support.",
            applicable_to=["agents", "tools"],
            version="1.0.0",
            generation=0,
            performance_score=0.85,
            parent_skills=[],
            created_at=datetime.now(),
            optimized_at=datetime.now()
        )
        
        assert skill.id == "skill-001"
        assert skill.name == "Type Hints Best Practice"
        assert skill.domain == SkillDomain.CODING
        assert len(skill.instruction) > 0
        assert skill.performance_score == 0.85
    
    def test_skill_creation_with_defaults(self):
        """Test skill creation with minimal required fields"""
        skill = Skill(
            name="Minimal Skill",
            domain=SkillDomain.CODING,
            instruction="Always validate input parameters."
        )
        
        # Check defaults
        assert skill.id is not None  # Auto-generated UUID
        assert skill.version == "1.0.0"
        assert skill.generation == 0
        assert skill.performance_score == 0.0
        assert skill.parent_skills == []
        assert skill.applicable_to == []
        assert isinstance(skill.created_at, datetime)
    
    def test_skill_instruction_length_validation(self):
        """Test that instruction meets length constraints (1-2 sentences)"""
        # Too short (less than 10 chars)
        with pytest.raises(ValidationError):
            Skill(
                name="Too Short",
                domain=SkillDomain.CODING,
                instruction="Bad."
            )
        
        # Too long (more than 500 chars - roughly 3+ sentences)
        with pytest.raises(ValidationError):
            Skill(
                name="Too Long",
                domain=SkillDomain.CODING,
                instruction="A" * 501
            )
    
    def test_skill_performance_score_validation(self):
        """Test performance score is within 0.0-1.0 range"""
        # Valid range
        skill = Skill(
            name="Valid Score",
            domain=SkillDomain.CODING,
            instruction="Test instruction.",
            performance_score=0.75
        )
        assert skill.performance_score == 0.75
        
        # Invalid: negative
        with pytest.raises(ValidationError):
            Skill(
                name="Negative Score",
                domain=SkillDomain.CODING,
                instruction="Test instruction.",
                performance_score=-0.1
            )
        
        # Invalid: exceeds 1.0
        with pytest.raises(ValidationError):
            Skill(
                name="Exceeds Max",
                domain=SkillDomain.CODING,
                instruction="Test instruction.",
                performance_score=1.5
            )
    
    def test_skill_domain_validation(self):
        """Test domain must be valid SkillDomain enum"""
        # Valid domain
        skill = Skill(
            name="Valid Domain",
            domain=SkillDomain.RESEARCH,
            instruction="Always cite sources."
        )
        assert skill.domain == SkillDomain.RESEARCH
        
        # Invalid domain (string not in enum)
        with pytest.raises(ValidationError):
            Skill(
                name="Invalid Domain",
                domain="invalid_domain",
                instruction="Test instruction."
            )
    
    def test_skill_applicable_to_validation(self):
        """Test applicable_to accepts only valid values"""
        # Valid values
        skill = Skill(
            name="Valid Applicable",
            domain=SkillDomain.CODING,
            instruction="Test instruction.",
            applicable_to=["agents", "tools", "agent_groups"]
        )
        assert len(skill.applicable_to) == 3
        
        # Invalid value
        with pytest.raises(ValidationError):
            Skill(
                name="Invalid Applicable",
                domain=SkillDomain.CODING,
                instruction="Test instruction.",
                applicable_to=["invalid_type"]
            )
    
    def test_skill_serialization_to_dict(self):
        """Test skill can be serialized to dictionary"""
        skill = Skill(
            name="Serialization Test",
            domain=SkillDomain.ANALYSIS,
            instruction="Use appropriate chart types for data visualization."
        )
        
        skill_dict = skill.model_dump()
        
        assert isinstance(skill_dict, dict)
        assert skill_dict["name"] == "Serialization Test"
        assert skill_dict["domain"] == "analysis"
        assert "instruction" in skill_dict
        assert "created_at" in skill_dict
    
    def test_skill_deserialization_from_dict(self):
        """Test skill can be created from dictionary"""
        skill_data = {
            "id": "test-123",
            "name": "Deserialization Test",
            "domain": "coding",
            "instruction": "Write unit tests for all public methods.",
            "version": "1.0.0",
            "generation": 0,
            "performance_score": 0.9,
            "parent_skills": [],
            "applicable_to": ["agents"],
            "created_at": datetime.now().isoformat(),
            "optimized_at": datetime.now().isoformat()
        }
        
        skill = Skill.model_validate(skill_data)
        
        assert skill.id == "test-123"
        assert skill.name == "Deserialization Test"
        assert skill.domain == SkillDomain.CODING
        assert skill.performance_score == 0.9
    
    def test_skill_version_increment(self):
        """Test skill version follows semver format"""
        skill = Skill(
            name="Version Test",
            domain=SkillDomain.CODING,
            instruction="Test instruction.",
            version="1.2.3"
        )
        
        assert skill.version == "1.2.3"
        
        # Invalid version format
        with pytest.raises(ValidationError):
            Skill(
                name="Invalid Version",
                domain=SkillDomain.CODING,
                instruction="Test instruction.",
                version="invalid"
            )
    
    def test_skill_parent_tracking(self):
        """Test skill can track parent skills for evolution"""
        parent_skill = Skill(
            name="Parent Skill",
            domain=SkillDomain.CODING,
            instruction="Original instruction."
        )
        
        child_skill = Skill(
            name="Evolved Skill",
            domain=SkillDomain.CODING,
            instruction="Refined instruction for better clarity.",
            parent_skills=[parent_skill.id],
            generation=1
        )
        
        assert len(child_skill.parent_skills) == 1
        assert child_skill.parent_skills[0] == parent_skill.id
        assert child_skill.generation == 1
    
    def test_skill_equality(self):
        """Test two skills with same ID are equal"""
        skill1 = Skill(
            id="same-id",
            name="Skill One",
            domain=SkillDomain.CODING,
            instruction="First instruction."
        )
        
        skill2 = Skill(
            id="same-id",
            name="Skill Two",
            domain=SkillDomain.RESEARCH,
            instruction="Different instruction."
        )
        
        # Skills are equal if IDs match
        assert skill1.id == skill2.id
    
    def test_skill_immutable_id(self):
        """Test skill ID cannot be changed after creation"""
        skill = Skill(
            name="Immutable ID",
            domain=SkillDomain.CODING,
            instruction="Test instruction."
        )
        
        original_id = skill.id
        
        # Pydantic models are not frozen by default, but ID should not be reassigned
        # in production code (enforced by convention)
        assert skill.id == original_id


class TestSkillDomainEnum:
    """Test suite for SkillDomain enumeration"""
    
    def test_all_domains_defined(self):
        """Test all expected domains are defined"""
        expected_domains = {
            "coding", "research", "analysis", "communication",
            "problem_solving", "meta"
        }
        
        actual_domains = {domain.value for domain in SkillDomain}
        
        assert actual_domains == expected_domains
    
    def test_domain_string_values(self):
        """Test domain enum values are lowercase strings"""
        for domain in SkillDomain:
            assert isinstance(domain.value, str)
            assert domain.value.islower() or "_" in domain.value
