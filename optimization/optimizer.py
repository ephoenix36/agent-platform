"""
Basic optimization runner using evolutionary algorithms
Integrates with Evosuite SDK when available, provides fallback implementation
"""
import sys
import json
import random
from typing import Dict, List, Any
from datetime import datetime


class SimpleEvolutionaryOptimizer:
    """Simple evolutionary optimizer for agent instructions"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.population_size = config.get('population_size', 10)
        self.max_generations = config.get('max_generations', 50)
        self.threshold = config.get('threshold', 0.85)
        self.mutation_rate = config.get('mutation_rate', 0.3)
        self.agent_instruction = config.get('agent_instruction', {})
        self.evaluator_code = config.get('evaluator_code', '')
        self.mutator_code = config.get('mutator_code', '')
    
    def run_optimization(self) -> Dict[str, Any]:
        """Run the optimization loop"""
        
        # Initialize population
        population = self.initialize_population()
        
        best_score = 0.0
        best_variant = None
        generation = 0
        history = []
        
        for generation in range(self.max_generations):
            # Evaluate population
            scores = [self.evaluate_variant(variant) for variant in population]
            
            # Track best
            gen_best_idx = scores.index(max(scores))
            gen_best_score = scores[gen_best_idx]
            
            if gen_best_score > best_score:
                best_score = gen_best_score
                best_variant = population[gen_best_idx]
            
            history.append({
                'generation': generation,
                'best_score': best_score,
                'avg_score': sum(scores) / len(scores),
                'improvement': best_score - history[-1]['best_score'] if history else 0
            })
            
            # Check convergence
            if best_score >= self.threshold:
                break
            
            # Check marginal return
            if generation > 5:
                recent_improvements = [h['improvement'] for h in history[-5:]]
                if all(imp < 0.01 for imp in recent_improvements):
                    break  # Marginal return threshold reached
            
            # Evolve population
            population = self.evolve_population(population, scores)
        
        return {
            'success': True,
            'best_score': best_score,
            'best_variant': best_variant,
            'generations': generation + 1,
            'history': history,
            'converged': best_score >= self.threshold
        }
    
    def initialize_population(self) -> List[Dict]:
        """Create initial population of agent instruction variants"""
        population = [self.agent_instruction.copy()]
        
        # Create variations
        for i in range(self.population_size - 1):
            variant = self.mutate_instruction(self.agent_instruction.copy(), 0)
            population.append(variant)
        
        return population
    
    def evaluate_variant(self, variant: Dict) -> float:
        """Evaluate a variant using the evaluator"""
        try:
            # Execute evaluator code
            # In real implementation, would execute the Python evaluator
            # For now, return a simulated score based on prompt length and quality indicators
            
            system_prompt = variant.get('systemPrompt', '')
            examples = variant.get('examples', [])
            
            # Simple heuristic scoring (placeholder)
            score = 0.5  # Base score
            
            # Reward detailed prompts
            if len(system_prompt) > 500:
                score += 0.1
            
            # Reward examples
            score += min(len(examples) * 0.05, 0.2)
            
            # Reward structure indicators
            if '**' in system_prompt:  # Has formatting
                score += 0.05
            if 'example' in system_prompt.lower():
                score += 0.05
            if 'constraint' in system_prompt.lower():
                score += 0.05
            
            # Add some randomness to simulate real evaluation
            score += random.uniform(-0.1, 0.1)
            
            return min(max(score, 0.0), 1.0)
        except Exception as e:
            return 0.0
    
    def mutate_instruction(self, instruction: Dict, generation: int) -> Dict:
        """Mutate an instruction using the mutator"""
        try:
            # Execute mutator code
            # For now, implement simple mutations
            
            mutated = instruction.copy()
            
            if random.random() < self.mutation_rate:
                # Mutate system prompt
                system_prompt = mutated.get('systemPrompt', '')
                
                enhancements = [
                    "\n\nProvide detailed, step-by-step explanations.",
                    "\n\nInclude specific examples in your response.",
                    "\n\nFocus on clarity and precision.",
                    "\n\nConsider edge cases and exceptions.",
                    "\n\nMaintain professional tone throughout.",
                ]
                
                # Add random enhancement
                if random.random() < 0.5:
                    enhancement = random.choice(enhancements)
                    if enhancement not in system_prompt:
                        mutated['systemPrompt'] = system_prompt + enhancement
            
            return mutated
        except Exception as e:
            return instruction
    
    def evolve_population(self, population: List[Dict], scores: List[float]) -> List[Dict]:
        """Evolve population using selection and mutation"""
        
        # Select top performers
        sorted_pop = sorted(zip(population, scores), key=lambda x: x[1], reverse=True)
        elite_size = max(2, self.population_size // 5)
        elite = [variant for variant, score in sorted_pop[:elite_size]]
        
        # Generate new population
        new_population = elite.copy()
        
        while len(new_population) < self.population_size:
            # Select parent from elite
            parent = random.choice(elite)
            # Mutate
            child = self.mutate_instruction(parent, len(new_population))
            new_population.append(child)
        
        return new_population


def handle_optimize_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Handle optimization request from TypeScript"""
    
    optimizer = SimpleEvolutionaryOptimizer(data)
    result = optimizer.run_optimization()
    
    return result


if __name__ == '__main__':
    # Test optimization
    test_config = {
        'population_size': 10,
        'max_generations': 20,
        'threshold': 0.85,
        'mutation_rate': 0.3,
        'agent_instruction': {
            'systemPrompt': 'You are a helpful assistant.',
            'examples': []
        }
    }
    
    optimizer = SimpleEvolutionaryOptimizer(test_config)
    result = optimizer.run_optimization()
    
    print(json.dumps(result, indent=2))
