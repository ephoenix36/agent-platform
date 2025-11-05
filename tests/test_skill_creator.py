"""
Integration tests for Skill Creator Meta-Agent

Tests cover:
- Skill generation from user requests
- Output validation (format, quality)
- Domain-appropriate skill creation
- Compliance with UpgradePrompt Apex Standard
"""

import pytest
import json
from pathlib import Path
from src.skills.models import Skill, SkillDomain


@pytest.fixture
def skill_creator_definition():
    """Load Skill Creator agent definition"""
    agent_path = Path("collections/meta-agents/skills/skill-creator.json")
    
    assert agent_path.exists(), "Skill Creator agent definition must exist"
    
    with open(agent_path, 'r', encoding='utf-8') as f:
        return json.load(f)


class TestSkillCreatorDefinition:
    """Test Skill Creator agent structure and prompting"""
    
    def test_agent_definition_exists(self):
        """Test Skill Creator JSON exists"""
        agent_path = Path("collections/meta-agents/skills/skill-creator.json")
        assert agent_path.exists()
    
    def test_required_fields_present(self, skill_creator_definition):
        """Test all required fields are present"""
        required_fields = [
            "id", "name", "description", "collection", "subsection",
            "version", "systemPrompt", "userPromptTemplate", "examples"
        ]
        
        for field in required_fields:
            assert field in skill_creator_definition, f"Missing required field: {field}"
    
    def test_agent_identity(self, skill_creator_definition):
        """Test agent has proper identity configuration"""
        assert skill_creator_definition["id"] == "skill-creator"
        assert skill_creator_definition["collection"] == "meta-agents"
        assert skill_creator_definition["subsection"] == "skills"
        assert "Skill Creator" in skill_creator_definition["name"]
    
    def test_system_prompt_follows_apex_standard(self, skill_creator_definition):
        """Test systemPrompt follows UpgradePrompt Apex Standard"""
        system_prompt = skill_creator_definition["systemPrompt"]
        
        # Check for identity casting
        assert any(
            keyword in system_prompt
            for keyword in ["You are", "Your role", "Your mission", "Your singular purpose"]
        ), "Missing identity casting"
        
        # Check for clear directives (case-insensitive, handle markdown)
        assert "responsibilities" in system_prompt.lower(), "Missing responsibilities section"
        
        # Check for output format specification
        assert "Output" in system_prompt or "Format" in system_prompt or "OUTPUT FORMAT" in system_prompt
        
        # Check for constraints/guardrails
        assert any(
            keyword in system_prompt.lower()
            for keyword in ["must", "never", "always", "required", "forbidden"]
        ), "Missing defensive constraints"
        
        # Check for masterful informativeness (specific, rich vocabulary)
        assert len(system_prompt) > 500, "Prompt too brief for Apex Standard"
        
        # Check for purpose-driven structure (markdown headers or bold)
        assert "##" in system_prompt or "**" in system_prompt, "Missing structural delimiters"
    
    def test_examples_present_and_valid(self, skill_creator_definition):
        """Test agent includes high-quality examples"""
        examples = skill_creator_definition["examples"]
        
        assert len(examples) >= 3, "Should have at least 3 examples (diverse domains)"
        
        for example in examples:
            assert "input" in example
            assert "output" in example
            
            # Verify output is parseable as a skill
            output = example["output"]
            assert "instruction" in output or "Instruction:" in output
            assert len(output) > 20, "Example output too brief"
    
    def test_examples_span_multiple_domains(self, skill_creator_definition):
        """Test examples cover diverse skill domains"""
        examples = skill_creator_definition["examples"]
        
        # Extract domains from examples
        domains_covered = set()
        for example in examples:
            input_text = example["input"].lower()
            
            if "coding" in input_text or "code" in input_text or "programming" in input_text:
                domains_covered.add("coding")
            if "research" in input_text or "academic" in input_text:
                domains_covered.add("research")
            if "analysis" in input_text or "data" in input_text:
                domains_covered.add("analysis")
            if "communication" in input_text or "writing" in input_text:
                domains_covered.add("communication")
        
        assert len(domains_covered) >= 3, "Examples should span at least 3 domains"
    
    def test_user_prompt_template_defined(self, skill_creator_definition):
        """Test user prompt template has placeholders"""
        template = skill_creator_definition["userPromptTemplate"]
        
        assert "{" in template and "}" in template, "Should use placeholders"
        assert len(template) > 50, "Template should provide context"


class TestSkillCreatorOutput:
    """Test expected outputs from Skill Creator"""
    
    def test_generated_skill_structure(self):
        """Test generated skill has required structure"""
        # This would be tested via actual LLM call in integration test
        # For now, verify example outputs
        
        example_skill_json = {
            "name": "Type Hints Best Practice",
            "domain": "coding",
            "instruction": "Use type hints on all function signatures for clarity and IDE support.",
            "applicable_to": ["agents", "tools"],
            "tags": ["python", "typing", "best-practices"]
        }
        
        # Verify it can be parsed as a Skill
        skill = Skill.from_dict(example_skill_json)
        
        assert skill.name == "Type Hints Best Practice"
        assert skill.domain == SkillDomain.CODING
        assert len(skill.instruction) >= 10  # Meets minimum length
        assert len(skill.instruction) <= 500  # Stays concise
    
    def test_generated_skill_meets_quality_standards(self):
        """Test generated skills are high-quality"""
        example_skill_json = {
            "name": "Citation Standards",
            "domain": "research",
            "instruction": "Always cite sources using author-date format (APA style) with complete bibliographic information.",
            "applicable_to": ["agents"],
            "tags": ["research", "academic", "citation"]
        }
        
        skill = Skill.from_dict(example_skill_json)
        
        # Quality checks
        assert not any(
            vague in skill.instruction.lower()
            for vague in ["maybe", "possibly", "perhaps", "somewhat"]
        ), "Skill should be specific, not vague"
        
        # Should be actionable (imperative mood)
        assert any(
            verb in skill.instruction
            for verb in ["Use", "Always", "Never", "Ensure", "Include", "Apply"]
        ), "Skill should be actionable"
    
    def test_skill_density_validation(self):
        """Test skills are information-dense (1-2 sentences)"""
        valid_skill = {
            "name": "Error Handling",
            "domain": "coding",
            "instruction": "Wrap risky operations in try-except blocks with specific exception types."
        }
        
        skill = Skill.from_dict(valid_skill)
        
        # Count sentences
        import re
        sentences = [s for s in re.split(r'[.!?]+', skill.instruction) if s.strip()]
        
        assert len(sentences) <= 2, "Should be 1-2 sentences"
        assert len(skill.instruction) < 300, "Should be concise"


class TestSkillCreatorCoverage:
    """Test Skill Creator covers all required domains"""
    
    def test_can_generate_coding_skills(self, skill_creator_definition):
        """Test examples include coding domain"""
        examples = skill_creator_definition["examples"]
        
        coding_examples = [
            ex for ex in examples
            if "coding" in ex["input"].lower() or "code" in ex["input"].lower()
        ]
        
        assert len(coding_examples) >= 1, "Should have coding examples"
    
    def test_can_generate_research_skills(self, skill_creator_definition):
        """Test examples include research domain"""
        examples = skill_creator_definition["examples"]
        
        research_examples = [
            ex for ex in examples
            if "research" in ex["input"].lower() or "academic" in ex["input"].lower()
        ]
        
        assert len(research_examples) >= 1, "Should have research examples"
    
    def test_can_generate_analysis_skills(self, skill_creator_definition):
        """Test examples include analysis domain"""
        examples = skill_creator_definition["examples"]
        
        analysis_examples = [
            ex for ex in examples
            if "analysis" in ex["input"].lower() or "data" in ex["input"].lower()
        ]
        
        assert len(analysis_examples) >= 1, "Should have analysis examples"


class TestSkillCreatorMetadata:
    """Test agent metadata and configuration"""
    
    def test_tags_include_meta_and_skills(self, skill_creator_definition):
        """Test agent is properly tagged"""
        tags = skill_creator_definition.get("tags", [])
        
        assert "meta-agent" in tags
        assert "skills" in tags or "skill-creator" in tags
    
    def test_difficulty_is_advanced(self, skill_creator_definition):
        """Test agent difficulty is appropriate"""
        difficulty = skill_creator_definition.get("difficulty", "")
        
        assert difficulty == "advanced", "Skill creation requires advanced prompting"
    
    def test_version_follows_semver(self, skill_creator_definition):
        """Test version is semantic version"""
        version = skill_creator_definition["version"]
        
        import re
        assert re.match(r"^\d+\.\d+\.\d+$", version), "Version must be semver format"
