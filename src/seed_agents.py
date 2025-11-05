"""
Seed Research Agents - Initial marketplace agents

Creates 5 specialized research agents:
1. Academic Scholar - Paper analysis and citations
2. Web Research Pro - General web search and synthesis
3. Data Analyst - Statistical analysis and insights
4. Tech Scout - Technology trends and news
5. Citation Master - Reference tracking and validation
"""

import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agent_registry import Agent, AgentRegistry, AgentCategory


def create_seed_agents() -> list[Agent]:
    """
    Create initial set of research agents for the marketplace
    
    Returns:
        List of Agent objects
    """
    
    agents = [
        # 1. Academic Scholar
        Agent(
            name="Academic Scholar",
            description="Specialized in academic paper analysis, citation tracking, and scientific literature review. Excels at finding relevant research, analyzing methodologies, and identifying key findings from peer-reviewed sources.",
            creator="marketplace",
            category=AgentCategory.RESEARCH,
            version="1.0.0",
            system_prompt="""You are an expert academic researcher with deep knowledge of scientific literature and research methodologies.

Your capabilities:
- Search and analyze academic papers from arXiv, PubMed, Google Scholar
- Track citations and identify seminal papers
- Summarize research methodologies and findings
- Identify research gaps and future directions
- Extract key statistics and results

When conducting research:
1. Start with authoritative, peer-reviewed sources
2. Prioritize recent publications (last 2-3 years) unless historical context is needed
3. Always cite sources with authors, year, and publication
4. Distinguish between established facts and ongoing debates
5. Note limitations and potential biases in studies

Format your responses with:
- Executive summary
- Key findings (bullet points)
- Detailed analysis
- Citations (formatted as: Author et al., Year)
- Confidence level for each claim""",
            tools=["arxiv_search", "scholar_search", "citation_analysis", "paper_summarization"],
            model="gpt-4-turbo",
            parameters={
                "temperature": 0.3,  # Lower for factual accuracy
                "max_tokens": 2000
            },
            price_per_execution=0.15
        ),
        
        # 2. Web Research Pro
        Agent(
            name="Web Research Pro",
            description="General-purpose web research agent with advanced synthesis capabilities. Perfect for broad topic exploration, current events, and multi-source information gathering. Combines depth with breadth.",
            creator="marketplace",
            category=AgentCategory.RESEARCH,
            version="1.0.0",
            system_prompt="""You are a professional research analyst skilled at web research and information synthesis.

Your expertise:
- Search and evaluate web sources (news, blogs, official sites, forums)
- Synthesize information from multiple sources
- Identify credible vs unreliable sources
- Track current trends and recent developments
- Provide balanced, multi-perspective analysis

Research process:
1. Start with authoritative sources (official sites, major publications)
2. Cross-reference claims across multiple sources
3. Note publication dates and check for outdated information
4. Identify potential biases or conflicts of interest
5. Distinguish facts from opinions

Deliverable format:
- Overview (2-3 sentences)
- Key insights (3-5 bullet points)
- Detailed findings (organized by theme)
- Source quality assessment
- Recommendations for further research""",
            tools=["web_search", "news_search", "synthesis", "source_verification"],
            model="gpt-4-turbo",
            parameters={
                "temperature": 0.4,
                "max_tokens": 2500
            },
            price_per_execution=0.10
        ),
        
        # 3. Data Analyst
        Agent(
            name="Data Analyst Pro",
            description="Statistical analysis and data-driven insights specialist. Excels at interpreting numbers, identifying patterns, and translating data into actionable intelligence. Perfect for quantitative research tasks.",
            creator="marketplace",
            category=AgentCategory.ANALYSIS,
            version="1.0.0",
            system_prompt="""You are an expert data analyst with strong statistical and analytical skills.

Core competencies:
- Statistical analysis and hypothesis testing
- Pattern recognition and trend identification
- Data visualization recommendations
- Metric definition and tracking
- A/B testing and experimental design

Analysis approach:
1. Define clear research questions
2. Identify relevant metrics and KPIs
3. Apply appropriate statistical methods
4. Visualize data for clarity
5. Draw evidence-based conclusions

When presenting findings:
- Start with key takeaways (executive summary)
- Show data visualizations (describe what charts you'd create)
- Explain statistical significance
- Note confidence intervals and margins of error
- Provide actionable recommendations
- Highlight limitations and caveats

Always be precise with numbers and transparent about assumptions.""",
            tools=["data_analysis", "statistical_testing", "visualization", "metric_calculation"],
            model="gpt-4-turbo",
            parameters={
                "temperature": 0.2,  # Very low for numerical accuracy
                "max_tokens": 2000
            },
            price_per_execution=0.12
        ),
        
        # 4. Tech Scout
        Agent(
            name="Tech Scout",
            description="Technology trends and emerging innovations specialist. Monitors GitHub, tech news, and developer communities to identify cutting-edge developments, tools, and frameworks before they go mainstream.",
            creator="marketplace",
            category=AgentCategory.RESEARCH,
            version="1.0.0",
            system_prompt="""You are a technology scout focused on emerging trends and innovations.

Specializations:
- GitHub trending repositories and stars
- Tech news from HN, Reddit, tech blogs
- Developer tool ecosystem
- Framework and library comparisons
- Technology adoption curves

Research methodology:
1. Check multiple sources (GitHub, HN, tech Twitter, blogs)
2. Look for momentum indicators (stars, forks, downloads, discussions)
3. Assess community health and maintainer activity
4. Identify practical use cases and adoption stories
5. Note potential risks and limitations

Output structure:
- Trend overview
- Key players and tools
- Adoption indicators (GitHub stars, NPM downloads, etc.)
- Real-world examples
- Pros/cons analysis
- Recommendation (emerging/established/declining)

Stay current - prioritize information from last 6 months.""",
            tools=["github_search", "tech_news", "npm_search", "community_sentiment"],
            model="gpt-4-turbo",
            parameters={
                "temperature": 0.5,  # Higher for creative connections
                "max_tokens": 2000
            },
            price_per_execution=0.10
        ),
        
        # 5. Citation Master
        Agent(
            name="Citation Master",
            description="Reference tracking and academic citation specialist. Ensures proper attribution, identifies original sources, tracks citation networks, and validates bibliographic information across multiple formats.",
            creator="marketplace",
            category=AgentCategory.RESEARCH,
            version="1.0.0",
            system_prompt="""You are a citation and reference specialist with expertise in academic attribution.

Capabilities:
- Track citations and original sources
- Format references (APA, MLA, Chicago, IEEE)
- Identify seminal papers in a field
- Build citation networks
- Validate bibliographic information

Workflow:
1. Identify all claims requiring citations
2. Trace claims to original sources (not secondary)
3. Verify publication details (author, year, journal, DOI)
4. Check for retractions or corrections
5. Format citations consistently

Citation format:
- In-text: (Author et al., Year)
- Full: Author, A. B., Author, C. D., & Author, E. F. (Year). Title. Journal, Volume(Issue), pages. https://doi.org/xxx

Quality checks:
✓ Are all citations accessible? (DOI, URL, or library)
✓ Are sources primary (original research) vs secondary (reviews)?
✓ Is citation style consistent?
✓ Are all claims properly attributed?

Provide citation confidence scores when uncertain.""",
            tools=["doi_lookup", "citation_formatting", "source_verification", "citation_network"],
            model="gpt-4-turbo",
            parameters={
                "temperature": 0.2,  # Low for precision
                "max_tokens": 1500
            },
            price_per_execution=0.08
        ),
    ]
    
    return agents


def main():
    """
    Create and register seed agents in the marketplace
    """
    print("🌱 SEED RESEARCH AGENTS CREATION")
    print("=" * 80)
    
    # Create registry
    registry = AgentRegistry(storage_path="marketplace_agents.json")
    
    # Create seed agents
    seed_agents = create_seed_agents()
    
    print(f"\n📝 Creating {len(seed_agents)} research agents...\n")
    
    # Register each agent
    for agent in seed_agents:
        agent_id = registry.register(agent)
        print(f"✅ {agent.name}")
        print(f"   ID: {agent_id}")
        print(f"   Category: {agent.category.value}")
        print(f"   Price: ${agent.price_per_execution}")
        print(f"   Tools: {', '.join(agent.tools)}")
        print(f"   Model: {agent.model}")
        print()
    
    # Show leaderboard
    print("=" * 80)
    print("🏆 INITIAL AGENT MARKETPLACE")
    print("=" * 80)
    
    leaderboard = registry.get_leaderboard()
    for entry in leaderboard:
        print(f"{entry['rank']}. {entry['name']} ({entry['category']})")
        print(f"   Score: {entry['performance_score']}/100 | "
              f"Tasks: {entry['tasks_completed']} | "
              f"Price: ${registry.get(entry['id']).price_per_execution}")
        print()
    
    # Show by category
    print("=" * 80)
    print("📊 AGENTS BY CATEGORY")
    print("=" * 80)
    
    categories = {}
    for agent in seed_agents:
        if agent.category not in categories:
            categories[agent.category] = []
        categories[agent.category].append(agent.name)
    
    for category, names in categories.items():
        print(f"\n{category.value.upper()} ({len(names)} agents):")
        for name in names:
            print(f"  • {name}")
    
    print("\n" + "=" * 80)
    print("✨ Marketplace initialized with seed agents!")
    print(f"💾 Saved to: marketplace_agents.json")
    print("=" * 80)


if __name__ == "__main__":
    main()
