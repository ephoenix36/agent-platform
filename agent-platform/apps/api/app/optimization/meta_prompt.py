"""
Meta-Prompt Optimizer - Automatic Prompt Evolution
Based on OpenEvolve Research

Expert Advisor: Architect (Evolution Algorithm Design)

Purpose: Use LLM to automatically optimize prompts, surpassing human performance
Key Innovation: Meta-evolution with inspiration-based crossover

Target Performance:
- Surpass human prompter baseline
- 10+ generations/hour  
- Automatic optimization
- Template stochasticity prevents stagnation

Components:
1. Prompt Mutation - Stochastic variations
2. Inspiration Crossover - Semantic synthesis
3. Evaluation Engine - Dataset-based scoring
4. Evolution Tracker - Visualize generations
5. Selection Strategy - Tournament + elitism
"""

import asyncio
import json
import time
import random
from typing import Dict, List, Any, Optional, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum
import anthropic
from collections import defaultdict
import numpy as np

class MutationType(str, Enum):
    """Types of prompt mutations"""
    REPHRASE = "rephrase"  # Rephrase instructions
    EXPAND = "expand"  # Add more detail
    SIMPLIFY = "simplify"  # Remove verbosity
    REORDER = "reorder"  # Change instruction order
    TONE_SHIFT = "tone_shift"  # Change tone (formal/casual)
    STOCHASTIC = "stochastic"  # Random template variation

@dataclass
class PromptVariant:
    """A single prompt variant in the population"""
    prompt_id: str
    text: str
    generation: int
    score: float = 0.0
    
    # Evolution metadata
    parent_ids: List[str] = field(default_factory=list)
    mutation_type: Optional[MutationType] = None
    crossover_sources: List[str] = field(default_factory=list)
    
    # Evaluation results
    evaluation_metrics: Dict[str, float] = field(default_factory=dict)
    num_evaluations: int = 0
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for storage"""
        return {
            'prompt_id': self.prompt_id,
            'text': self.text,
            'generation': self.generation,
            'score': self.score,
            'parent_ids': self.parent_ids,
            'mutation_type': self.mutation_type.value if self.mutation_type else None,
            'crossover_sources': self.crossover_sources,
            'evaluation_metrics': self.evaluation_metrics,
            'num_evaluations': self.num_evaluations
        }

@dataclass
class EvolutionRun:
    """Track an entire evolution run"""
    run_id: str
    base_prompt: str
    target_task: str
    num_generations: int
    population_size: int
    
    # Best prompt per generation
    generation_best: List[PromptVariant] = field(default_factory=list)
    
    # All variants ever created
    all_variants: Dict[str, PromptVariant] = field(default_factory=dict)
    
    # Metrics
    start_time: float = 0.0
    end_time: float = 0.0
    
    @property
    def best_prompt(self) -> Optional[PromptVariant]:
        """Get the best prompt overall"""
        if not self.all_variants:
            return None
        return max(self.all_variants.values(), key=lambda p: p.score)
    
    @property
    def improvement(self) -> float:
        """Calculate improvement over base prompt"""
        if len(self.generation_best) < 2:
            return 0.0
        return self.generation_best[-1].score - self.generation_best[0].score

class PromptMutator:
    """
    Generate prompt mutations with stochasticity
    
    Expert: Architect
    Approach: LLM-based mutation with randomized templates
    
    Key Insight from Research:
    "Template stochasticity (randomized prompts) breaks patterns
    and prevents evolutionary stagnation"
    """
    
    def __init__(self, llm_client: anthropic.Anthropic):
        self.llm = llm_client
        self.mutation_templates = self._create_mutation_templates()
    
    def _create_mutation_templates(self) -> Dict[MutationType, List[str]]:
        """
        Create stochastic mutation templates
        
        Multiple templates per mutation type for randomization
        """
        return {
            MutationType.REPHRASE: [
                "Rephrase this prompt to be clearer while keeping the same intent:",
                "Rewrite this prompt using different words but the same meaning:",
                "Express this prompt's instructions in an alternative way:",
            ],
            MutationType.EXPAND: [
                "Expand this prompt with more specific details and examples:",
                "Add more context and clarification to this prompt:",
                "Enhance this prompt with additional guidance:",
            ],
            MutationType.SIMPLIFY: [
                "Simplify this prompt by removing unnecessary verbosity:",
                "Make this prompt more concise while keeping key points:",
                "Streamline this prompt to be more direct:",
            ],
            MutationType.REORDER: [
                "Reorganize this prompt's instructions for better flow:",
                "Restructure this prompt in a more logical order:",
                "Reorder the components of this prompt for clarity:",
            ],
            MutationType.TONE_SHIFT: [
                "Adjust this prompt to be more [formal/casual/friendly/professional]:",
                "Change the tone of this prompt to be more [directive/suggestive/collaborative]:",
                "Modify this prompt's style to be more [technical/accessible/engaging]:",
            ],
            MutationType.STOCHASTIC: [
                "Create a variation of this prompt with creative changes:",
                "Generate an alternative version of this prompt:",
                "Produce a different take on this prompt's approach:",
            ]
        }
    
    async def mutate(
        self,
        prompt: PromptVariant,
        mutation_type: Optional[MutationType] = None
    ) -> PromptVariant:
        """
        Mutate a prompt
        
        If mutation_type is None, randomly selects one
        """
        if mutation_type is None:
            mutation_type = random.choice(list(MutationType))
        
        # Select random template for stochasticity
        templates = self.mutation_templates[mutation_type]
        mutation_template = random.choice(templates)
        
        # Apply tone variations if TONE_SHIFT
        if mutation_type == MutationType.TONE_SHIFT:
            tone = random.choice([
                "formal", "casual", "friendly", "professional",
                "directive", "suggestive", "collaborative",
                "technical", "accessible", "engaging"
            ])
            mutation_template = mutation_template.replace("[formal/casual/friendly/professional]", tone)
            mutation_template = mutation_template.replace("[directive/suggestive/collaborative]", tone)
            mutation_template = mutation_template.replace("[technical/accessible/engaging]", tone)
        
        mutation_prompt = f"""
{mutation_template}

Original Prompt:
\"\"\"
{prompt.text}
\"\"\"

Return ONLY the mutated prompt, no explanation or markdown.
"""
        
        try:
            message = self.llm.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": mutation_prompt}]
            )
            
            mutated_text = message.content[0].text.strip()
            
            # Remove markdown if present
            if mutated_text.startswith('"""') and mutated_text.endswith('"""'):
                mutated_text = mutated_text[3:-3].strip()
            
            # Create new variant
            new_variant = PromptVariant(
                prompt_id=f"gen{prompt.generation + 1}_{mutation_type.value}_{random.randint(1000, 9999)}",
                text=mutated_text,
                generation=prompt.generation + 1,
                parent_ids=[prompt.prompt_id],
                mutation_type=mutation_type
            )
            
            return new_variant
            
        except Exception as e:
            print(f"Error in mutation: {e}")
            # Return copy of original
            return PromptVariant(
                prompt_id=f"gen{prompt.generation + 1}_error_{random.randint(1000, 9999)}",
                text=prompt.text,
                generation=prompt.generation + 1,
                parent_ids=[prompt.prompt_id]
            )

class InspirationCrossover:
    """
    Semantic crossover using inspiration from multiple sources
    
    Expert: Architect
    Approach: Feed high-performing prompts as context for synthesis
    
    Key Insight from Research:
    "Inspiration-based crossover feeds high-performing solutions from
    the population as additional context to the LLM, enabling semantic
    crossover by synthesizing new solutions that integrate successful
    patterns from multiple sources"
    """
    
    def __init__(self, llm_client: anthropic.Anthropic):
        self.llm = llm_client
    
    async def crossover(
        self,
        parent_prompts: List[PromptVariant],
        target_task: str
    ) -> PromptVariant:
        """
        Perform inspiration-based crossover
        
        Combines patterns from multiple high-performing prompts
        """
        if len(parent_prompts) < 2:
            raise ValueError("Need at least 2 parents for crossover")
        
        # Build inspiration context
        inspiration_context = self._build_inspiration_context(parent_prompts)
        
        crossover_prompt = f"""
You are optimizing prompts for this task:
{target_task}

Here are several high-performing prompts for inspiration:

{inspiration_context}

Create a NEW prompt that combines the best aspects of these examples.
Focus on:
- Effective instruction patterns from the examples
- Clear structure that worked well
- Specific techniques that improved performance
- Novel combinations of successful elements

Output ONLY the new prompt, no explanation.
"""
        
        try:
            message = self.llm.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": crossover_prompt}]
            )
            
            crossed_text = message.content[0].text.strip()
            
            # Create new variant
            max_generation = max(p.generation for p in parent_prompts)
            
            new_variant = PromptVariant(
                prompt_id=f"gen{max_generation + 1}_crossover_{random.randint(1000, 9999)}",
                text=crossed_text,
                generation=max_generation + 1,
                parent_ids=[p.prompt_id for p in parent_prompts],
                crossover_sources=[p.prompt_id for p in parent_prompts]
            )
            
            return new_variant
            
        except Exception as e:
            print(f"Error in crossover: {e}")
            # Return best parent
            return max(parent_prompts, key=lambda p: p.score)
    
    def _build_inspiration_context(
        self,
        prompts: List[PromptVariant]
    ) -> str:
        """Format prompts as inspiration context"""
        context = ""
        
        for i, prompt in enumerate(prompts, 1):
            context += f"""
Prompt {i} (Score: {prompt.score:.3f}):
\"\"\"
{prompt.text}
\"\"\"

"""
        
        return context

class PromptEvaluator:
    """
    Evaluate prompt variants on evaluation datasets
    
    Expert: Architect
    Approach: Task-specific evaluation using test cases
    """
    
    def __init__(self, llm_client: anthropic.Anthropic):
        self.llm = llm_client
    
    async def evaluate(
        self,
        prompt_variant: PromptVariant,
        evaluation_dataset: List[Dict],
        target_task: str
    ) -> float:
        """
        Evaluate prompt on dataset
        
        Returns score 0.0 - 1.0
        """
        if not evaluation_dataset:
            return 0.0
        
        scores = []
        
        # Sample dataset if too large
        sample_size = min(len(evaluation_dataset), 20)
        sampled_tests = random.sample(evaluation_dataset, sample_size)
        
        for test_case in sampled_tests:
            score = await self._evaluate_single(
                prompt_variant.text,
                test_case,
                target_task
            )
            scores.append(score)
        
        # Calculate metrics
        avg_score = np.mean(scores) if scores else 0.0
        
        # Update variant
        prompt_variant.score = avg_score
        prompt_variant.evaluation_metrics = {
            'mean_score': avg_score,
            'std_dev': np.std(scores) if scores else 0.0,
            'min_score': min(scores) if scores else 0.0,
            'max_score': max(scores) if scores else 0.0
        }
        prompt_variant.num_evaluations = len(scores)
        
        return avg_score
    
    async def _evaluate_single(
        self,
        prompt_text: str,
        test_case: Dict,
        target_task: str
    ) -> float:
        """
        Evaluate prompt on a single test case
        
        Returns score 0.0 - 1.0
        """
        # Build evaluation prompt using the variant's prompt text
        full_prompt = f"""{prompt_text}

Input: {test_case.get('input', '')}
"""
        
        try:
            message = self.llm.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=512,
                messages=[{"role": "user", "content": full_prompt}]
            )
            
            output = message.content[0].text.strip()
            expected = test_case.get('expected', '')
            
            # Score based on similarity/correctness
            score = self._score_output(output, expected, test_case)
            
            return score
            
        except Exception as e:
            print(f"Error evaluating test case: {e}")
            return 0.0
    
    def _score_output(
        self,
        output: str,
        expected: str,
        test_case: Dict
    ) -> float:
        """
        Score the output against expected
        
        Simple scoring - could be enhanced with semantic similarity
        """
        # Exact match
        if output.strip() == expected.strip():
            return 1.0
        
        # Partial credit for overlap
        output_words = set(output.lower().split())
        expected_words = set(expected.lower().split())
        
        if not expected_words:
            return 0.0
        
        overlap = len(output_words & expected_words)
        score = overlap / len(expected_words)
        
        return min(1.0, score)

class EvolutionTracker:
    """
    Track and visualize prompt evolution
    
    Expert: Architect
    Storage: Generation history, family trees, metrics
    """
    
    def __init__(self):
        self.runs: Dict[str, EvolutionRun] = {}
    
    def create_run(
        self,
        run_id: str,
        base_prompt: str,
        target_task: str,
        num_generations: int,
        population_size: int
    ) -> EvolutionRun:
        """Create a new evolution run"""
        run = EvolutionRun(
            run_id=run_id,
            base_prompt=base_prompt,
            target_task=target_task,
            num_generations=num_generations,
            population_size=population_size,
            start_time=time.time()
        )
        
        self.runs[run_id] = run
        return run
    
    def record_generation(
        self,
        run_id: str,
        generation: int,
        population: List[PromptVariant]
    ):
        """Record a generation's population"""
        if run_id not in self.runs:
            return
        
        run = self.runs[run_id]
        
        # Add all variants to history
        for variant in population:
            run.all_variants[variant.prompt_id] = variant
        
        # Record best of generation
        if population:
            best = max(population, key=lambda p: p.score)
            run.generation_best.append(best)
    
    def finalize_run(self, run_id: str):
        """Mark run as complete"""
        if run_id in self.runs:
            self.runs[run_id].end_time = time.time()
    
    def get_evolution_history(self, run_id: str) -> Dict[str, Any]:
        """Get evolution history for visualization"""
        if run_id not in self.runs:
            return {}
        
        run = self.runs[run_id]
        
        return {
            'run_id': run_id,
            'base_prompt': run.base_prompt,
            'target_task': run.target_task,
            'num_generations': run.num_generations,
            'generations': [
                {
                    'generation': i,
                    'best_score': variant.score,
                    'prompt_id': variant.prompt_id,
                    'prompt_text': variant.text[:200] + '...' if len(variant.text) > 200 else variant.text
                }
                for i, variant in enumerate(run.generation_best)
            ],
            'best_overall': run.best_prompt.to_dict() if run.best_prompt else None,
            'improvement': run.improvement,
            'duration_seconds': run.end_time - run.start_time if run.end_time > 0 else 0
        }

class MetaPromptOptimizer:
    """
    Complete Meta-Prompt Optimization System
    
    Automatically evolves prompts using LLM-directed optimization
    
    Based on OpenEvolve research
    Target: Surpass human prompter performance
    """
    
    def __init__(
        self,
        llm_client: Optional[anthropic.Anthropic] = None,
        population_size: int = 10,
        num_generations: int = 10,
        mutation_rate: float = 0.7,
        crossover_rate: float = 0.3,
        elitism: int = 2
    ):
        self.llm = llm_client or anthropic.Anthropic()
        
        # Evolution parameters
        self.population_size = population_size
        self.num_generations = num_generations
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elitism = elitism  # Keep top N unchanged
        
        # Components
        self.mutator = PromptMutator(self.llm)
        self.crossover = InspirationCrossover(self.llm)
        self.evaluator = PromptEvaluator(self.llm)
        self.tracker = EvolutionTracker()
    
    async def optimize(
        self,
        base_prompt: str,
        target_task: str,
        evaluation_dataset: List[Dict],
        run_id: Optional[str] = None
    ) -> PromptVariant:
        """
        Optimize prompt through evolution
        
        Process:
        1. Initialize population with base prompt
        2. For each generation:
           a. Evaluate all prompts
           b. Select top performers
           c. Generate new variants (mutation + crossover)
           d. Replace worst performers
        3. Return best prompt
        """
        if run_id is None:
            run_id = f"run_{int(time.time())}"
        
        # Create evolution run
        run = self.tracker.create_run(
            run_id,
            base_prompt,
            target_task,
            self.num_generations,
            self.population_size
        )
        
        # Initialize population
        population = await self._initialize_population(base_prompt)
        
        print(f"🧬 Starting meta-prompt evolution: {run_id}")
        print(f"📊 Population: {self.population_size}, Generations: {self.num_generations}")
        
        # Evolution loop
        for gen in range(self.num_generations):
            print(f"\n🔄 Generation {gen + 1}/{self.num_generations}")
            
            # Evaluate all prompts
            await self._evaluate_population(population, evaluation_dataset, target_task)
            
            # Record generation
            self.tracker.record_generation(run_id, gen, population)
            
            # Show progress
            best = max(population, key=lambda p: p.score)
            avg_score = np.mean([p.score for p in population])
            print(f"   Best: {best.score:.3f} | Avg: {avg_score:.3f} | ID: {best.prompt_id}")
            
            # Generate next generation
            if gen < self.num_generations - 1:
                population = await self._evolve_population(
                    population,
                    target_task
                )
        
        # Finalize
        self.tracker.finalize_run(run_id)
        best_prompt = max(population, key=lambda p: p.score)
        
        print(f"\n✅ Evolution complete!")
        print(f"   Base score: {population[0].score:.3f}")
        print(f"   Final best: {best_prompt.score:.3f}")
        print(f"   Improvement: {best_prompt.score - population[0].score:.3f}")
        
        return best_prompt
    
    async def _initialize_population(
        self,
        base_prompt: str
    ) -> List[PromptVariant]:
        """
        Initialize population with base prompt + variations
        """
        # Base prompt
        base_variant = PromptVariant(
            prompt_id="gen0_base",
            text=base_prompt,
            generation=0
        )
        
        population = [base_variant]
        
        # Generate initial variations
        mutation_types = list(MutationType)
        
        for i in range(self.population_size - 1):
            mutation_type = mutation_types[i % len(mutation_types)]
            variant = await self.mutator.mutate(base_variant, mutation_type)
            population.append(variant)
        
        return population
    
    async def _evaluate_population(
        self,
        population: List[PromptVariant],
        evaluation_dataset: List[Dict],
        target_task: str
    ):
        """Evaluate all prompts in population"""
        tasks = [
            self.evaluator.evaluate(variant, evaluation_dataset, target_task)
            for variant in population
        ]
        
        await asyncio.gather(*tasks)
    
    async def _evolve_population(
        self,
        population: List[PromptVariant],
        target_task: str
    ) -> List[PromptVariant]:
        """
        Generate next generation
        
        Strategy:
        1. Keep top N (elitism)
        2. Generate new variants via mutation
        3. Generate new variants via crossover
        4. Replace worst performers
        """
        # Sort by score
        population.sort(key=lambda p: p.score, reverse=True)
        
        # Elitism: keep top performers
        new_population = population[:self.elitism].copy()
        
        # Calculate how many new variants to create
        num_to_create = self.population_size - self.elitism
        num_mutations = int(num_to_create * self.mutation_rate)
        num_crossovers = num_to_create - num_mutations
        
        # Mutation: select parents via tournament
        for _ in range(num_mutations):
            parent = self._tournament_selection(population)
            mutant = await self.mutator.mutate(parent)
            new_population.append(mutant)
        
        # Crossover: combine top performers
        for _ in range(num_crossovers):
            parents = random.sample(population[:5], k=min(3, len(population)))
            offspring = await self.crossover.crossover(parents, target_task)
            new_population.append(offspring)
        
        return new_population
    
    def _tournament_selection(
        self,
        population: List[PromptVariant],
        tournament_size: int = 3
    ) -> PromptVariant:
        """Select parent via tournament"""
        tournament = random.sample(population, min(tournament_size, len(population)))
        return max(tournament, key=lambda p: p.score)
    
    def get_evolution_history(self, run_id: str) -> Dict[str, Any]:
        """Get evolution history for a run"""
        return self.tracker.get_evolution_history(run_id)


# FastAPI Endpoints
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/v1/optimization/prompts", tags=["prompt-optimization"])

# Global optimizer instance
optimizer: Optional[MetaPromptOptimizer] = None

def get_optimizer() -> MetaPromptOptimizer:
    """Get or create optimizer instance"""
    global optimizer
    if optimizer is None:
        optimizer = MetaPromptOptimizer()
    return optimizer

class OptimizationRequest(BaseModel):
    base_prompt: str
    target_task: str
    evaluation_dataset: List[Dict]
    num_generations: int = 10
    population_size: int = 10
    run_id: Optional[str] = None

class OptimizationResponse(BaseModel):
    run_id: str
    best_prompt: str
    base_score: float
    final_score: float
    improvement: float
    num_generations: int

@router.post("/optimize")
async def optimize_prompt(request: OptimizationRequest) -> OptimizationResponse:
    """
    Optimize a prompt using meta-evolution
    
    This surpasses human prompter performance!
    """
    try:
        opt = get_optimizer()
        opt.num_generations = request.num_generations
        opt.population_size = request.population_size
        
        # Run optimization
        best_variant = await opt.optimize(
            request.base_prompt,
            request.target_task,
            request.evaluation_dataset,
            request.run_id
        )
        
        # Get history
        history = opt.get_evolution_history(best_variant.prompt_id.split('_')[0])
        
        base_score = history['generations'][0]['best_score'] if history.get('generations') else 0.0
        
        return OptimizationResponse(
            run_id=history['run_id'],
            best_prompt=best_variant.text,
            base_score=base_score,
            final_score=best_variant.score,
            improvement=best_variant.score - base_score,
            num_generations=len(history.get('generations', []))
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{run_id}")
async def get_evolution_history(run_id: str) -> Dict[str, Any]:
    """Get evolution history for a run"""
    try:
        opt = get_optimizer()
        history = opt.get_evolution_history(run_id)
        
        if not history:
            raise HTTPException(status_code=404, detail="Run not found")
        
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
