# Sample Agent Definitions

This directory contains sample agents in different formats to test the multi-protocol execution engine.

## MCP Agent (Markdown)

```markdown
# Research Assistant

## Instructions
You are a helpful research assistant that can search the web, analyze documents, and provide comprehensive summaries.

## Tools
- web_search: Search the internet for information
- document_analyzer: Analyze PDF and text documents
- summarizer: Create concise summaries

## Description
An intelligent research assistant powered by MCP
```

## CrewAI Agent (YAML)

```yaml
role: Senior Data Analyst
goal: Analyze data and provide actionable insights
backstory: You are an experienced data analyst with 10+ years of experience in business intelligence
tools:
  - data_analysis
  - visualization
  - statistical_modeling
verbose: true
allow_delegation: true
```

## LangChain Agent (JSON)

```json
{
  "name": "Customer Support Agent",
  "type": "agent",
  "system_message": "You are a friendly and helpful customer support agent. Always be polite and try to solve customer issues efficiently.",
  "tools": [
    "search_knowledge_base",
    "create_ticket",
    "escalate_to_human"
  ],
  "model": "gpt-4",
  "temperature": 0.7,
  "chain_type": "agent"
}
```

## LangGraph Workflow (JSON)

```json
{
  "name": "Content Creation Workflow",
  "type": "langgraph",
  "system_message": "You are a content creation workflow that researches, writes, and edits articles.",
  "steps": [
    {"action": "research_topic"},
    {"action": "create_outline"},
    {"action": "write_draft"},
    {"action": "edit_content"},
    {"action": "fact_check"}
  ],
  "tools": [
    "web_search",
    "grammar_check",
    "plagiarism_check"
  ],
  "chain_type": "langgraph"
}
```

## Testing These Agents

### Via API (curl)

**MCP Agent:**
```bash
curl -X POST http://localhost:8000/api/v1/executions/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "research-assistant",
    "protocol": "mcp",
    "agent_config": {
      "name": "Research Assistant",
      "instructions": "You are a helpful research assistant",
      "tools": ["web_search", "document_analyzer", "summarizer"]
    },
    "input_data": {
      "query": "Research the latest developments in AI agents"
    }
  }'
```

**CrewAI Agent:**
```bash
curl -X POST http://localhost:8000/api/v1/executions/execute \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "data-analyst",
    "protocol": "crewai",
    "agent_config": {
      "role": "Senior Data Analyst",
      "goal": "Analyze data and provide actionable insights",
      "backstory": "Experienced data analyst",
      "tools": ["data_analysis", "visualization"]
    },
    "input_data": {
      "task": "Analyze sales data for Q4 trends"
    }
  }'
```

**LangChain Agent:**
```bash
curl -X POST http://localhost:8000/api/v1/executions/execute \
  -H "Content-Type": "application/json" \
  -d '{
    "agent_id": "support-agent",
    "protocol": "langchain",
    "agent_config": {
      "name": "Customer Support Agent",
      "system_message": "You are a helpful customer support agent",
      "tools": ["search_knowledge_base", "create_ticket"],
      "chain_type": "agent"
    },
    "input_data": {
      "input": "How do I reset my password?"
    }
  }'
```

### Via Frontend (coming soon)

1. Drag an "Agent" node onto the canvas
2. Configure it with one of the above definitions
3. Connect it to a "DataSource" node for input
4. Click "Run" to execute
5. Watch real-time streaming events in the UI

### Via Python

```python
import httpx
import json

async def test_agent(protocol: str, agent_config: dict, input_data: dict):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:8000/api/v1/executions/execute",
            json={
                "agent_id": f"test-{protocol}",
                "protocol": protocol,
                "agent_config": agent_config,
                "input_data": input_data
            },
            timeout=60.0
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    print(f"[{data['type']}] {data['data']}")
```

## Expected Output

All agents will stream events like:

```
[status] {"status": "initializing"}
[log] {"message": "Initializing agent..."}
[status] {"status": "running"}
[thinking] {"message": "Processing query..."}
[tool_call] {"tool": "web_search", "parameters": {...}}
[tool_result] {"tool": "web_search", "result": "...", "success": true}
[ui_component] {"type": "card", "props": {...}}
[result] {"summary": "...", "timestamp": "..."}
[status] {"status": "completed"}
```

## Notes

- All agents support streaming via Server-Sent Events
- Protocols are auto-detected based on config structure
- Tools are simulated in this MVP (real tools coming soon)
- UI components are generated automatically when configured
