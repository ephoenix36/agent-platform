"""
Task Execution Engine - Core marketplace component

Handles task submission, agent selection, parallel execution,
result evaluation, and winner determination.
"""

import asyncio
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, Callable
from datetime import datetime
from enum import Enum
import json
import time

try:
    from .agent_registry import Agent, AgentRegistry, AgentCategory
except ImportError:
    from agent_registry import Agent, AgentRegistry, AgentCategory


class TaskStatus(str, Enum):
    """Task execution status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class TaskResult:
    """Result from a single agent execution"""
    agent_id: str
    agent_name: str
    output: str
    execution_time: float  # seconds
    success: bool
    error: Optional[str] = None
    
    # Quality metrics (0-1)
    quality_score: float = 0.0
    relevance_score: float = 0.0
    completeness_score: float = 0.0
    
    # Calculated fitness
    fitness_score: float = 0.0
    
    def calculate_fitness(self, weights: Optional[Dict[str, float]] = None) -> float:
        """
        Calculate multi-objective fitness score
        
        Default weights:
        - Quality: 40%
        - Speed: 20%
        - Relevance: 20%
        - Completeness: 20%
        """
        if weights is None:
            weights = {
                'quality': 0.4,
                'speed': 0.2,
                'relevance': 0.2,
                'completeness': 0.2
            }
        
        # Speed score (faster is better, exponential decay)
        import math
        speed_score = math.exp(-self.execution_time / 10.0)  # 10 seconds is baseline
        
        # Combined fitness
        self.fitness_score = (
            weights['quality'] * self.quality_score +
            weights['speed'] * speed_score +
            weights['relevance'] * self.relevance_score +
            weights['completeness'] * self.completeness_score
        )
        
        return self.fitness_score


@dataclass
class Task:
    """A task submitted to the marketplace"""
    id: str
    user_id: str
    description: str
    category: AgentCategory
    
    # Execution
    status: TaskStatus = TaskStatus.PENDING
    selected_agents: List[str] = field(default_factory=list)
    results: List[TaskResult] = field(default_factory=list)
    winner_agent_id: Optional[str] = None
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Configuration
    max_agents: int = 5  # How many agents to run
    timeout: float = 60.0  # Max execution time per agent
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'description': self.description,
            'category': self.category.value,
            'status': self.status.value,
            'selected_agents': self.selected_agents,
            'results': [
                {
                    'agent_id': r.agent_id,
                    'agent_name': r.agent_name,
                    'output': r.output[:500] + '...' if len(r.output) > 500 else r.output,
                    'execution_time': r.execution_time,
                    'success': r.success,
                    'fitness_score': r.fitness_score
                }
                for r in self.results
            ],
            'winner_agent_id': self.winner_agent_id,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class TaskExecutionEngine:
    """
    Core engine for executing tasks across multiple agents
    
    Features:
    - Intelligent agent selection
    - Parallel execution
    - Multi-objective evaluation
    - Winner determination
    - Performance tracking
    """
    
    def __init__(self, registry: AgentRegistry):
        """
        Initialize execution engine
        
        Args:
            registry: Agent registry for accessing agents
        """
        self.registry = registry
        self.tasks: Dict[str, Task] = {}
    
    async def submit_task(
        self,
        user_id: str,
        description: str,
        category: Optional[AgentCategory] = None,
        max_agents: int = 5
    ) -> Task:
        """
        Submit a new task for execution
        
        Args:
            user_id: User submitting the task
            description: Task description
            category: Optional category (auto-detected if None)
            max_agents: Number of agents to run
            
        Returns:
            Task object
        """
        # Auto-detect category if not provided
        if category is None:
            category = self._detect_category(description)
        
        # Create task
        import uuid
        task = Task(
            id=str(uuid.uuid4()),
            user_id=user_id,
            description=description,
            category=category,
            max_agents=max_agents
        )
        
        # Select agents
        task.selected_agents = self._select_agents(category, max_agents)
        
        # Store task
        self.tasks[task.id] = task
        
        return task
    
    def _detect_category(self, description: str) -> AgentCategory:
        """
        Auto-detect task category from description
        
        Simple keyword-based classification (can be improved with ML)
        """
        description_lower = description.lower()
        
        keywords = {
            AgentCategory.RESEARCH: ['research', 'find', 'analyze', 'study', 'investigate'],
            AgentCategory.CODING: ['code', 'program', 'debug', 'implement', 'algorithm'],
            AgentCategory.WRITING: ['write', 'article', 'blog', 'content', 'draft'],
            AgentCategory.DESIGN: ['design', 'layout', 'ui', 'ux', 'interface'],
            AgentCategory.ANALYSIS: ['analyze', 'data', 'metrics', 'statistics', 'insights'],
            AgentCategory.IMAGE_PROCESSING: ['image', 'photo', 'picture', 'visual', 'blur', 'detect']
        }
        
        # Count keyword matches
        scores = {}
        for cat, words in keywords.items():
            scores[cat] = sum(1 for word in words if word in description_lower)
        
        # Return category with most matches
        if max(scores.values()) > 0:
            return max(scores.items(), key=lambda x: x[1])[0]
        
        return AgentCategory.OTHER
    
    def _select_agents(self, category: AgentCategory, max_agents: int) -> List[str]:
        """
        Select best agents for a task
        
        Strategy: Top performers by performance score
        """
        agents = self.registry.get_by_category(category, limit=max_agents)
        return [agent.id for agent in agents]
    
    async def execute_task(self, task_id: str) -> Task:
        """
        Execute a task across selected agents in parallel
        
        Args:
            task_id: Task ID
            
        Returns:
            Updated task with results
        """
        task = self.tasks.get(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")
        
        # Update status
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now()
        
        # Execute agents in parallel
        execution_tasks = []
        for agent_id in task.selected_agents:
            agent = self.registry.get(agent_id)
            if agent:
                execution_tasks.append(
                    self._execute_agent(task, agent)
                )
        
        # Wait for all agents to complete
        task.results = await asyncio.gather(*execution_tasks)
        
        # Evaluate results
        self._evaluate_results(task)
        
        # Determine winner
        self._select_winner(task)
        
        # Update status
        task.status = TaskStatus.COMPLETED
        task.completed_at = datetime.now()
        
        # Update agent performance metrics
        self._update_agent_metrics(task)
        
        return task
    
    async def _execute_agent(self, task: Task, agent: Agent) -> TaskResult:
        """
        Execute a single agent on a task
        
        Args:
            task: Task to execute
            agent: Agent to run
            
        Returns:
            TaskResult with output and metrics
        """
        start_time = time.time()
        
        try:
            # Simulate agent execution (in production, call actual LLM)
            output = await self._simulate_agent_execution(agent, task.description)
            
            execution_time = time.time() - start_time
            
            result = TaskResult(
                agent_id=agent.id,
                agent_name=agent.name,
                output=output,
                execution_time=execution_time,
                success=True
            )
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            return TaskResult(
                agent_id=agent.id,
                agent_name=agent.name,
                output="",
                execution_time=execution_time,
                success=False,
                error=str(e)
            )
    
    async def _simulate_agent_execution(self, agent: Agent, task_description: str) -> str:
        """
        Simulate agent execution (placeholder for actual LLM calls)
        
        In production, this would:
        1. Format prompt with agent.system_prompt
        2. Call LLM API (OpenAI, Anthropic, etc.)
        3. Return response
        """
        # Simulate processing time
        await asyncio.sleep(0.1 + (hash(agent.id) % 100) / 100.0)  # 0.1-1.1 seconds
        
        # Simulate output based on agent type
        output = f"""
{agent.name} Analysis:

Task: {task_description}

{agent.description}

Based on my analysis using {', '.join(agent.tools or ['general methods'])}, 
I have completed the task with the following approach:

1. Understanding the requirements
2. Applying specialized {agent.category.value} techniques
3. Generating high-quality results

[This is a simulation. In production, actual LLM output would be here.]

Result: Task completed successfully using {agent.model}.
"""
        return output.strip()
    
    def _evaluate_results(self, task: Task) -> None:
        """
        Evaluate all results using multiple quality metrics
        
        In production, this could use:
        - LLM-as-judge for quality assessment
        - User feedback
        - Domain-specific metrics
        """
        for result in task.results:
            if not result.success:
                continue
            
            # Simulate quality scoring (in production, use LLM judge)
            # For now, assign random-ish scores based on agent performance
            agent = self.registry.get(result.agent_id)
            if agent:
                base_quality = agent.performance_score / 100.0
                
                # Add some variation
                import random
                random.seed(hash(agent.id + task.id))
                
                result.quality_score = min(base_quality + random.uniform(-0.1, 0.1), 1.0)
                result.relevance_score = min(base_quality + random.uniform(-0.05, 0.15), 1.0)
                result.completeness_score = min(base_quality + random.uniform(-0.15, 0.05), 1.0)
                
                # Calculate fitness
                result.calculate_fitness()
    
    def _select_winner(self, task: Task) -> None:
        """
        Select winning agent based on fitness scores
        
        In production, could be:
        - Automatic (highest fitness)
        - User selection (show top 3, user picks)
        - Hybrid (auto-select if clear winner, else ask user)
        """
        # Filter successful results
        successful_results = [r for r in task.results if r.success]
        
        if not successful_results:
            return
        
        # Sort by fitness score
        successful_results.sort(key=lambda r: r.fitness_score, reverse=True)
        
        # Winner is highest fitness
        winner = successful_results[0]
        task.winner_agent_id = winner.agent_id
    
    def _update_agent_metrics(self, task: Task) -> None:
        """
        Update agent performance metrics based on task results
        """
        for result in task.results:
            # Determine if this agent won
            won = (result.agent_id == task.winner_agent_id)
            
            # Update performance (winning counts as success)
            self.registry.update_performance(
                agent_id=result.agent_id,
                task_successful=won or result.success,
                response_time=result.execution_time,
                user_rating=5.0 if won else (4.0 if result.success else 2.0)
            )
            
            # Record earnings for winner
            if won:
                agent = self.registry.get(result.agent_id)
                if agent:
                    self.registry.record_earnings(
                        agent_id=result.agent_id,
                        amount=agent.price_per_execution
                    )
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID"""
        return self.tasks.get(task_id)
    
    def get_user_tasks(self, user_id: str) -> List[Task]:
        """Get all tasks for a user"""
        return [
            task for task in self.tasks.values()
            if task.user_id == user_id
        ]


# Example usage and testing
async def main():
    """Test the task execution engine"""
    print("🚀 TASK EXECUTION ENGINE TEST\n")
    print("=" * 80)
    
    # Initialize registry with sample agents
    registry = AgentRegistry()
    
    # Create sample agents
    agents = [
        Agent(
            name="Deep Research Pro",
            description="Advanced research with web search and synthesis",
            category=AgentCategory.RESEARCH,
            system_prompt="You are an expert research assistant...",
            tools=["web_search", "academic_search", "synthesis"],
            price_per_execution=0.10,
            performance_score=85.0
        ),
        Agent(
            name="Academic Scholar",
            description="Specialized in academic paper analysis",
            category=AgentCategory.RESEARCH,
            system_prompt="You are an academic research specialist...",
            tools=["arxiv_search", "citation_analysis"],
            price_per_execution=0.15,
            performance_score=82.0
        ),
        Agent(
            name="Quick Researcher",
            description="Fast web research for quick insights",
            category=AgentCategory.RESEARCH,
            system_prompt="You provide quick research summaries...",
            tools=["web_search"],
            price_per_execution=0.05,
            performance_score=75.0
        ),
    ]
    
    # Register agents
    for agent in agents:
        registry.register(agent)
    
    print(f"✅ Registered {len(agents)} research agents\n")
    
    # Create execution engine
    engine = TaskExecutionEngine(registry)
    
    # Submit a task
    print("📝 Submitting research task...")
    task = await engine.submit_task(
        user_id="test_user_123",
        description="Research the latest advancements in evolutionary AI systems",
        category=AgentCategory.RESEARCH,
        max_agents=3
    )
    
    print(f"✅ Task created: {task.id}")
    print(f"   Category: {task.category.value}")
    print(f"   Selected agents: {len(task.selected_agents)}")
    
    # Execute task
    print(f"\n⚡ Executing task across {len(task.selected_agents)} agents in parallel...\n")
    
    result = await engine.execute_task(task.id)
    
    # Display results
    print("=" * 80)
    print("📊 TASK EXECUTION RESULTS")
    print("=" * 80)
    
    print(f"\nStatus: {result.status.value}")
    print(f"Duration: {(result.completed_at - result.started_at).total_seconds():.2f}s")
    print(f"\nResults from {len(result.results)} agents:\n")
    
    for i, res in enumerate(sorted(result.results, key=lambda r: r.fitness_score, reverse=True), 1):
        winner_mark = "🏆 " if res.agent_id == result.winner_agent_id else "   "
        print(f"{winner_mark}{i}. {res.agent_name}")
        print(f"   Fitness Score: {res.fitness_score:.3f}")
        print(f"   Quality: {res.quality_score:.2f} | Relevance: {res.relevance_score:.2f} | "
              f"Completeness: {res.completeness_score:.2f}")
        print(f"   Execution Time: {res.execution_time:.2f}s")
        print(f"   Success: {res.success}")
        print()
    
    # Show updated leaderboard
    print("=" * 80)
    print("🏆 UPDATED AGENT LEADERBOARD")
    print("=" * 80)
    
    leaderboard = registry.get_leaderboard(category=AgentCategory.RESEARCH)
    for entry in leaderboard:
        print(f"{entry['rank']}. {entry['name']}")
        print(f"   Score: {entry['performance_score']}/100 | Tasks: {entry['tasks_completed']} | "
              f"Success: {entry['success_rate']} | Earnings: {entry['total_earnings']}")
        print()


if __name__ == "__main__":
    asyncio.run(main())
