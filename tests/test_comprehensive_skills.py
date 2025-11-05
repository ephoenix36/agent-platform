"""
Tests for comprehensive skill architecture with rules, patterns, and learning
"""

import pytest
from src.skills.models import Skill, SkillRule, SkillDomain


class TestSkillRule:
    """Test SkillRule model"""
    
    def test_create_basic_rule(self):
        """Test creating a basic rule"""
        rule = SkillRule(
            directive="Use keyboard shortcuts for faster execution.",
            priority=80
        )
        
        assert rule.directive == "Use keyboard shortcuts for faster execution."
        assert rule.priority == 80
        assert rule.id is not None
    
    def test_rule_with_activation_patterns(self):
        """Test rule with glob patterns"""
        rule = SkillRule(
            directive="Verify layer selection before applying filters.",
            priority=90,
            activation_patterns=["**/*.psd", "tasks/image-editing/*"]
        )
        
        assert len(rule.activation_patterns) == 2
        assert "**/*.psd" in rule.activation_patterns
    
    def test_rule_with_condition(self):
        """Test rule with activation condition"""
        rule = SkillRule(
            directive="Take snapshot for complex operations.",
            priority=85,
            condition="task.complexity > 0.7"
        )
        
        assert rule.condition == "task.complexity > 0.7"


class TestComprehensiveSkill:
    """Test comprehensive skill architecture"""
    
    def test_create_skill_with_system_prompt(self):
        """Test creating skill with full system prompt"""
        skill = Skill(
            name="Test Skill",
            domain=SkillDomain.CODING,
            system_prompt="You are an expert in test-driven development with deep knowledge of pytest and unit testing best practices.",
            rules=[
                SkillRule(
                    directive="Write tests before implementation.",
                    priority=90
                )
            ]
        )
        
        assert len(skill.system_prompt) > 50
        assert len(skill.rules) == 1
    
    def test_skill_with_activation_patterns(self):
        """Test skill with glob activation patterns"""
        skill = Skill(
            name="Photoshop Expert",
            domain=SkillDomain.CODING,
            system_prompt="Expert Photoshop automation.",
            activation_patterns=["**/*.psd", "tasks/image-editing/*"]
        )
        
        assert len(skill.activation_patterns) == 2
    
    def test_skill_with_tool_requirements(self):
        """Test skill with required and optional tools"""
        skill = Skill(
            name="Desktop Automation",
            domain=SkillDomain.CODING,
            system_prompt="Desktop automation expert.",
            required_tools=["desktop-control", "screen-capture"],
            optional_tools=["ocr", "image-comparison"]
        )
        
        assert "desktop-control" in skill.required_tools
        assert "ocr" in skill.optional_tools
    
    def test_skill_should_activate_with_patterns(self):
        """Test skill activation based on file patterns"""
        skill = Skill(
            name="PSD Handler",
            domain=SkillDomain.CODING,
            system_prompt="Handles PSD files.",
            activation_patterns=["**/*.psd"]
        )
        
        # Should activate for PSD files
        assert skill.should_activate({'file_path': 'project/image.psd'})
        assert skill.should_activate({'file_path': 'nested/folder/design.psd'})
        
        # Should not activate for other files
        assert not skill.should_activate({'file_path': 'project/image.jpg'})
    
    def test_skill_should_activate_with_conditions(self):
        """Test skill activation based on conditions"""
        skill = Skill(
            name="Complex Task Handler",
            domain=SkillDomain.CODING,
            system_prompt="Handles complex tasks.",
            activation_conditions=["task.complexity > 0.5"]
        )
        
        # Should activate for complex tasks
        assert skill.should_activate({
            'task': {'complexity': 0.8}
        })
        
        # Should not activate for simple tasks
        assert not skill.should_activate({
            'task': {'complexity': 0.3}
        })
    
    def test_get_active_rules_by_pattern(self):
        """Test getting active rules based on context"""
        skill = Skill(
            name="Test Skill",
            domain=SkillDomain.CODING,
            system_prompt="Test skill.",
            rules=[
                SkillRule(
                    directive="Rule 1 for PSD files.",
                    priority=90,
                    activation_patterns=["**/*.psd"]
                ),
                SkillRule(
                    directive="Rule 2 always active.",
                    priority=80
                ),
                SkillRule(
                    directive="Rule 3 for JPEG files.",
                    priority=70,
                    activation_patterns=["**/*.jpg"]
                )
            ]
        )
        
        # Context with PSD file
        active_rules = skill.get_active_rules({'file_path': 'test.psd'})
        
        # Should have rules 1 and 2 (rule 3 is for JPG)
        assert len(active_rules) == 2
        assert active_rules[0].priority == 90  # Sorted by priority
        assert active_rules[1].priority == 80
    
    def test_get_active_rules_by_condition(self):
        """Test getting active rules based on conditions"""
        skill = Skill(
            name="Test Skill",
            domain=SkillDomain.CODING,
            system_prompt="Test skill.",
            rules=[
                SkillRule(
                    directive="Complex task rule.",
                    priority=95,
                    condition="task.complexity > 0.7"
                ),
                SkillRule(
                    directive="Always active rule.",
                    priority=85
                )
            ]
        )
        
        # High complexity context
        active_rules = skill.get_active_rules({
            'task': {'complexity': 0.9}
        })
        
        assert len(active_rules) == 2
        
        # Low complexity context
        active_rules = skill.get_active_rules({
            'task': {'complexity': 0.3}
        })
        
        assert len(active_rules) == 1  # Only always-active rule
    
    def test_add_and_remove_rules(self):
        """Test adding and removing rules dynamically"""
        skill = Skill(
            name="Test Skill",
            domain=SkillDomain.CODING,
            system_prompt="Test skill."
        )
        
        assert len(skill.rules) == 0
        
        # Add rule
        rule = SkillRule(
            directive="New rule.",
            priority=75
        )
        skill.add_rule(rule)
        
        assert len(skill.rules) == 1
        
        # Remove rule
        success = skill.remove_rule(rule.id)
        
        assert success is True
        assert len(skill.rules) == 0
    
    def test_record_usage(self):
        """Test recording skill usage for learning"""
        skill = Skill(
            name="Test Skill",
            domain=SkillDomain.CODING,
            system_prompt="Test skill."
        )
        
        assert skill.usage_count == 0
        assert skill.success_rate == 0.0
        
        # Record successful usage
        skill.record_usage(success=True, execution_time=1.5)
        
        assert skill.usage_count == 1
        assert skill.success_rate == 1.0
        assert skill.avg_execution_time == 1.5
        
        # Record failed usage
        skill.record_usage(success=False, execution_time=2.0)
        
        assert skill.usage_count == 2
        assert skill.success_rate == 0.5  # 1 success, 1 failure
        assert skill.avg_execution_time == 1.75  # Average of 1.5 and 2.0
    
    def test_record_usage_with_learning_data(self):
        """Test recording usage with learned data"""
        skill = Skill(
            name="Test Skill",
            domain=SkillDomain.CODING,
            system_prompt="Test skill."
        )
        
        # Record usage with learned data
        skill.record_usage(
            success=True,
            execution_time=1.0,
            learned_data={
                'tool_used': 'desktop-control',
                'shortcut_sequence': ['Ctrl+J', 'Ctrl+T']
            }
        )
        
        assert 'tool_used' in skill.learning_data
        assert 'shortcut_sequence' in skill.learning_data
    
    def test_evolve_skill_with_new_prompt(self):
        """Test evolving skill with updated system prompt"""
        original_skill = Skill(
            name="Original Skill",
            domain=SkillDomain.CODING,
            system_prompt="Original prompt.",
            version="1.0.0",
            generation=0
        )
        
        evolved_skill = original_skill.evolve(
            new_system_prompt="Improved prompt with more detail.",
            mutator_id="skill-mutator"
        )
        
        assert evolved_skill.system_prompt == "Improved prompt with more detail."
        assert evolved_skill.version == "1.0.1"
        assert evolved_skill.generation == 1
        assert original_skill.id in evolved_skill.parent_skills
    
    def test_evolve_skill_with_new_rules(self):
        """Test evolving skill with updated rules"""
        original_skill = Skill(
            name="Original Skill",
            domain=SkillDomain.CODING,
            system_prompt="Test prompt.",
            rules=[
                SkillRule(directive="Original rule.", priority=80)
            ]
        )
        
        new_rules = [
            SkillRule(directive="Evolved rule 1.", priority=90),
            SkillRule(directive="Evolved rule 2.", priority=85)
        ]
        
        evolved_skill = original_skill.evolve(new_rules=new_rules)
        
        assert len(evolved_skill.rules) == 2
        assert evolved_skill.rules[0].directive == "Evolved rule 1."
    
    def test_skill_with_tool_configurations(self):
        """Test skill with tool-specific configurations"""
        skill = Skill(
            name="Automation Expert",
            domain=SkillDomain.CODING,
            system_prompt="Expert automation.",
            tool_configurations={
                "desktop-control": {
                    "default_wait_ms": 200,
                    "click_precision_px": 2
                },
                "mouse-automation": {
                    "movement_speed": "smooth"
                }
            }
        )
        
        assert "desktop-control" in skill.tool_configurations
        assert skill.tool_configurations["desktop-control"]["default_wait_ms"] == 200
    
    def test_backward_compatibility_with_instruction(self):
        """Test legacy instruction field still works"""
        skill = Skill(
            name="Legacy Skill",
            domain=SkillDomain.CODING,
            instruction="Use type hints on all functions."
        )
        
        assert skill.instruction == "Use type hints on all functions."
        assert skill.system_prompt == ""  # Can be empty now
    
    def test_vague_language_validation(self):
        """Test that vague language is rejected"""
        with pytest.raises(ValueError, match="vague language"):
            Skill(
                name="Vague Skill",
                domain=SkillDomain.CODING,
                system_prompt="You should maybe possibly try to do something kind of good."
            )
    
    def test_system_prompt_min_length_validation(self):
        """Test system prompt minimum length when provided"""
        with pytest.raises(ValueError, match="too brief"):
            Skill(
                name="Brief Skill",
                domain=SkillDomain.CODING,
                system_prompt="Too short"
            )
    
    def test_skill_string_representation(self):
        """Test string representations"""
        skill = Skill(
            name="Test Skill",
            domain=SkillDomain.CODING,
            system_prompt="You are an expert in testing with deep knowledge of pytest and best practices.",
            rules=[
                SkillRule(directive="Rule 1.", priority=90),
                SkillRule(directive="Rule 2.", priority=80)
            ]
        )
        
        str_repr = str(skill)
        assert "[coding]" in str_repr
        assert "Test Skill" in str_repr
        assert "2 rules" in str_repr
        
        repr_str = repr(skill)
        assert "Skill(" in repr_str
        assert "rules=2" in repr_str
