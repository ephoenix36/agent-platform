"""
Test suite for AgentRegistry

Tests agent registration, retrieval, performance tracking, and leaderboard functionality.
"""

import pytest
from datetime import datetime
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.agent_registry import Agent, AgentRegistry, AgentCategory


class TestAgent:
    """Test Agent dataclass."""
    
    def test_agent_creation(self):
        """Test creating an agent."""
        agent = Agent(
            name="Test Agent",
            description="A test agent",
            category=AgentCategory.RESEARCH,
            system_prompt="You are a test agent",
            model="gpt-4o",
            parameters={"temperature": 0.5},
            price_per_execution=0.10
        )
        
        assert agent.name == "Test Agent"
        assert agent.category == AgentCategory.RESEARCH
        assert agent.model == "gpt-4o"
        assert agent.price_per_execution == 0.10
        assert agent.performance_score == 0.0  # Default
        assert agent.is_active is True
    
    def test_agent_with_custom_performance(self):
        """Test agent with custom performance."""
        agent = Agent(
            name="Pro Agent",
            description="Professional agent",
            category=AgentCategory.ANALYSIS,
            system_prompt="Expert analyst",
            model="gpt-4o",
            parameters={},
            tasks_completed=100,
            success_rate=0.95,
            performance_score=85.0
        )
        
        assert agent.tasks_completed == 100
        assert agent.success_rate == 0.95
        assert agent.performance_score == 85.0


class TestAgentRegistry:
    """Test AgentRegistry functionality."""
    
    @pytest.fixture
    def registry(self):
        """Create a clean in-memory registry."""
        return AgentRegistry(storage_path=None)
    
    @pytest.fixture
    def sample_agent(self):
        """Create a sample agent."""
        return Agent(
            name="Research Pro",
            description="Professional researcher",
            category=AgentCategory.RESEARCH,
            system_prompt="You are an expert researcher",
            model="gpt-4o",
            parameters={"temperature": 0.3, "max_tokens": 2000},
            price_per_execution=0.15
        )
    
    def test_register_agent(self, registry, sample_agent):
        """Test agent registration."""
        agent_id = registry.register(sample_agent)
        
        assert agent_id is not None
        assert len(agent_id) > 0
        assert agent_id in registry.agents
        
        # Check agent was stored correctly
        stored_agent = registry.agents[agent_id]
        assert stored_agent.name == "Research Pro"
        assert stored_agent.category == AgentCategory.RESEARCH
    
    def test_get_agent(self, registry, sample_agent):
        """Test retrieving an agent."""
        agent_id = registry.register(sample_agent)
        retrieved = registry.get(agent_id)
        
        assert retrieved is not None
        assert retrieved.id == agent_id
        assert retrieved.name == "Research Pro"
    
    def test_get_nonexistent_agent(self, registry):
        """Test getting agent that doesn't exist."""
        result = registry.get("nonexistent_id")
        assert result is None
    
    def test_update_performance(self, registry, sample_agent):
        """Test updating agent performance."""
        agent_id = registry.register(sample_agent)
        
        # Update with successful execution
        registry.update_performance(
            agent_id=agent_id,
            task_successful=True,
            response_time=1.5,
            user_rating=5.0
        )
        
        agent = registry.get(agent_id)
        assert agent.tasks_completed >= 1
        assert agent.performance_score > 0.0  # Should improve from initial
    
    def test_record_earnings(self, registry, sample_agent):
        """Test recording creator earnings."""
        agent_id = registry.register(sample_agent)
        
        registry.record_earnings(agent_id, 10.50)
        registry.record_earnings(agent_id, 5.25)
        
        agent = registry.get(agent_id)
        assert agent.total_earnings == 15.75
    
    def test_get_by_category(self, registry):
        """Test getting agents by category."""
        # Register agents in different categories
        research_agent1 = Agent(
            name="Researcher 1",
            description="Research agent 1",
            category=AgentCategory.RESEARCH,
            system_prompt="Research",
            model="gpt-4o",
            parameters={}
        )
        
        research_agent2 = Agent(
            name="Researcher 2",
            description="Research agent 2",
            category=AgentCategory.RESEARCH,
            system_prompt="Research",
            model="gpt-4o",
            parameters={}
        )
        
        analysis_agent = Agent(
            name="Analyst",
            description="Analysis agent",
            category=AgentCategory.ANALYSIS,
            system_prompt="Analyze",
            model="gpt-4o",
            parameters={}
        )
        
        registry.register(research_agent1)
        registry.register(research_agent2)
        registry.register(analysis_agent)
        
        # Get research agents
        research_agents = registry.get_by_category(AgentCategory.RESEARCH)
        assert len(research_agents) == 2
        
        # Get analysis agents
        analysis_agents = registry.get_by_category(AgentCategory.ANALYSIS)
        assert len(analysis_agents) == 1
    
    def test_leaderboard(self, registry):
        """Test leaderboard generation."""
        # Create agents with different performance
        agents = [
            Agent(
                name=f"Agent {i}",
                description=f"Agent {i}",
                category=AgentCategory.RESEARCH,
                system_prompt="Test",
                model="gpt-4o",
                parameters={}
            )
            for i in range(5)
        ]
        
        # Register and set different scores
        for i, agent in enumerate(agents):
            agent_id = registry.register(agent)
            
            # Give different performance scores
            for _ in range(i + 1):
                registry.update_performance(
                    agent_id=agent_id,
                    task_successful=True,
                    response_time=1.0,
                    user_rating=5.0
                )
        
        # Get leaderboard
        leaderboard = registry.get_leaderboard(limit=3)
        
        assert len(leaderboard) == 3
        assert leaderboard[0]['rank'] == 1
        assert leaderboard[1]['rank'] == 2
        assert leaderboard[2]['rank'] == 3
        
        # Scores should be descending
        assert (leaderboard[0]['performance_score'] >= 
                leaderboard[1]['performance_score'] >= 
                leaderboard[2]['performance_score'])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
