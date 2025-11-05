"""
Unit tests for SkillRegistry

Tests cover:
- Registry initialization
- CRUD operations (Create, Read, Update, Delete)
- JSON persistence (save/load)
- Search and filtering
- Performance tracking
- Edge cases and error handling
"""

import pytest
import json
import os
from pathlib import Path
from datetime import datetime
from src.skills.models import Skill, SkillDomain
from src.skills.skill_registry import SkillRegistry


@pytest.fixture
def temp_registry_file(tmp_path):
    """Provide temporary file for registry persistence"""
    return tmp_path / "test_skills.json"


@pytest.fixture
def sample_skills():
    """Provide sample skills for testing"""
    return [
        Skill(
            name="Type Hints",
            domain=SkillDomain.CODING,
            instruction="Use type hints on all function signatures.",
            applicable_to=["agents"],
            performance_score=0.85
        ),
        Skill(
            name="Cite Sources",
            domain=SkillDomain.RESEARCH,
            instruction="Always cite sources with author, year, and publication.",
            applicable_to=["agents", "tools"],
            performance_score=0.92
        ),
        Skill(
            name="Chart Selection",
            domain=SkillDomain.ANALYSIS,
            instruction="Use bar charts for comparisons, line charts for trends.",
            applicable_to=["agents"],
            performance_score=0.78
        )
    ]


class TestSkillRegistryInitialization:
    """Test registry initialization"""
    
    def test_create_registry_without_storage(self):
        """Test creating registry without persistence"""
        registry = SkillRegistry()
        
        assert registry is not None
        assert len(registry.skills) == 0
        assert registry.storage_path is None
    
    def test_create_registry_with_storage_path(self, temp_registry_file):
        """Test creating registry with JSON storage"""
        registry = SkillRegistry(storage_path=str(temp_registry_file))
        
        assert registry.storage_path == str(temp_registry_file)
        assert len(registry.skills) == 0
    
    def test_registry_creates_storage_directory(self, tmp_path):
        """Test registry creates storage directory if missing"""
        nested_path = tmp_path / "nested" / "dir" / "skills.json"
        registry = SkillRegistry(storage_path=str(nested_path))
        
        # Save should create directory
        registry.save()
        
        assert nested_path.parent.exists()
        assert nested_path.exists()


class TestSkillRegistryCRUD:
    """Test Create, Read, Update, Delete operations"""
    
    def test_register_skill(self, sample_skills):
        """Test registering a new skill"""
        registry = SkillRegistry()
        skill = sample_skills[0]
        
        skill_id = registry.register(skill)
        
        assert skill_id == skill.id
        assert len(registry.skills) == 1
        assert registry.skills[skill_id] == skill
    
    def test_register_multiple_skills(self, sample_skills):
        """Test registering multiple skills"""
        registry = SkillRegistry()
        
        for skill in sample_skills:
            registry.register(skill)
        
        assert len(registry.skills) == 3
    
    def test_get_skill_by_id(self, sample_skills):
        """Test retrieving skill by ID"""
        registry = SkillRegistry()
        skill = sample_skills[0]
        registry.register(skill)
        
        retrieved = registry.get(skill.id)
        
        assert retrieved is not None
        assert retrieved.id == skill.id
        assert retrieved.name == skill.name
    
    def test_get_nonexistent_skill_returns_none(self):
        """Test getting skill that doesn't exist"""
        registry = SkillRegistry()
        
        result = registry.get("nonexistent-id")
        
        assert result is None
    
    def test_update_skill(self, sample_skills):
        """Test updating an existing skill"""
        registry = SkillRegistry()
        skill = sample_skills[0]
        registry.register(skill)
        
        # Update skill
        skill.performance_score = 0.95
        registry.register(skill)  # Re-register to update
        
        updated = registry.get(skill.id)
        assert updated.performance_score == 0.95
    
    def test_delete_skill(self, sample_skills):
        """Test deleting a skill"""
        registry = SkillRegistry()
        skill = sample_skills[0]
        registry.register(skill)
        
        assert len(registry.skills) == 1
        
        success = registry.delete(skill.id)
        
        assert success is True
        assert len(registry.skills) == 0
        assert registry.get(skill.id) is None
    
    def test_delete_nonexistent_skill_returns_false(self):
        """Test deleting skill that doesn't exist"""
        registry = SkillRegistry()
        
        result = registry.delete("nonexistent-id")
        
        assert result is False


class TestSkillRegistryPersistence:
    """Test JSON save/load functionality"""
    
    def test_save_registry_to_file(self, temp_registry_file, sample_skills):
        """Test saving registry to JSON file"""
        registry = SkillRegistry(storage_path=str(temp_registry_file))
        
        for skill in sample_skills:
            registry.register(skill)
        
        registry.save()
        
        assert temp_registry_file.exists()
        
        # Verify JSON structure
        with open(temp_registry_file, 'r') as f:
            data = json.load(f)
        
        assert len(data) == 3
        assert all('id' in skill for skill in data)
    
    def test_load_registry_from_file(self, temp_registry_file, sample_skills):
        """Test loading registry from JSON file"""
        # Create and save registry
        registry1 = SkillRegistry(storage_path=str(temp_registry_file))
        for skill in sample_skills:
            registry1.register(skill)
        registry1.save()
        
        # Load into new registry
        registry2 = SkillRegistry(storage_path=str(temp_registry_file))
        registry2.load()
        
        assert len(registry2.skills) == 3
        
        # Verify skill data integrity
        for original_skill in sample_skills:
            loaded_skill = registry2.get(original_skill.id)
            assert loaded_skill is not None
            assert loaded_skill.name == original_skill.name
            assert loaded_skill.domain == original_skill.domain
            assert loaded_skill.instruction == original_skill.instruction
    
    def test_load_empty_file_initializes_empty_registry(self, temp_registry_file):
        """Test loading from empty JSON file"""
        # Create empty JSON array
        with open(temp_registry_file, 'w') as f:
            json.dump([], f)
        
        registry = SkillRegistry(storage_path=str(temp_registry_file))
        registry.load()
        
        assert len(registry.skills) == 0
    
    def test_load_missing_file_does_not_error(self, temp_registry_file):
        """Test loading from nonexistent file doesn't crash"""
        registry = SkillRegistry(storage_path=str(temp_registry_file))
        
        # Should not raise exception
        registry.load()
        
        assert len(registry.skills) == 0
    
    def test_auto_save_on_register(self, temp_registry_file, sample_skills):
        """Test registry auto-saves after registration"""
        registry = SkillRegistry(storage_path=str(temp_registry_file))
        skill = sample_skills[0]
        
        registry.register(skill)
        
        # File should exist after registration
        assert temp_registry_file.exists()
        
        # Verify content
        with open(temp_registry_file, 'r') as f:
            data = json.load(f)
        assert len(data) == 1


class TestSkillRegistrySearch:
    """Test search and filtering operations"""
    
    def test_get_by_domain(self, sample_skills):
        """Test filtering skills by domain"""
        registry = SkillRegistry()
        for skill in sample_skills:
            registry.register(skill)
        
        coding_skills = registry.get_by_domain(SkillDomain.CODING)
        
        assert len(coding_skills) == 1
        assert coding_skills[0].domain == SkillDomain.CODING
    
    def test_get_by_domain_with_limit(self, sample_skills):
        """Test domain filtering with limit"""
        registry = SkillRegistry()
        
        # Add multiple skills in same domain
        for i in range(5):
            skill = Skill(
                name=f"Coding Skill {i}",
                domain=SkillDomain.CODING,
                instruction=f"Instruction {i}.",
                performance_score=0.5 + (i * 0.1)
            )
            registry.register(skill)
        
        # Get top 3
        top_skills = registry.get_by_domain(SkillDomain.CODING, limit=3)
        
        assert len(top_skills) == 3
        # Should be sorted by performance score (descending)
        assert top_skills[0].performance_score >= top_skills[1].performance_score
    
    def test_search_by_tags(self, sample_skills):
        """Test searching skills by tags"""
        registry = SkillRegistry()
        skill = sample_skills[0]
        skill.tags = ["python", "best-practices", "typing"]
        registry.register(skill)
        
        results = registry.search_by_tags(["python"])
        
        assert len(results) == 1
        assert results[0].id == skill.id
    
    def test_search_by_multiple_tags(self):
        """Test searching with multiple tags (AND logic)"""
        registry = SkillRegistry()
        
        skill1 = Skill(
            name="Skill 1",
            domain=SkillDomain.CODING,
            instruction="Use type hints for clarity.",
            tags=["python", "typing"]
        )
        skill2 = Skill(
            name="Skill 2",
            domain=SkillDomain.CODING,
            instruction="Write tests for all functions.",
            tags=["python", "testing"]
        )
        
        registry.register(skill1)
        registry.register(skill2)
        
        # Search for python AND typing
        results = registry.search_by_tags(["python", "typing"])
        
        assert len(results) == 1
        assert results[0].id == skill1.id
    
    def test_get_top_performers(self, sample_skills):
        """Test getting top-performing skills"""
        registry = SkillRegistry()
        for skill in sample_skills:
            registry.register(skill)
        
        top_skills = registry.get_top_performers(limit=2)
        
        assert len(top_skills) == 2
        # Should be sorted by performance score (descending)
        assert top_skills[0].performance_score == 0.92  # "Cite Sources"
        assert top_skills[1].performance_score == 0.85  # "Type Hints"


class TestSkillRegistryStatistics:
    """Test registry statistics and analytics"""
    
    def test_get_skill_count(self, sample_skills):
        """Test counting total skills"""
        registry = SkillRegistry()
        for skill in sample_skills:
            registry.register(skill)
        
        count = registry.count()
        
        assert count == 3
    
    def test_get_domain_distribution(self, sample_skills):
        """Test getting skill distribution by domain"""
        registry = SkillRegistry()
        for skill in sample_skills:
            registry.register(skill)
        
        distribution = registry.get_domain_distribution()
        
        assert distribution[SkillDomain.CODING] == 1
        assert distribution[SkillDomain.RESEARCH] == 1
        assert distribution[SkillDomain.ANALYSIS] == 1
    
    def test_get_average_performance_score(self, sample_skills):
        """Test calculating average performance score"""
        registry = SkillRegistry()
        for skill in sample_skills:
            registry.register(skill)
        
        avg_score = registry.get_average_score()
        
        expected = (0.85 + 0.92 + 0.78) / 3
        assert abs(avg_score - expected) < 0.01


class TestSkillRegistryEdgeCases:
    """Test edge cases and error conditions"""
    
    def test_register_duplicate_id_updates_existing(self, sample_skills):
        """Test registering skill with duplicate ID updates existing"""
        registry = SkillRegistry()
        skill = sample_skills[0]
        
        registry.register(skill)
        original_name = skill.name
        
        # Modify and re-register
        skill.name = "Updated Name"
        registry.register(skill)
        
        assert len(registry.skills) == 1
        retrieved = registry.get(skill.id)
        assert retrieved.name == "Updated Name"
    
    def test_empty_registry_statistics(self):
        """Test statistics on empty registry"""
        registry = SkillRegistry()
        
        assert registry.count() == 0
        assert registry.get_average_score() == 0.0
        assert registry.get_domain_distribution() == {}
    
    def test_registry_with_corrupted_json(self, temp_registry_file):
        """Test loading registry with malformed JSON"""
        # Write invalid JSON
        with open(temp_registry_file, 'w') as f:
            f.write("{ invalid json }")
        
        registry = SkillRegistry(storage_path=str(temp_registry_file))
        
        # Should handle gracefully (log error, start fresh)
        registry.load()
        
        assert len(registry.skills) == 0
