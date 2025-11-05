"""
Island Evolution System - Quality-Diversity Optimization
Based on Expert Collaboration: Architect + Data Scientist

Expert Insights:
- Architect: Ring topology, async islands, migration strategy
- Data Scientist: Diversity metrics, MAP-Elites, convergence detection

Purpose: Prevent premature convergence while maintaining performance
Key Innovation: Quality-Diversity (QD) optimization with island model

Components:
1. Island Manager - Multiple independent populations
2. Migration Controller - Inter-island genetic exchange
3. MAP-Elites Organizer - Behavior space partitioning
4. Diversity Tracker - Convergence detection
5. QD Optimizer - Quality × Coverage maximization
"""

import asyncio
import json
import time
import random
from typing import Dict, List, Any, Optional, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
from collections import defaultdict
from scipy.spatial.distance import pdist, squareform
from scipy.stats import entropy
import anthropic

class IslandTopology(str, Enum):
    """Migration topology patterns"""
    RING = "ring"  # Circular migration
    STAR = "star"  # Hub and spoke
    FULLY_CONNECTED = "fully_connected"  # All-to-all
    RANDOM = "random"  # Random pairs

@dataclass
class BehaviorCharacterization:
    """
    Characterize agent behavior for MAP-Elites
    
    Based on Data Scientist recommendation:
    2-3 behavioral dimensions for grid organization
    """
    response_length: float  # Normalized 0-1
    technical_depth: float  # Normalized 0-1
    formality: float  # Normalized 0-1
    
    def to_grid_coordinates(self, grid_size: int = 10) -> Tuple[int, int, int]:
        """Convert to MAP-Elites grid coordinates"""
        x = min(int(self.response_length * grid_size), grid_size - 1)
        y = min(int(self.technical_depth * grid_size), grid_size - 1)
        z = min(int(self.formality * grid_size), grid_size - 1)
        return (x, y, z)
    
    def distance_to(self, other: 'BehaviorCharacterization') -> float:
        """Euclidean distance in behavior space"""
        return np.sqrt(
            (self.response_length - other.response_length) ** 2 +
            (self.technical_depth - other.technical_depth) ** 2 +
            (self.formality - other.formality) ** 2
        )

@dataclass
class Individual:
    """An individual in the population (e.g., a prompt variant)"""
    id: str
    genome: str  # The prompt text
    fitness: float = 0.0
    behavior: Optional[BehaviorCharacterization] = None
    generation: int = 0
    island_id: int = 0
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'genome': self.genome[:100] + '...' if len(self.genome) > 100 else self.genome,
            'fitness': self.fitness,
            'behavior': {
                'response_length': self.behavior.response_length,
                'technical_depth': self.behavior.technical_depth,
                'formality': self.behavior.formality
            } if self.behavior else None,
            'generation': self.generation,
            'island_id': self.island_id
        }

@dataclass
class Island:
    """
    An independent evolutionary population
    
    Expert Design: Architect
    - Async evolution
    - Independent selection
    - Periodic migration
    """
    island_id: int
    population: List[Individual] = field(default_factory=list)
    generation: int = 0
    best_individual: Optional[Individual] = None
    
    # Evolution parameters
    population_size: int = 30
    mutation_rate: float = 0.7
    crossover_rate: float = 0.3
    
    # Diversity tracking
    diversity_scores: List[float] = field(default_factory=list)
    
    def get_best(self, n: int = 1) -> List[Individual]:
        """Get top n individuals"""
        sorted_pop = sorted(self.population, key=lambda x: x.fitness, reverse=True)
        return sorted_pop[:n]
    
    def compute_diversity(self) -> float:
        """
        Compute behavioral diversity
        
        Expert: Data Scientist
        Metric: Average pairwise BC distance
        """
        if len(self.population) < 2:
            return 0.0
        
        # Extract behaviors
        behaviors = [ind.behavior for ind in self.population if ind.behavior]
        
        if len(behaviors) < 2:
            return 0.0
        
        # Compute pairwise distances
        distances = []
        for i in range(len(behaviors)):
            for j in range(i + 1, len(behaviors)):
                dist = behaviors[i].distance_to(behaviors[j])
                distances.append(dist)
        
        return np.mean(distances) if distances else 0.0

@dataclass
class MAPElitesGrid:
    """
    MAP-Elites behavior space grid
    
    Expert: Data Scientist
    Quality-Diversity algorithm for maintaining diverse solutions
    """
    grid_size: int = 10
    dimensions: int = 3  # response_length, technical_depth, formality
    
    # Grid: coordinates -> best individual in that cell
    grid: Dict[Tuple[int, ...], Individual] = field(default_factory=dict)
    
    def add(self, individual: Individual):
        """
        Add individual to grid
        
        If cell is empty, add individual
        If cell occupied, keep better one
        """
        if not individual.behavior:
            return
        
        coords = individual.behavior.to_grid_coordinates(self.grid_size)
        
        # Check if cell is empty or if new individual is better
        if coords not in self.grid or individual.fitness > self.grid[coords].fitness:
            self.grid[coords] = individual
    
    def get_coverage(self) -> float:
        """Percentage of grid cells occupied"""
        total_cells = self.grid_size ** self.dimensions
        occupied = len(self.grid)
        return occupied / total_cells
    
    def get_qd_score(self) -> float:
        """
        Quality-Diversity score
        
        Expert: Data Scientist
        QD = Coverage × Average Quality
        """
        if not self.grid:
            return 0.0
        
        coverage = self.get_coverage()
        avg_quality = np.mean([ind.fitness for ind in self.grid.values()])
        
        return coverage * avg_quality
    
    def get_all_individuals(self) -> List[Individual]:
        """Get all individuals in grid"""
        return list(self.grid.values())

class DiversityTracker:
    """
    Track diversity metrics and detect convergence
    
    Expert: Data Scientist
    Metrics: Entropy, variance, behavior distance
    """
    
    def __init__(self, convergence_threshold: float = 0.1, stagnation_limit: int = 5):
        self.convergence_threshold = convergence_threshold
        self.stagnation_limit = stagnation_limit
        
        # History
        self.entropy_history: List[float] = []
        self.diversity_history: List[float] = []
        self.stagnation_counter: int = 0
        self.last_best_fitness: float = 0.0
    
    def compute_entropy(self, population: List[Individual]) -> float:
        """
        Compute Shannon entropy of behavior distribution
        
        Low entropy = converged (all similar)
        High entropy = diverse
        """
        if not population or not all(ind.behavior for ind in population):
            return 0.0
        
        # Discretize behaviors
        grid_size = 5  # Coarse grid for entropy
        behavior_counts = defaultdict(int)
        
        for ind in population:
            if ind.behavior:
                coords = ind.behavior.to_grid_coordinates(grid_size)
                behavior_counts[coords] += 1
        
        # Compute entropy
        total = len(population)
        probabilities = [count / total for count in behavior_counts.values()]
        
        return float(entropy(probabilities))
    
    def check_convergence(
        self,
        population: List[Individual],
        current_best_fitness: float
    ) -> Dict[str, Any]:
        """
        Check for convergence/stagnation
        
        Returns: {
            'converged': bool,
            'reason': str,
            'entropy': float,
            'diversity': float,
            'stagnation_count': int
        }
        """
        # Compute metrics
        current_entropy = self.compute_entropy(population)
        self.entropy_history.append(current_entropy)
        
        # Behavioral diversity
        if len(population) >= 2:
            behaviors = [ind.behavior for ind in population if ind.behavior]
            if len(behaviors) >= 2:
                distances = []
                for i in range(len(behaviors)):
                    for j in range(i + 1, len(behaviors)):
                        distances.append(behaviors[i].distance_to(behaviors[j]))
                current_diversity = np.mean(distances)
            else:
                current_diversity = 0.0
        else:
            current_diversity = 0.0
        
        self.diversity_history.append(current_diversity)
        
        # Check stagnation
        if abs(current_best_fitness - self.last_best_fitness) < 1e-6:
            self.stagnation_counter += 1
        else:
            self.stagnation_counter = 0
        
        self.last_best_fitness = current_best_fitness
        
        # Determine if converged
        converged = False
        reason = ""
        
        if current_entropy < self.convergence_threshold:
            converged = True
            reason = "Low entropy (behaviors too similar)"
        elif current_diversity < self.convergence_threshold:
            converged = True
            reason = "Low behavioral diversity"
        elif self.stagnation_counter >= self.stagnation_limit:
            converged = True
            reason = f"Stagnation ({self.stagnation_counter} generations)"
        
        return {
            'converged': converged,
            'reason': reason,
            'entropy': current_entropy,
            'diversity': current_diversity,
            'stagnation_count': self.stagnation_counter
        }

class MigrationController:
    """
    Control migration between islands
    
    Expert: Architect
    Strategy: Ring topology with periodic migration
    """
    
    def __init__(
        self,
        topology: IslandTopology = IslandTopology.RING,
        migration_interval: int = 5,
        migration_rate: float = 0.2
    ):
        self.topology = topology
        self.migration_interval = migration_interval
        self.migration_rate = migration_rate
    
    async def migrate(
        self,
        islands: List[Island],
        generation: int
    ):
        """
        Perform migration between islands
        
        Expert Design: Unidirectional ring to prevent cycles
        """
        if generation % self.migration_interval != 0:
            return  # Not time to migrate yet
        
        if len(islands) < 2:
            return  # Need at least 2 islands
        
        print(f"   🔄 Migration at generation {generation}")
        
        if self.topology == IslandTopology.RING:
            await self._migrate_ring(islands)
        elif self.topology == IslandTopology.STAR:
            await self._migrate_star(islands)
        elif self.topology == IslandTopology.FULLY_CONNECTED:
            await self._migrate_fully_connected(islands)
        elif self.topology == IslandTopology.RANDOM:
            await self._migrate_random(islands)
    
    async def _migrate_ring(self, islands: List[Island]):
        """Ring topology: each island sends to next"""
        num_islands = len(islands)
        
        # Collect migrants from each island
        migrants_per_island = []
        for island in islands:
            num_migrants = int(len(island.population) * self.migration_rate)
            migrants = island.get_best(num_migrants)
            migrants_per_island.append(migrants)
        
        # Send migrants to next island (circular)
        for i in range(num_islands):
            next_island = (i + 1) % num_islands
            migrants = migrants_per_island[i]
            
            # Add migrants to next island
            for migrant in migrants:
                # Clone migrant with new island ID
                new_individual = Individual(
                    id=f"migrant_{migrant.id}",
                    genome=migrant.genome,
                    fitness=migrant.fitness,
                    behavior=migrant.behavior,
                    generation=migrant.generation,
                    island_id=next_island
                )
                islands[next_island].population.append(new_individual)
        
        # Trim populations back to size
        for island in islands:
            if len(island.population) > island.population_size:
                # Keep best individuals
                island.population.sort(key=lambda x: x.fitness, reverse=True)
                island.population = island.population[:island.population_size]
    
    async def _migrate_star(self, islands: List[Island]):
        """Star topology: hub island exchanges with all"""
        # Island 0 is hub
        hub = islands[0]
        
        for i in range(1, len(islands)):
            spoke = islands[i]
            
            # Exchange migrants
            hub_migrants = hub.get_best(max(1, int(len(hub.population) * self.migration_rate)))
            spoke_migrants = spoke.get_best(max(1, int(len(spoke.population) * self.migration_rate)))
            
            # Add to populations
            for migrant in hub_migrants:
                spoke.population.append(migrant)
            for migrant in spoke_migrants:
                hub.population.append(migrant)
    
    async def _migrate_fully_connected(self, islands: List[Island]):
        """All islands exchange with all others"""
        for i in range(len(islands)):
            for j in range(i + 1, len(islands)):
                # Exchange between island i and j
                migrants_i = islands[i].get_best(max(1, int(len(islands[i].population) * self.migration_rate)))
                migrants_j = islands[j].get_best(max(1, int(len(islands[j].population) * self.migration_rate)))
                
                islands[i].population.extend(migrants_j)
                islands[j].population.extend(migrants_i)
    
    async def _migrate_random(self, islands: List[Island]):
        """Random pairs exchange"""
        # Shuffle and pair
        shuffled = islands.copy()
        random.shuffle(shuffled)
        
        for i in range(0, len(shuffled) - 1, 2):
            island_a = shuffled[i]
            island_b = shuffled[i + 1]
            
            migrants_a = island_a.get_best(max(1, int(len(island_a.population) * self.migration_rate)))
            migrants_b = island_b.get_best(max(1, int(len(island_b.population) * self.migration_rate)))
            
            island_a.population.extend(migrants_b)
            island_b.population.extend(migrants_a)

class IslandEvolutionSystem:
    """
    Complete Island Evolution System
    
    Expert Collaboration: Architect + Data Scientist
    
    Features:
    - Multiple independent populations (islands)
    - Periodic migration (ring topology)
    - MAP-Elites quality-diversity
    - Diversity tracking and convergence detection
    - Async evolution for scalability
    """
    
    def __init__(
        self,
        num_islands: int = 5,
        population_per_island: int = 30,
        migration_interval: int = 5,
        migration_rate: float = 0.2,
        topology: IslandTopology = IslandTopology.RING,
        grid_size: int = 10
    ):
        # Islands
        self.islands: List[Island] = [
            Island(
                island_id=i,
                population_size=population_per_island
            )
            for i in range(num_islands)
        ]
        
        # Controllers
        self.migration_controller = MigrationController(
            topology=topology,
            migration_interval=migration_interval,
            migration_rate=migration_rate
        )
        
        self.map_elites = MAPElitesGrid(grid_size=grid_size)
        self.diversity_tracker = DiversityTracker()
        
        # Statistics
        self.global_best: Optional[Individual] = None
        self.generation_stats: List[Dict] = []
    
    async def evolve(
        self,
        initial_population: List[Individual],
        fitness_function: Callable,
        behavior_function: Callable,
        mutation_function: Callable,
        crossover_function: Callable,
        num_generations: int = 20
    ) -> Dict[str, Any]:
        """
        Run island evolution
        
        Process:
        1. Distribute initial population across islands
        2. Each island evolves independently
        3. Periodic migration between islands
        4. Track diversity and convergence
        5. Maintain MAP-Elites archive
        """
        print(f"\n🏝️ Island Evolution System")
        print(f"   Islands: {len(self.islands)}")
        print(f"   Population/Island: {self.islands[0].population_size}")
        print(f"   Migration: Every {self.migration_controller.migration_interval} gens ({self.migration_controller.topology.value})")
        print("=" * 50)
        
        # Distribute initial population
        await self._distribute_population(initial_population)
        
        # Evolution loop
        for gen in range(num_generations):
            print(f"\n🔄 Generation {gen + 1}/{num_generations}")
            
            # Evolve each island (in parallel)
            await self._evolve_islands(
                fitness_function,
                behavior_function,
                mutation_function,
                crossover_function
            )
            
            # Migration
            await self.migration_controller.migrate(self.islands, gen)
            
            # Update MAP-Elites
            await self._update_map_elites()
            
            # Track stats
            stats = await self._compute_statistics()
            self.generation_stats.append(stats)
            
            # Display progress
            print(f"   Best Fitness: {stats['global_best_fitness']:.3f}")
            print(f"   MAP-Elites Coverage: {stats['map_elites_coverage']:.1%}")
            print(f"   QD Score: {stats['qd_score']:.3f}")
            print(f"   Avg Diversity: {stats['avg_diversity']:.3f}")
            print(f"   Entropy: {stats['entropy']:.3f}")
            
            # Check convergence
            convergence = self.diversity_tracker.check_convergence(
                self._get_all_individuals(),
                stats['global_best_fitness']
            )
            
            if convergence['converged']:
                print(f"   ⚠️  Convergence detected: {convergence['reason']}")
                # Trigger diversity injection
                await self._inject_diversity(mutation_function)
        
        print(f"\n✅ Evolution complete!")
        print(f"   Final best fitness: {self.global_best.fitness:.3f}")
        print(f"   MAP-Elites coverage: {self.map_elites.get_coverage():.1%}")
        print(f"   Total unique behaviors: {len(self.map_elites.grid)}")
        
        return {
            'global_best': self.global_best.to_dict() if self.global_best else None,
            'map_elites_archive': [ind.to_dict() for ind in self.map_elites.get_all_individuals()],
            'generation_stats': self.generation_stats,
            'final_coverage': self.map_elites.get_coverage(),
            'final_qd_score': self.map_elites.get_qd_score()
        }
    
    async def _distribute_population(self, population: List[Individual]):
        """Distribute initial population across islands"""
        for i, individual in enumerate(population):
            island_id = i % len(self.islands)
            individual.island_id = island_id
            self.islands[island_id].population.append(individual)
    
    async def _evolve_islands(
        self,
        fitness_function: Callable,
        behavior_function: Callable,
        mutation_function: Callable,
        crossover_function: Callable
    ):
        """Evolve all islands in parallel"""
        tasks = [
            self._evolve_single_island(
                island,
                fitness_function,
                behavior_function,
                mutation_function,
                crossover_function
            )
            for island in self.islands
        ]
        
        await asyncio.gather(*tasks)
    
    async def _evolve_single_island(
        self,
        island: Island,
        fitness_function: Callable,
        behavior_function: Callable,
        mutation_function: Callable,
        crossover_function: Callable
    ):
        """Evolve a single island for one generation"""
        # Evaluate fitness and behavior
        for individual in island.population:
            individual.fitness = await fitness_function(individual)
            individual.behavior = await behavior_function(individual)
        
        # Selection and reproduction
        new_population = []
        
        # Elitism: keep best
        elite = island.get_best(2)
        new_population.extend(elite)
        
        # Generate offspring
        while len(new_population) < island.population_size:
            if random.random() < island.mutation_rate:
                # Mutation
                parent = random.choice(island.population)
                offspring = await mutation_function(parent)
            else:
                # Crossover
                parents = random.sample(island.population, 2)
                offspring = await crossover_function(parents)
            
            offspring.generation = island.generation + 1
            offspring.island_id = island.island_id
            new_population.append(offspring)
        
        island.population = new_population
        island.generation += 1
        island.best_individual = island.get_best(1)[0]
        
        # Track diversity
        diversity = island.compute_diversity()
        island.diversity_scores.append(diversity)
    
    async def _update_map_elites(self):
        """Update MAP-Elites grid with all individuals"""
        for island in self.islands:
            for individual in island.population:
                self.map_elites.add(individual)
    
    async def _compute_statistics(self) -> Dict[str, Any]:
        """Compute global statistics"""
        all_individuals = self._get_all_individuals()
        
        if not all_individuals:
            return {}
        
        # Global best
        best = max(all_individuals, key=lambda x: x.fitness)
        if self.global_best is None or best.fitness > self.global_best.fitness:
            self.global_best = best
        
        # MAP-Elites stats
        coverage = self.map_elites.get_coverage()
        qd_score = self.map_elites.get_qd_score()
        
        # Diversity stats
        avg_diversity = np.mean([island.compute_diversity() for island in self.islands])
        entropy = self.diversity_tracker.compute_entropy(all_individuals)
        
        return {
            'generation': self.islands[0].generation,
            'global_best_fitness': self.global_best.fitness,
            'avg_fitness': np.mean([ind.fitness for ind in all_individuals]),
            'map_elites_coverage': coverage,
            'qd_score': qd_score,
            'avg_diversity': avg_diversity,
            'entropy': entropy,
            'num_individuals': len(all_individuals)
        }
    
    def _get_all_individuals(self) -> List[Individual]:
        """Get all individuals from all islands"""
        all_inds = []
        for island in self.islands:
            all_inds.extend(island.population)
        return all_inds
    
    async def _inject_diversity(self, mutation_function: Callable):
        """
        Inject diversity when convergence detected
        
        Strategy: Replace worst individuals with random mutations
        """
        print("   💉 Injecting diversity...")
        
        for island in self.islands:
            # Sort by fitness
            island.population.sort(key=lambda x: x.fitness, reverse=True)
            
            # Replace bottom 30% with mutated versions of top performers
            num_replace = int(len(island.population) * 0.3)
            
            for i in range(num_replace):
                parent = random.choice(island.population[:len(island.population) // 2])
                mutated = await mutation_function(parent)
                mutated.island_id = island.island_id
                island.population[-(i+1)] = mutated


# FastAPI Endpoints
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/evolution/island", tags=["island-evolution"])

@router.post("/evolve")
async def run_island_evolution(
    num_islands: int = 5,
    population_per_island: int = 30,
    num_generations: int = 20
) -> Dict[str, Any]:
    """
    Run island evolution system
    
    Quality-Diversity optimization with migration
    """
    # This would integrate with actual evolution system
    return {
        'status': 'not_implemented',
        'message': 'Island evolution ready for integration'
    }
