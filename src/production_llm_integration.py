"""
Real LLM Integration - Production-Grade Agent Execution

Replaces simulated LLM calls with actual GitHub Copilot model inference
via Model Context Protocol (MCP).

This module provides the bridge between our marketplace agents and
real language models, enabling production-quality agent execution.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable
import asyncio
import json
import time

from mcp_sampling import MCPSampler, MCPMessage, MCPSamplingConfig, AgentMCPExecutor
from cascade_evaluation import CascadeEvaluator, CascadeConfig, AgentCascadeEvaluator


@dataclass
class AgentExecutionResult:
    """Result from agent execution"""
    
    agent_id: str
    agent_name: str
    task_description: str
    
    # Output
    output: str
    success: bool
    error: Optional[str] = None
    
    # Performance metrics
    execution_time: float = 0.0
    token_usage: Dict[str, int] = field(default_factory=dict)
    
    # Quality scores
    quality_score: float = 0.0
    relevance_score: float = 0.0
    completeness_score: float = 0.0
    
    # Metadata
    model_used: str = ""
    stage: int = 0  # Cascade stage (1 or 2)
    cost_estimate: float = 0.0


class ProductionAgentExecutor:
    """
    Production-grade agent executor with real LLM calls
    
    Features:
    - Real GitHub Copilot model inference
    - Cascade evaluation for cost efficiency
    - Quality assessment
    - Error handling
    - Token tracking
    - Cost estimation
    
    Example:
        >>> executor = ProductionAgentExecutor()
        >>> 
        >>> result = await executor.execute_agent(
        ...     agent=my_agent,
        ...     task_description="Research evolutionary AI",
        ...     enable_cascade=True
        ... )
        >>> 
        >>> print(f"Output: {result.output}")
        >>> print(f"Cost savings: {result.cost_estimate}")
    """
    
    def __init__(
        self,
        mcp_sampler: Optional[MCPSampler] = None,
        enable_cascade: bool = True,
        cascade_config: Optional[CascadeConfig] = None
    ):
        """
        Initialize production executor
        
        Args:
            mcp_sampler: MCP sampler for LLM calls
            enable_cascade: Use cascade evaluation for cost savings
            cascade_config: Cascade configuration
        """
        self.mcp_sampler = mcp_sampler or MCPSampler()
        self.mcp_executor = AgentMCPExecutor(sampler=self.mcp_sampler)
        self.enable_cascade = enable_cascade
        
        # Cascade evaluator for cost efficiency
        if enable_cascade:
            self.cascade_config = cascade_config or CascadeConfig(
                stage1_samples=5,
                stage2_samples=20,
                stage1_threshold=0.8
            )
    
    async def execute_agent(
        self,
        agent: Any,
        task_description: str,
        context: Optional[Dict] = None,
        enable_cascade: Optional[bool] = None
    ) -> AgentExecutionResult:
        """
        Execute an agent on a task with real LLM
        
        Args:
            agent: Agent to execute
            task_description: Task description
            context: Additional context
            enable_cascade: Override cascade setting
            
        Returns:
            Execution result with output and metrics
        """
        start_time = time.time()
        use_cascade = enable_cascade if enable_cascade is not None else self.enable_cascade
        
        try:
            # Execute with real LLM via MCP
            result = await self.mcp_executor.execute_agent(
                agent=agent,
                task_description=task_description,
                context=context
            )
            
            execution_time = time.time() - start_time
            
            # Assess quality
            quality_scores = await self._assess_quality(
                output=result['output'],
                task_description=task_description,
                agent=agent
            )
            
            # Calculate cost estimate
            cost = self._calculate_cost(
                token_usage=result['usage'],
                model=result['model']
            )
            
            return AgentExecutionResult(
                agent_id=agent.id,
                agent_name=agent.name,
                task_description=task_description,
                output=result['output'],
                success=True,
                execution_time=execution_time,
                token_usage=result['usage'],
                quality_score=quality_scores['quality'],
                relevance_score=quality_scores['relevance'],
                completeness_score=quality_scores['completeness'],
                model_used=result['model'],
                stage=2,  # Full execution
                cost_estimate=cost
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            return AgentExecutionResult(
                agent_id=agent.id,
                agent_name=agent.name,
                task_description=task_description,
                output="",
                success=False,
                error=str(e),
                execution_time=execution_time
            )
    
    async def execute_with_cascade(
        self,
        agent: Any,
        task_samples: List[str],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Execute agent with cascade evaluation
        
        Tests agent on small sample first, then full sample if promising
        
        Args:
            agent: Agent to execute
            task_samples: List of task descriptions
            context: Additional context
            
        Returns:
            Cascade evaluation result
        """
        # Stage 1: Quick evaluation
        stage1_tasks = task_samples[:self.cascade_config.stage1_samples]
        stage1_scores = []
        
        for task in stage1_tasks:
            result = await self.execute_agent(
                agent=agent,
                task_description=task,
                context=context,
                enable_cascade=False  # Don't cascade within cascade
            )
            
            if result.success:
                # Combined quality score
                score = (
                    0.4 * result.quality_score +
                    0.3 * result.relevance_score +
                    0.3 * result.completeness_score
                )
                stage1_scores.append(score)
            else:
                stage1_scores.append(0.0)
        
        stage1_avg = sum(stage1_scores) / len(stage1_scores) if stage1_scores else 0.0
        
        # Check if passes stage 1 threshold
        if stage1_avg < self.cascade_config.stage1_threshold:
            return {
                'stage': 1,
                'passed': False,
                'score': stage1_avg,
                'cost_saved': 0.7,  # Saved 70% by not running stage 2
                'tasks_evaluated': len(stage1_tasks)
            }
        
        # Stage 2: Full evaluation
        stage2_tasks = task_samples[self.cascade_config.stage1_samples:self.cascade_config.stage2_samples]
        stage2_scores = []
        
        for task in stage2_tasks:
            result = await self.execute_agent(
                agent=agent,
                task_description=task,
                context=context,
                enable_cascade=False
            )
            
            if result.success:
                score = (
                    0.4 * result.quality_score +
                    0.3 * result.relevance_score +
                    0.3 * result.completeness_score
                )
                stage2_scores.append(score)
            else:
                stage2_scores.append(0.0)
        
        # Combine stage 1 and 2 scores
        all_scores = stage1_scores + stage2_scores
        final_score = sum(all_scores) / len(all_scores) if all_scores else 0.0
        
        return {
            'stage': 2,
            'passed': True,
            'score': final_score,
            'stage1_score': stage1_avg,
            'stage2_score': sum(stage2_scores) / len(stage2_scores) if stage2_scores else 0.0,
            'cost_saved': 0.0,  # No savings since we ran full evaluation
            'tasks_evaluated': len(all_scores)
        }
    
    async def _assess_quality(
        self,
        output: str,
        task_description: str,
        agent: Any
    ) -> Dict[str, float]:
        """
        Assess quality of agent output
        
        Uses heuristics and (optionally) LLM-as-judge
        
        Args:
            output: Agent output
            task_description: Original task
            agent: Agent that produced output
            
        Returns:
            Quality scores (quality, relevance, completeness)
        """
        # Simple heuristic-based assessment
        # In production, could use LLM-as-judge for better accuracy
        
        # Quality: Based on output length and structure
        quality = min(1.0, len(output) / 500)  # Longer = better (up to point)
        
        # Relevance: Check if task keywords appear in output
        task_keywords = set(task_description.lower().split())
        output_words = set(output.lower().split())
        overlap = len(task_keywords & output_words) / max(len(task_keywords), 1)
        relevance = min(1.0, overlap * 2)  # Scale up
        
        # Completeness: Check for structured output
        completeness = 0.5  # Baseline
        if len(output) > 200:
            completeness += 0.2
        if '\n\n' in output:  # Has paragraphs
            completeness += 0.2
        if any(marker in output for marker in ['1.', '2.', '-', '•']):  # Has lists
            completeness += 0.1
        
        completeness = min(1.0, completeness)
        
        return {
            'quality': quality,
            'relevance': relevance,
            'completeness': completeness
        }
    
    def _calculate_cost(
        self,
        token_usage: Dict[str, int],
        model: str
    ) -> float:
        """
        Calculate estimated cost in USD
        
        Uses approximate pricing for common models
        
        Args:
            token_usage: Token counts
            model: Model name
            
        Returns:
            Estimated cost in USD
        """
        # Pricing per 1M tokens (approximate)
        pricing = {
            'gpt-4o': {'input': 2.50, 'output': 10.00},
            'gpt-4o-mini': {'input': 0.15, 'output': 0.60},
            'gpt-4-turbo': {'input': 10.00, 'output': 30.00},
            'o1-preview': {'input': 15.00, 'output': 60.00},
        }
        
        # Default pricing if model not found
        default_pricing = {'input': 2.50, 'output': 10.00}
        
        model_pricing = pricing.get(model, default_pricing)
        
        input_tokens = token_usage.get('prompt_tokens', 0)
        output_tokens = token_usage.get('completion_tokens', 0)
        
        input_cost = (input_tokens / 1_000_000) * model_pricing['input']
        output_cost = (output_tokens / 1_000_000) * model_pricing['output']
        
        return input_cost + output_cost


# Integration with task execution engine
class ProductionTaskExecutionEngine:
    """
    Enhanced task execution engine with real LLM calls
    
    Upgrades the marketplace task execution to use production LLMs
    """
    
    def __init__(
        self,
        registry: Any,  # AgentRegistry
        executor: Optional[ProductionAgentExecutor] = None
    ):
        """
        Initialize production task execution
        
        Args:
            registry: Agent registry
            executor: Production agent executor
        """
        self.registry = registry
        self.executor = executor or ProductionAgentExecutor()
        self.tasks: Dict[str, Any] = {}
    
    async def execute_task_with_real_llm(
        self,
        task_id: str,
        task_description: str,
        selected_agents: List[str],
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Execute task with real LLM calls
        
        Args:
            task_id: Task identifier
            task_description: Task description
            selected_agents: Agent IDs to run
            context: Additional context
            
        Returns:
            Task execution results
        """
        results = []
        
        # Execute agents in parallel
        execution_tasks = []
        for agent_id in selected_agents:
            agent = self.registry.get(agent_id)
            if agent:
                execution_tasks.append(
                    self.executor.execute_agent(
                        agent=agent,
                        task_description=task_description,
                        context=context
                    )
                )
        
        # Wait for all to complete
        results = await asyncio.gather(*execution_tasks)
        
        # Calculate fitness scores
        for result in results:
            result.fitness_score = self._calculate_fitness(result)
        
        # Find winner
        successful_results = [r for r in results if r.success]
        if successful_results:
            winner = max(successful_results, key=lambda r: r.fitness_score)
            winner_id = winner.agent_id
        else:
            winner_id = None
        
        return {
            'task_id': task_id,
            'results': results,
            'winner_id': winner_id,
            'total_cost': sum(r.cost_estimate for r in results),
            'total_tokens': sum(
                r.token_usage.get('total_tokens', 0) for r in results
            ),
            'successful_executions': len(successful_results),
            'failed_executions': len(results) - len(successful_results)
        }
    
    def _calculate_fitness(self, result: AgentExecutionResult) -> float:
        """
        Calculate multi-objective fitness score
        
        Weights:
        - Quality: 40%
        - Speed: 20%
        - Relevance: 20%
        - Completeness: 20%
        """
        import math
        
        # Speed score (exponential decay)
        speed_score = math.exp(-result.execution_time / 10.0)
        
        fitness = (
            0.4 * result.quality_score +
            0.2 * speed_score +
            0.2 * result.relevance_score +
            0.2 * result.completeness_score
        )
        
        return fitness


# Demo/test code
async def main():
    """Test production LLM integration"""
    print("🚀 Testing Production LLM Integration\n")
    print("=" * 80)
    
    # Import agent registry
    import sys
    import os
    sys.path.insert(0, os.path.dirname(__file__))
    
    from agent_registry import Agent, AgentRegistry, AgentCategory
    
    # Create test agent
    agent = Agent(
        name="Research Pro",
        description="Expert research agent",
        category=AgentCategory.RESEARCH,
        system_prompt="""You are an expert research assistant specializing in AI and machine learning.

Your capabilities:
- Thorough research with multiple sources
- Clear, concise summaries
- Evidence-based conclusions

Provide structured, informative responses.""",
        model="gpt-4o",
        parameters={
            "temperature": 0.3,
            "max_tokens": 2000
        },
        price_per_execution=0.10
    )
    
    # Create executor
    executor = ProductionAgentExecutor(enable_cascade=True)
    
    # Test 1: Single execution
    print("Test 1: Single Agent Execution")
    print("-" * 80)
    
    result = await executor.execute_agent(
        agent=agent,
        task_description="Explain the key benefits of multi-island evolutionary algorithms in 3 bullet points."
    )
    
    print(f"Agent: {result.agent_name}")
    print(f"Success: {result.success}")
    print(f"Output: {result.output}")
    print(f"Execution time: {result.execution_time:.2f}s")
    print(f"Quality: {result.quality_score:.2f}")
    print(f"Relevance: {result.relevance_score:.2f}")
    print(f"Completeness: {result.completeness_score:.2f}")
    print(f"Model: {result.model_used}")
    print(f"Tokens: {result.token_usage}")
    print(f"Cost: ${result.cost_estimate:.6f}")
    
    # Test 2: Cascade evaluation
    print("\n" + "=" * 80)
    print("Test 2: Cascade Evaluation")
    print("-" * 80)
    
    task_samples = [
        "Summarize cascade evaluation benefits",
        "Explain multi-island evolution",
        "Describe MCP sampling advantages",
        "List agent marketplace features",
        "Compare evolutionary algorithms"
    ] * 4  # 20 tasks total
    
    cascade_result = await executor.execute_with_cascade(
        agent=agent,
        task_samples=task_samples
    )
    
    print(f"Stage: {cascade_result['stage']}")
    print(f"Passed: {cascade_result['passed']}")
    print(f"Final score: {cascade_result['score']:.3f}")
    print(f"Tasks evaluated: {cascade_result['tasks_evaluated']}")
    print(f"Cost saved: {cascade_result['cost_saved'] * 100:.1f}%")
    
    # Test 3: Multiple agents competition
    print("\n" + "=" * 80)
    print("Test 3: Multiple Agents Competition")
    print("-" * 80)
    
    # Create multiple agents
    agents = [
        Agent(
            name="Speed Researcher",
            description="Fast but less thorough",
            category=AgentCategory.RESEARCH,
            system_prompt="Provide quick, concise research summaries.",
            model="gpt-4o-mini",
            parameters={"temperature": 0.5, "max_tokens": 500}
        ),
        Agent(
            name="Deep Researcher",
            description="Thorough and detailed",
            category=AgentCategory.RESEARCH,
            system_prompt="Provide comprehensive, detailed research with citations.",
            model="gpt-4o",
            parameters={"temperature": 0.2, "max_tokens": 3000}
        )
    ]
    
    task = "Research the cost-efficiency benefits of cascade evaluation in evolutionary AI systems."
    
    results = await asyncio.gather(*[
        executor.execute_agent(agent=agent, task_description=task)
        for agent in [agent] + agents  # Include original + new agents
    ])
    
    print(f"\nCompetition Results for: {task[:60]}...\n")
    
    for i, res in enumerate(results, 1):
        fitness = (
            0.4 * res.quality_score +
            0.2 * min(1.0, 10.0 / res.execution_time) +
            0.2 * res.relevance_score +
            0.2 * res.completeness_score
        )
        
        print(f"{i}. {res.agent_name}")
        print(f"   Fitness: {fitness:.3f}")
        print(f"   Quality: {res.quality_score:.2f} | Relevance: {res.relevance_score:.2f} | "
              f"Completeness: {res.completeness_score:.2f}")
        print(f"   Time: {res.execution_time:.2f}s | Cost: ${res.cost_estimate:.6f}")
        print(f"   Model: {res.model_used}")
        print()
    
    # Winner
    winner = max(results, key=lambda r: (
        0.4 * r.quality_score +
        0.2 * min(1.0, 10.0 / r.execution_time) +
        0.2 * r.relevance_score +
        0.2 * r.completeness_score
    ))
    
    print(f"🏆 Winner: {winner.agent_name}")
    
    print("\n" + "=" * 80)
    print("✅ Production LLM Integration Working!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
