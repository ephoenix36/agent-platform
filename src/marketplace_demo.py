"""
Agent Marketplace Demo - End-to-End Demonstration

Shows the complete marketplace workflow:
1. Load seed agents
2. Submit research tasks
3. Execute agents in parallel
4. Evaluate and select winners
5. Update leaderboards
6. Show marketplace evolution
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agent_registry import AgentRegistry, AgentCategory
from task_execution_engine import TaskExecutionEngine
from seed_agents import create_seed_agents


async def run_marketplace_demo():
    """
    Complete marketplace demonstration
    """
    print("\n" + "="*80)
    print("🚀 AGENT MARKETPLACE - LIVE DEMO")
    print("="*80)
    
    # Step 1: Initialize marketplace
    print("\n📦 Step 1: Initialize Marketplace")
    print("-" * 80)
    
    registry = AgentRegistry(storage_path="marketplace_demo.json")
    
    # Register seed agents
    seed_agents = create_seed_agents()
    for agent in seed_agents:
        registry.register(agent)
    
    print(f"✅ Loaded {len(seed_agents)} agents into marketplace")
    print(f"   Categories: Research ({len([a for a in seed_agents if a.category == AgentCategory.RESEARCH])}), "
          f"Analysis ({len([a for a in seed_agents if a.category == AgentCategory.ANALYSIS])})")
    
    # Create execution engine
    engine = TaskExecutionEngine(registry)
    
    # Step 2: Submit multiple tasks
    print("\n📝 Step 2: Submit Research Tasks")
    print("-" * 80)
    
    tasks_to_submit = [
        {
            "description": "Research the latest advancements in evolutionary AI and algorithm discovery using LLMs",
            "category": AgentCategory.RESEARCH
        },
        {
            "description": "Analyze the performance metrics and benchmarks of AlphaEvolve vs OpenEvolve implementations",
            "category": AgentCategory.ANALYSIS
        },
        {
            "description": "Find and summarize key academic papers on prompt evolution and optimization techniques from 2024-2025",
            "category": AgentCategory.RESEARCH
        }
    ]
    
    submitted_tasks = []
    for i, task_data in enumerate(tasks_to_submit, 1):
        task = await engine.submit_task(
            user_id="demo_user",
            description=task_data["description"],
            category=task_data["category"],
            max_agents=3
        )
        submitted_tasks.append(task)
        print(f"\n✅ Task {i}: {task_data['description'][:60]}...")
        print(f"   Category: {task.category.value}")
        print(f"   Agents selected: {len(task.selected_agents)}")
    
    # Step 3: Execute tasks
    print("\n⚡ Step 3: Execute Tasks in Parallel")
    print("-" * 80)
    
    print("\nRunning agents across all tasks... (this may take a few seconds)\n")
    
    # Execute all tasks concurrently
    execution_tasks = [engine.execute_task(task.id) for task in submitted_tasks]
    completed_tasks = await asyncio.gather(*execution_tasks)
    
    print(f"✅ All {len(completed_tasks)} tasks completed!")
    
    # Step 4: Show results for each task
    print("\n📊 Step 4: Task Results")
    print("=" * 80)
    
    for i, task in enumerate(completed_tasks, 1):
        print(f"\n🎯 TASK {i}: {task.description[:70]}...")
        print("-" * 80)
        
        duration = (task.completed_at - task.started_at).total_seconds()
        print(f"Status: {task.status.value} | Duration: {duration:.2f}s")
        print(f"\nAgent Performance:")
        
        # Sort results by fitness
        sorted_results = sorted(task.results, key=lambda r: r.fitness_score, reverse=True)
        
        for rank, result in enumerate(sorted_results, 1):
            winner_mark = "🏆" if result.agent_id == task.winner_agent_id else "  "
            print(f"\n{winner_mark} {rank}. {result.agent_name}")
            print(f"   Fitness: {result.fitness_score:.3f} | Time: {result.execution_time:.2f}s")
            print(f"   Quality: {result.quality_score:.2f} | Relevance: {result.relevance_score:.2f} | "
                  f"Completeness: {result.completeness_score:.2f}")
    
    # Step 5: Show updated leaderboard
    print("\n\n🏆 Step 5: Updated Agent Leaderboard")
    print("=" * 80)
    
    leaderboard = registry.get_leaderboard(limit=10)
    
    print("\nOverall Rankings:")
    print()
    for entry in leaderboard:
        agent = registry.get(entry['id'])
        print(f"{entry['rank']}. {entry['name']} ({entry['category']})")
        print(f"   Performance: {entry['performance_score']}/100")
        print(f"   Tasks: {entry['tasks_completed']} | Success: {entry['success_rate']} | "
              f"Rating: {entry['user_rating']}")
        print(f"   Earnings: {entry['total_earnings']} | Price: ${agent.price_per_execution}")
        print()
    
    # Step 6: Show category leaders
    print("=" * 80)
    print("📊 Step 6: Category Leaders")
    print("=" * 80)
    
    categories = [AgentCategory.RESEARCH, AgentCategory.ANALYSIS]
    
    for category in categories:
        print(f"\n{category.value.upper()} Category:")
        print("-" * 40)
        
        cat_agents = registry.get_by_category(category, limit=5)
        for i, agent in enumerate(cat_agents, 1):
            print(f"{i}. {agent.name} - Score: {agent.performance_score:.1f}/100 | "
                  f"Tasks: {agent.tasks_completed} | ${agent.total_earnings:.2f} earned")
    
    # Step 7: Market statistics
    print("\n\n💰 Step 7: Marketplace Statistics")
    print("=" * 80)
    
    total_agents = len(registry.agents)
    total_tasks = len(engine.tasks)
    total_earnings = sum(agent.total_earnings for agent in registry.agents.values())
    avg_task_time = sum(
        (task.completed_at - task.started_at).total_seconds()
        for task in completed_tasks
    ) / len(completed_tasks)
    
    total_executions = sum(agent.tasks_completed for agent in registry.agents.values())
    
    print(f"""
📈 Market Overview:
   • Total Agents: {total_agents}
   • Total Tasks: {total_tasks}
   • Total Executions: {total_executions}
   • Total Earnings: ${total_earnings:.2f}
   • Avg Task Time: {avg_task_time:.2f}s

🎯 Agent Performance:
   • Highest Score: {max(agent.performance_score for agent in registry.agents.values()):.1f}/100
   • Avg Score: {sum(agent.performance_score for agent in registry.agents.values()) / total_agents:.1f}/100
   • Top Earner: ${max(agent.total_earnings for agent in registry.agents.values()):.2f}

💡 Marketplace Health:
   • Active Agents: {sum(1 for agent in registry.agents.values() if agent.is_active)}
   • Avg Price: ${sum(agent.price_per_execution for agent in registry.agents.values()) / total_agents:.3f}
   • Success Rate: {sum(agent.success_rate for agent in registry.agents.values() if agent.tasks_completed > 0) / sum(1 for agent in registry.agents.values() if agent.tasks_completed > 0):.1%}
""")
    
    print("=" * 80)
    print("✨ MARKETPLACE DEMO COMPLETE!")
    print("=" * 80)
    
    print("""
🎉 What Just Happened:

1. ✅ Initialized marketplace with 5 specialized research agents
2. ✅ Submitted 3 different research tasks
3. ✅ Ran agents in parallel (competitive execution)
4. ✅ Evaluated results using multi-objective fitness
5. ✅ Selected winners and paid earnings
6. ✅ Updated agent performance scores
7. ✅ Generated leaderboards and statistics

🚀 Next Steps:

- Integrate real LLM calls (currently simulated)
- Add OpenEvolve for agent evolution
- Build web UI (Next.js + shadcn/ui)
- Connect Stripe for payments
- Deploy to production (Vercel + Railway)

💡 The Foundation is SOLID. Ready for production! 💪
""")


if __name__ == "__main__":
    asyncio.run(run_marketplace_demo())
