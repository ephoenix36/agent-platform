"""
EvoSuite Bridge: Connect Business Agents to AlphaEvolve's Proven Optimization Engine

This module bridges the Agents platform (TypeScript/JSON) with EvoSuite SDK (Python),
enabling evolutionary optimization of business agents based on revenue metrics.

Key Features:
- Convert agent JSON configs to EvoSuite format
- Run multi-objective optimization (Revenue + Quality + Speed)
- Update agents with evolved instructions
- Track optimization history
- Enable continuous improvement loop

Usage:
    from evosuite_bridge import AgentOptimizer, RevenueOptimizer
    
    optimizer = RevenueOptimizer('path/to/agent.json', revenue_data)
    result = optimizer.optimize(generations=10)
    print(f"Improved from {result.initial_score} to {result.best_score}")
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass

# Add EvoSuite SDK to path
EVOSUITE_PATH = Path(__file__).parent.parent.parent.parent / "AlphaEvolve" / "evosuite-sdk-py"
sys.path.insert(0, str(EVOSUITE_PATH))

try:
    from evosuite_sdk import EvolutionRunner
    from evosuite_sdk.evaluators import AbstractEvoEvaluator, register_evaluator
    from evosuite_sdk.mutators import AIMutator
    from evosuite_sdk.instructions import InstructionSet
    EVOSUITE_AVAILABLE = True
except ImportError as e:
    print(f"Warning: EvoSuite SDK not available: {e}")
    print(f"Attempted path: {EVOSUITE_PATH}")
    EVOSUITE_AVAILABLE = False


@dataclass
class OptimizationResult:
    """Results from an EvoSuite optimization run"""
    agent_id: str
    initial_score: float
    best_score: float
    improvement: float
    best_prompt: str
    generation: int
    timestamp: str
    metrics: Dict[str, float]


class AgentOptimizer:
    """
    Optimizes business agent instructions using EvoSuite's evolutionary algorithms
    
    This is the base optimizer that uses the agent's defined evaluator criteria.
    For revenue-driven optimization, use RevenueOptimizer subclass.
    """
    
    def __init__(self, agent_path: str):
        """
        Initialize optimizer with agent configuration
        
        Args:
            agent_path: Path to agent JSON file
        """
        self.agent_path = Path(agent_path)
        self.agent = self._load_agent()
        
        if not EVOSUITE_AVAILABLE:
            raise ImportError("EvoSuite SDK must be installed. Run: pip install -e ../AlphaEvolve/evosuite-sdk-py")
    
    def _load_agent(self) -> Dict:
        """Load agent configuration from JSON"""
        with open(self.agent_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def _save_agent(self):
        """Save updated agent configuration"""
        with open(self.agent_path, 'w', encoding='utf-8') as f:
            json.dump(self.agent, f, indent=2, ensure_ascii=False)
    
    def create_evaluator(self) -> 'AIEvaluator':
        """
        Convert agent's evaluator config to EvoSuite evaluator
        
        Returns:
            AIEvaluator configured with agent's success criteria
        """
        criteria = self.agent['evaluator']['successCriteria']
        metrics = self.agent['evaluator'].get('weightedMetrics', [])
        threshold = self.agent.get('optimizationThreshold', 0.75)
        
        # Build evaluator instruction
        eval_instruction = self._build_evaluator_instruction(criteria, metrics)
        
        return AIEvaluator(
            instruction_set=InstructionSet.from_text(eval_instruction),
            threshold=threshold,
            mcp_adapter=MCPAdapter() if hasattr(MCPAdapter, '__init__') else None
        )
    
    def _build_evaluator_instruction(self, criteria: List[Dict], metrics: List[Dict]) -> str:
        """Build evaluation instruction from agent's criteria"""
        instruction = f"# Agent Evaluation: {self.agent['name']}\n\n"
        instruction += f"## Goal\nEvaluate the quality of agent output based on these criteria:\n\n"
        
        # Add success criteria
        instruction += "### Success Criteria\n"
        for criterion in criteria:
            weight = criterion['weight']
            name = criterion['name']
            desc = criterion['description']
            required = criterion.get('required', False)
            req_text = " (REQUIRED)" if required else ""
            instruction += f"- **{name}** (weight: {weight}){req_text}: {desc}\n"
        
        # Add weighted metrics
        if metrics:
            instruction += "\n### Business Metrics\n"
            for metric in metrics:
                weight = metric['weight']
                name = metric['name']
                target = metric.get('target', 'maximize')
                instruction += f"- **{name}** (weight: {weight}): Target = {target}\n"
        
        instruction += "\n## Evaluation Process\n"
        instruction += "1. Analyze agent output against each criterion\n"
        instruction += "2. Assign score 0.0-1.0 for each criterion\n"
        instruction += "3. Calculate weighted average\n"
        instruction += "4. Check required criteria are met\n"
        instruction += "5. Return final score and justification\n\n"
        instruction += "## Output Format\n"
        instruction += "```json\n"
        instruction += '{"score": 0.85, "criterion_scores": {...}, "justification": "..."}\n'
        instruction += "```"
        
        return instruction
    
    def create_mutator(self) -> 'AIMutator':
        """
        Convert agent's mutator config to EvoSuite mutator
        
        Returns:
            AIMutator configured with agent's strategies
        """
        strategies = self.agent['mutator']['strategies']
        constraints = self.agent['mutator']['constraints']
        rate = self.agent['mutator'].get('mutationRate', 0.25)
        
        # Build mutator instruction
        mut_instruction = self._build_mutator_instruction(strategies, constraints)
        
        return AIMutator(
            instruction_set=InstructionSet.from_text(mut_instruction),
            mutation_rate=rate,
            mcp_adapter=MCPAdapter() if hasattr(MCPAdapter, '__init__') else None
        )
    
    def _build_mutator_instruction(self, strategies: List[str], constraints: List[Dict]) -> str:
        """Build mutation instruction from agent's strategies"""
        instruction = f"# Agent Mutation: {self.agent['name']}\n\n"
        instruction += f"## Goal\nImprove agent instructions while maintaining core functionality.\n\n"
        
        # Add strategies
        instruction += "### Mutation Strategies\nApply one or more of these strategies:\n"
        for i, strategy in enumerate(strategies, 1):
            instruction += f"{i}. **{strategy}**: {self._get_strategy_description(strategy)}\n"
        
        # Add constraints
        instruction += "\n### Constraints (MUST PRESERVE)\n"
        for constraint in constraints:
            name = constraint['name']
            ctype = constraint['type']
            value = constraint.get('value', '')
            instruction += f"- **{name}** ({ctype}): {value}\n"
        
        instruction += "\n## Mutation Process\n"
        instruction += "1. Analyze current instruction weaknesses\n"
        instruction += "2. Select appropriate mutation strategy\n"
        instruction += "3. Apply targeted improvements\n"
        instruction += "4. Verify all constraints still met\n"
        instruction += "5. Return improved instruction\n\n"
        instruction += "## Output Format\n"
        instruction += "Return the complete improved instruction as markdown text."
        
        return instruction
    
    def _get_strategy_description(self, strategy: str) -> str:
        """Get description for mutation strategy"""
        descriptions = {
            'clarity-boost': 'Improve instruction clarity and reduce ambiguity',
            'depth-enhancement': 'Add more detail and examples',
            'efficiency-tuning': 'Optimize for speed and token efficiency',
            'error-prevention': 'Add defensive programming and edge case handling',
            'pattern-deepening': 'Strengthen pattern recognition capabilities',
            'personalization-expansion': 'Enhance personalization depth',
            'pain-point-deepening': 'Improve pain point identification accuracy',
            'consolidation-tightening': 'Streamline and consolidate instructions',
            'roadmap-refinement': 'Improve strategic planning clarity',
            'spam-trigger-expansion': 'Expand spam detection capabilities',
            'ab-test-generation': 'Add A/B testing recommendations'
        }
        return descriptions.get(strategy, 'Improve using this strategy')
    
    def optimize(
        self, 
        generations: int = 10, 
        population_size: int = 5,
        save_result: bool = True
    ) -> OptimizationResult:
        """
        Run EvoSuite optimization on agent instructions
        
        Args:
            generations: Number of evolutionary generations to run
            population_size: Size of population in each generation
            save_result: Whether to update agent file with best result
        
        Returns:
            OptimizationResult with improvement details
        """
        print(f"Starting optimization for {self.agent['name']}...")
        print(f"Initial score: {self.agent.get('currentScore', 0.0)}")
        print(f"Target threshold: {self.agent.get('optimizationThreshold', 0.75)}")
        
        # Create evaluator and mutator
        evaluator = self.create_evaluator()
        mutator = self.create_mutator()
        
        # Initialize runner
        runner = EvoSuiteRunner()
        
        # Run optimization
        initial_prompt = self.agent['systemPrompt']
        initial_score = self.agent.get('currentScore', 0.0)
        
        result = runner.run(
            initial_instruction=initial_prompt,
            evaluator=evaluator,
            mutator=mutator,
            generations=generations,
            population_size=population_size,
            preserve_best=True  # Always keep best individual
        )
        
        # Calculate improvement
        improvement = result.best_score - initial_score
        improvement_pct = (improvement / max(initial_score, 0.01)) * 100
        
        print(f"\nOptimization complete!")
        print(f"Best score: {result.best_score:.3f}")
        print(f"Improvement: +{improvement:.3f} ({improvement_pct:+.1f}%)")
        
        # Create result object
        opt_result = OptimizationResult(
            agent_id=self.agent['id'],
            initial_score=initial_score,
            best_score=result.best_score,
            improvement=improvement,
            best_prompt=result.best_individual,
            generation=generations,
            timestamp=datetime.now().isoformat(),
            metrics=result.metrics if hasattr(result, 'metrics') else {}
        )
        
        # Update agent if requested
        if save_result:
            self._update_agent_with_result(opt_result)
        
        return opt_result
    
    def _update_agent_with_result(self, result: OptimizationResult):
        """Update agent configuration with optimization result"""
        # Update system prompt
        self.agent['systemPrompt'] = result.best_prompt
        
        # Update score
        self.agent['currentScore'] = result.best_score
        
        # Add to optimization history
        if 'optimizationHistory' not in self.agent:
            self.agent['optimizationHistory'] = []
        
        self.agent['optimizationHistory'].append({
            'timestamp': result.timestamp,
            'score': result.best_score,
            'improvement': result.improvement,
            'generation': result.generation,
            'metrics': result.metrics
        })
        
        # Update timestamp
        self.agent['updatedAt'] = result.timestamp
        
        # Save to file
        self._save_agent()
        print(f"Agent updated and saved to {self.agent_path}")


class RevenueOptimizer(AgentOptimizer):
    """
    Optimizes agents based on actual revenue generation, not just output quality
    
    This optimizer uses real business metrics (revenue, customer satisfaction, retention)
    as the primary fitness function for evolution.
    """
    
    def __init__(self, agent_path: str, revenue_data: Dict[str, Any]):
        """
        Initialize revenue-driven optimizer
        
        Args:
            agent_path: Path to agent JSON file
            revenue_data: Revenue and usage metrics
                Example: {
                    'total_revenue': 25000,
                    'uses': 150,
                    'customer_ratings': [4.5, 5.0, 4.8, ...],
                    'retention_rate': 0.92,
                    'upsells': 3
                }
        """
        super().__init__(agent_path)
        self.revenue_data = revenue_data
    
    def create_evaluator(self) -> 'AIEvaluator':
        """
        Create revenue-focused evaluator
        
        Returns:
            AIEvaluator that prioritizes business outcomes over output quality
        """
        # Override with revenue-driven criteria
        revenue_instruction = self._build_revenue_evaluator()
        
        return AIEvaluator(
            instruction_set=InstructionSet.from_text(revenue_instruction),
            threshold=self.agent.get('optimizationThreshold', 0.75),
            mcp_adapter=MCPAdapter() if hasattr(MCPAdapter, '__init__') else None
        )
    
    def _build_revenue_evaluator(self) -> str:
        """Build evaluator focused on revenue metrics"""
        total_revenue = self.revenue_data.get('total_revenue', 0)
        uses = self.revenue_data.get('uses', 1)
        revenue_per_use = total_revenue / max(uses, 1)
        
        ratings = self.revenue_data.get('customer_ratings', [])
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        retention = self.revenue_data.get('retention_rate', 0)
        upsells = self.revenue_data.get('upsells', 0)
        
        instruction = f"# Revenue-Driven Agent Evaluation: {self.agent['name']}\n\n"
        instruction += "## Business Context\n"
        instruction += f"- Total Revenue: ${total_revenue:,.2f}\n"
        instruction += f"- Uses: {uses}\n"
        instruction += f"- Revenue per Use: ${revenue_per_use:.2f}\n"
        instruction += f"- Avg Customer Rating: {avg_rating:.2f}/5.0\n"
        instruction += f"- Retention Rate: {retention:.1%}\n"
        instruction += f"- Upsells Generated: {upsells}\n\n"
        
        instruction += "## Evaluation Criteria (Weighted by Business Impact)\n\n"
        instruction += "### 1. Revenue Generation (40% weight)\n"
        instruction += "Does this output directly lead to revenue?\n"
        instruction += "- Increases sales conversions\n"
        instruction += "- Reduces churn\n"
        instruction += "- Enables upsells\n"
        instruction += "- Improves efficiency (time saved = money saved)\n\n"
        
        instruction += "### 2. Customer Satisfaction (30% weight)\n"
        instruction += "Will customers rate this output highly?\n"
        instruction += "- Solves their pain point effectively\n"
        instruction += "- Easy to understand and act on\n"
        instruction += "- Professional and trustworthy\n"
        instruction += "- Exceeds expectations\n\n"
        
        instruction += "### 3. Time to Value (20% weight)\n"
        instruction += "How quickly can customers use this output?\n"
        instruction += "- Immediately actionable\n"
        instruction += "- No additional research needed\n"
        instruction += "- Clear next steps\n\n"
        
        instruction += "### 4. Output Quality (10% weight)\n"
        instruction += "Technical quality of the output\n"
        instruction += "- Accurate and factual\n"
        instruction += "- Well-structured\n"
        instruction += "- Free of errors\n\n"
        
        instruction += "## Evaluation Process\n"
        instruction += "1. Analyze output's revenue potential (40%)\n"
        instruction += "2. Assess customer satisfaction likelihood (30%)\n"
        instruction += "3. Evaluate time-to-value (20%)\n"
        instruction += "4. Check technical quality (10%)\n"
        instruction += "5. Return weighted score 0.0-1.0\n\n"
        
        instruction += "## Output Format\n"
        instruction += "```json\n"
        instruction += '{\n'
        instruction += '  "score": 0.85,\n'
        instruction += '  "revenue_potential": 0.9,\n'
        instruction += '  "customer_satisfaction": 0.85,\n'
        instruction += '  "time_to_value": 0.8,\n'
        instruction += '  "output_quality": 0.75,\n'
        instruction += '  "justification": "This output will generate revenue because..."\n'
        instruction += '}\n'
        instruction += "```"
        
        return instruction


def optimize_agent_cli(agent_path: str, generations: int = 10, revenue_mode: bool = False):
    """
    Command-line interface for optimizing agents
    
    Args:
        agent_path: Path to agent JSON file
        generations: Number of optimization generations
        revenue_mode: Use revenue-driven optimization
    """
    if revenue_mode:
        # In revenue mode, load revenue data from file or API
        revenue_data = {
            'total_revenue': 0,  # TODO: Load from database
            'uses': 1,
            'customer_ratings': [],
            'retention_rate': 0,
            'upsells': 0
        }
        optimizer = RevenueOptimizer(agent_path, revenue_data)
    else:
        optimizer = AgentOptimizer(agent_path)
    
    result = optimizer.optimize(generations=generations)
    
    print("\n" + "="*60)
    print("OPTIMIZATION SUMMARY")
    print("="*60)
    print(f"Agent: {result.agent_id}")
    print(f"Initial Score: {result.initial_score:.3f}")
    print(f"Final Score: {result.best_score:.3f}")
    print(f"Improvement: +{result.improvement:.3f} ({(result.improvement/max(result.initial_score, 0.01)*100):+.1f}%)")
    print(f"Generations: {result.generation}")
    print(f"Timestamp: {result.timestamp}")
    print("="*60)


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Optimize business agents using EvoSuite')
    parser.add_argument('agent_path', help='Path to agent JSON file')
    parser.add_argument('--generations', type=int, default=10, help='Number of generations')
    parser.add_argument('--revenue', action='store_true', help='Use revenue-driven optimization')
    
    args = parser.parse_args()
    
    optimize_agent_cli(args.agent_path, args.generations, args.revenue)
