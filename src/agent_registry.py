"""
Agent Registry - Core component of the Agent Marketplace

Manages agent registration, retrieval, and performance tracking.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum
import json
import uuid


class AgentCategory(str, Enum):
    """Categories of AI agents"""
    RESEARCH = "research"
    CODING = "coding"
    DESIGN = "design"
    MARKETING = "marketing"
    WRITING = "writing"
    ANALYSIS = "analysis"
    CUSTOMER_SERVICE = "customer-service"
    PERSONAL_ASSISTANT = "personal-assistant"
    EDUCATION = "education"
    IMAGE_PROCESSING = "image-processing"
    OTHER = "other"


@dataclass
class Agent:
    """An AI agent in the marketplace"""
    
    # Identity
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    creator: str = ""
    category: AgentCategory = AgentCategory.OTHER
    version: str = "1.0.0"
    
    # Performance metrics
    performance_score: float = 0.0  # 0-100
    tasks_completed: int = 0
    success_rate: float = 0.0  # 0-1
    avg_response_time: float = 0.0  # seconds
    user_rating: float = 0.0  # 1-5 stars
    
    # Economics
    price_per_execution: float = 0.01  # USD
    total_earnings: float = 0.0
    revenue_30d: float = 0.0
    
    # Evolution tracking
    generation: int = 0
    parent_agents: List[str] = field(default_factory=list)
    mutations: List[str] = field(default_factory=list)
    
    # Implementation
    system_prompt: str = ""
    tools: List[str] = field(default_factory=list)
    model: str = "gpt-4-turbo"
    parameters: Dict[str, Any] = field(default_factory=dict)
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        data = asdict(self)
        data['category'] = self.category.value
        data['created_at'] = self.created_at.isoformat()
        data['updated_at'] = self.updated_at.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Agent':
        """Create agent from dictionary"""
        if 'category' in data and isinstance(data['category'], str):
            data['category'] = AgentCategory(data['category'])
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        return cls(**data)


class AgentRegistry:
    """
    Central registry for all agents in the marketplace
    
    Provides:
    - Agent registration and storage
    - Performance tracking
    - Leaderboard generation
    - Search and filtering
    """
    
    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize registry
        
        Args:
            storage_path: Path to JSON file for persistence
        """
        self.agents: Dict[str, Agent] = {}
        self.storage_path = storage_path
        
        if storage_path:
            self.load()
    
    def register(self, agent: Agent) -> str:
        """
        Register a new agent or update existing
        
        Args:
            agent: Agent to register
            
        Returns:
            Agent ID
        """
        agent.updated_at = datetime.now()
        self.agents[agent.id] = agent
        self.save()
        return agent.id
    
    def get(self, agent_id: str) -> Optional[Agent]:
        """Get agent by ID"""
        return self.agents.get(agent_id)
    
    def get_by_category(self, category: AgentCategory, limit: int = 10) -> List[Agent]:
        """
        Get agents by category, sorted by performance
        
        Args:
            category: Agent category
            limit: Maximum number of agents
            
        Returns:
            List of agents
        """
        category_agents = [
            agent for agent in self.agents.values()
            if agent.category == category and agent.is_active
        ]
        
        # Sort by performance score (descending)
        category_agents.sort(key=lambda a: a.performance_score, reverse=True)
        
        return category_agents[:limit]
    
    def get_top_performers(self, limit: int = 10) -> List[Agent]:
        """Get top performing agents across all categories"""
        active_agents = [a for a in self.agents.values() if a.is_active]
        active_agents.sort(key=lambda a: a.performance_score, reverse=True)
        return active_agents[:limit]
    
    def search(
        self,
        query: str = "",
        category: Optional[AgentCategory] = None,
        min_score: float = 0.0,
        limit: int = 20
    ) -> List[Agent]:
        """
        Search agents with filters
        
        Args:
            query: Search query (matches name/description)
            category: Filter by category
            min_score: Minimum performance score
            limit: Maximum results
            
        Returns:
            Matching agents
        """
        results = []
        query_lower = query.lower()
        
        for agent in self.agents.values():
            if not agent.is_active:
                continue
            
            # Category filter
            if category and agent.category != category:
                continue
            
            # Score filter
            if agent.performance_score < min_score:
                continue
            
            # Text search
            if query:
                searchable = f"{agent.name} {agent.description}".lower()
                if query_lower not in searchable:
                    continue
            
            results.append(agent)
        
        # Sort by performance
        results.sort(key=lambda a: a.performance_score, reverse=True)
        
        return results[:limit]
    
    def update_performance(
        self,
        agent_id: str,
        task_successful: bool,
        response_time: float,
        user_rating: Optional[float] = None
    ) -> None:
        """
        Update agent performance metrics
        
        Args:
            agent_id: Agent ID
            task_successful: Whether task succeeded
            response_time: Time taken in seconds
            user_rating: Optional 1-5 star rating
        """
        agent = self.agents.get(agent_id)
        if not agent:
            return
        
        # Update task count
        agent.tasks_completed += 1
        
        # Update success rate (exponential moving average)
        alpha = 0.1  # Weighting factor
        current_success = 1.0 if task_successful else 0.0
        if agent.success_rate == 0.0:
            agent.success_rate = current_success
        else:
            agent.success_rate = alpha * current_success + (1 - alpha) * agent.success_rate
        
        # Update avg response time
        if agent.avg_response_time == 0.0:
            agent.avg_response_time = response_time
        else:
            agent.avg_response_time = alpha * response_time + (1 - alpha) * agent.avg_response_time
        
        # Update user rating
        if user_rating is not None:
            if agent.user_rating == 0.0:
                agent.user_rating = user_rating
            else:
                agent.user_rating = alpha * user_rating + (1 - alpha) * agent.user_rating
        
        # Calculate overall performance score (0-100)
        agent.performance_score = self._calculate_performance_score(agent)
        
        agent.updated_at = datetime.now()
        self.save()
    
    def _calculate_performance_score(self, agent: Agent) -> float:
        """
        Calculate composite performance score
        
        Weights:
        - Success rate: 40%
        - User rating: 30%
        - Response time: 20%
        - Volume: 10%
        """
        # Success rate (0-100)
        success_component = agent.success_rate * 40
        
        # User rating (scaled to 0-30)
        rating_component = (agent.user_rating / 5.0) * 30
        
        # Response time (faster is better, exponential decay)
        # Assume 5 seconds is "perfect", 60 seconds is "poor"
        import math
        time_score = math.exp(-agent.avg_response_time / 10.0) if agent.avg_response_time > 0 else 1.0
        time_component = time_score * 20
        
        # Volume (logarithmic scale)
        volume_score = min(math.log10(agent.tasks_completed + 1) / 3.0, 1.0)  # Log scale, cap at 1000
        volume_component = volume_score * 10
        
        total_score = success_component + rating_component + time_component + volume_component
        
        return round(total_score, 2)
    
    def record_earnings(self, agent_id: str, amount: float) -> None:
        """Record earnings for an agent"""
        agent = self.agents.get(agent_id)
        if agent:
            agent.total_earnings += amount
            agent.revenue_30d += amount  # Simplified - should use time window
            agent.updated_at = datetime.now()
            self.save()
    
    def get_leaderboard(self, category: Optional[AgentCategory] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get leaderboard with rankings
        
        Args:
            category: Optional category filter
            limit: Maximum entries
            
        Returns:
            List of agent summaries with rankings
        """
        # Filter agents
        if category:
            agents = self.get_by_category(category, limit=1000)
        else:
            agents = self.get_top_performers(limit=1000)
        
        # Create leaderboard entries
        leaderboard = []
        for rank, agent in enumerate(agents[:limit], 1):
            leaderboard.append({
                'rank': rank,
                'id': agent.id,
                'name': agent.name,
                'category': agent.category.value,
                'performance_score': agent.performance_score,
                'tasks_completed': agent.tasks_completed,
                'success_rate': f"{agent.success_rate * 100:.1f}%",
                'user_rating': f"{agent.user_rating:.1f}/5.0",
                'total_earnings': f"${agent.total_earnings:.2f}"
            })
        
        return leaderboard
    
    def save(self) -> None:
        """Save registry to file"""
        if not self.storage_path:
            return
        
        data = {
            agent_id: agent.to_dict()
            for agent_id, agent in self.agents.items()
        }
        
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def load(self) -> None:
        """Load registry from file"""
        if not self.storage_path:
            return
        
        try:
            with open(self.storage_path, 'r') as f:
                data = json.load(f)
            
            self.agents = {
                agent_id: Agent.from_dict(agent_data)
                for agent_id, agent_data in data.items()
            }
        except FileNotFoundError:
            # First run, no data yet
            pass


# Example usage and testing
if __name__ == "__main__":
    # Create registry
    registry = AgentRegistry(storage_path="agents_registry.json")
    
    # Create sample agents
    research_agent = Agent(
        name="Deep Research Pro",
        description="Advanced research agent with web search and synthesis capabilities",
        creator="system",
        category=AgentCategory.RESEARCH,
        system_prompt="You are an expert research assistant...",
        tools=["web_search", "academic_search", "synthesis"],
        price_per_execution=0.10
    )
    
    coding_agent = Agent(
        name="Code Optimizer",
        description="Evolutionary code optimization using LLMs",
        creator="system",
        category=AgentCategory.CODING,
        system_prompt="You are an expert at optimizing code...",
        tools=["code_analysis", "benchmark", "optimize"],
        price_per_execution=0.15
    )
    
    # Register agents
    research_id = registry.register(research_agent)
    coding_id = registry.register(coding_agent)
    
    print(f"Registered agents: {research_id}, {coding_id}")
    
    # Simulate some usage
    registry.update_performance(research_id, task_successful=True, response_time=3.5, user_rating=4.8)
    registry.update_performance(research_id, task_successful=True, response_time=2.8, user_rating=5.0)
    registry.update_performance(coding_id, task_successful=True, response_time=5.2, user_rating=4.5)
    
    registry.record_earnings(research_id, 0.10)
    registry.record_earnings(research_id, 0.10)
    registry.record_earnings(coding_id, 0.15)
    
    # Get leaderboard
    leaderboard = registry.get_leaderboard()
    
    print("\n🏆 AGENT LEADERBOARD")
    print("=" * 80)
    for entry in leaderboard:
        print(f"{entry['rank']}. {entry['name']} ({entry['category']})")
        print(f"   Score: {entry['performance_score']}/100 | Tasks: {entry['tasks_completed']} | "
              f"Success: {entry['success_rate']} | Rating: {entry['user_rating']} | "
              f"Earnings: {entry['total_earnings']}")
        print()
    
    # Search
    results = registry.search(query="research", min_score=50.0)
    print(f"\n🔍 Search 'research' (min score 50): {len(results)} results")
    for agent in results:
        print(f"   - {agent.name} (score: {agent.performance_score})")
