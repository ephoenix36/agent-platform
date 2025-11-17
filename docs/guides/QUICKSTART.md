# Quick Start Guide: Using Agents MCP Server

This guide shows you how to leverage the Agents MCP Server for collaborative AI workflows.

## Setup

1. **Build the project:**
   ```bash
   cd Agents
   npm install
   npm run build
   ```

2. **Configure Claude Desktop:**
   
   Edit your Claude Desktop config file and add:
   
   **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   ```json
   {
     "mcpServers": {
       "agents": {
         "command": "node",
         "args": ["C:/Users/YOUR_USERNAME/Documents/Coding_Projects/Agents/dist/mcp/server.js"]
       }
     }
   }
   ```
   
   Replace `YOUR_USERNAME` with your actual Windows username.

3. **Restart Claude Desktop**

4. **Verify the connection:**
   Look for the MCP server indicator in Claude Desktop. You should see "agents" listed as a connected server.

## Example Workflows

### 1. Find Expert Agents for Your Task

```
Can you search for agents that specialize in literature review and academic research?
```

**Expected Result:** Claude will use the `search_agents` tool to find relevant agents.

**Follow-up:**
```
Get me the full details of the academic-researcher agent.
```

---

### 2. Create a Research Team

```
I need to analyze recent advances in quantum computing. Can you:
1. Find agents specialized in research and synthesis
2. Create a conversation between them to analyze this topic
```

**What happens:**
- Claude searches for research agents using `search_agents`
- Creates a multi-agent conversation using `create_conversation`
- Agents can collaborate on the analysis

**Monitoring:**
```
Show me the conversation history for that research team.
```

---

### 3. Assign a Development Task

```
Create a task to build a real-time chat feature. Assign it to:
- A backend developer (for WebSocket implementation)
- A frontend developer (for React UI)
- A database architect (for message persistence)

Make it high priority with a due date of November 30, 2025.
```

**What happens:**
- Claude searches for appropriate agents in the web-development collection
- Creates a task using `create_task` with all the details
- Returns the task ID for tracking

**Tracking progress:**
```
Update the chat feature task to in-progress with 25% completion.
Add a note: "Architecture design phase completed"
```

---

### 4. Multi-Agent Code Review

```
I need a security audit of this authentication code:

[paste your code]

Can you:
1. Find a security expert agent
2. Request an analysis using their specialized knowledge
```

**What happens:**
- Claude searches for security experts using `search_agents`
- Gets the agent's system prompt with `get_agent`
- Uses `request_sampling` to generate expert analysis

---

### 5. Optimize an Agent

```
I want to improve the literature-synthesizer agent in the research collection.
Can you start an optimization run targeting a score of 0.9?
```

**What happens:**
- Claude uses `optimize_agent` to start evolutionary optimization
- You can check progress with `get_optimization_history`

---

### 6. Complex Multi-Agent Collaboration

**Scenario:** Building a new feature with multiple perspectives

```
I'm building a payment processing system. I need:
1. A backend expert for API design
2. A security expert for vulnerability analysis
3. A database expert for transaction handling
4. A frontend expert for checkout UX

Create a conversation with all of them to design the architecture.
Then create a task for implementation with all four agents assigned.
```

**What happens:**
1. Claude searches for 4 different expert agents
2. Creates a multi-agent conversation
3. Creates a coordinated task
4. You can track both the conversation and task progress

**Monitoring:**
```
Show me:
1. The architecture conversation history
2. The payment system task status
3. Recent messages from the security expert
```

---

## Power User Tips

### Agent Discovery Strategies

**Find top performers:**
```
Search for agents with a minimum score of 0.85, sorted by score
```

**Find by capability:**
```
Find agents tagged with "react" and "typescript" in the web-development collection
```

**Find by difficulty:**
```
Show me advanced-level agents in the creative-tools collection
```

### Conversation Best Practices

1. **Define clear roles:**
   ```
   Create a conversation with:
   - Agent A as "lead-researcher"
   - Agent B as "fact-checker"
   - Agent C as "synthesizer"
   ```

2. **Set appropriate round limits:**
   - Quick consultations: 3-5 rounds
   - In-depth analysis: 10-15 rounds
   - Collaborative development: 20+ rounds

3. **Monitor progress:**
   ```
   Get the conversation summary for [conversation-id]
   ```

### Task Management Tips

1. **Use priorities effectively:**
   - `critical`: Security issues, production bugs
   - `high`: Feature deadlines, customer requests
   - `medium`: Standard development work
   - `low`: Nice-to-have improvements

2. **Set realistic due dates:**
   ```
   Create a task due on 2025-12-01T17:00:00Z
   ```

3. **Track dependencies:**
   ```
   Create a task that depends on completing tasks [task-id-1] and [task-id-2]
   ```

4. **Regular updates:**
   ```
   Update task [id] to in-progress with 50% completion.
   Add note: "API endpoints completed, starting frontend integration"
   ```

### Sampling Best Practices

1. **Use appropriate temperatures:**
   - Creative tasks: 0.7-1.0
   - Analytical tasks: 0.3-0.5
   - Code generation: 0.2-0.4

2. **Provide context:**
   ```json
   {
     "messages": [
       {
         "role": "system",
         "content": "[Agent's specialized system prompt]"
       },
       {
         "role": "user",
         "content": "Context: [background info]\n\nTask: [specific request]"
       }
     ]
   }
   ```

3. **Set token limits:**
   - Quick answers: 500 tokens
   - Detailed explanations: 1000-2000 tokens
   - Long-form content: 2000-4000 tokens

## Common Workflows

### Research Paper Analysis
1. Search for research agents (`search_agents`)
2. Create conversation with researcher + fact-checker + synthesizer (`create_conversation`)
3. Monitor the analysis (`get_conversation`)
4. Export findings as a task deliverable (`create_task` for documentation)

### Feature Development
1. Search for relevant technical experts (`search_agents`)
2. Create development task (`create_task`)
3. Create architecture conversation (`create_conversation`)
4. Track implementation progress (`update_task_status`)
5. Create review task for completion (`create_task`)

### Knowledge Synthesis
1. Find specialized agents (`search_agents`)
2. Request expert analysis via sampling (`request_sampling`)
3. Synthesize results in multi-agent conversation (`create_conversation`)
4. Track as research task (`create_task`)

### Agent Improvement
1. Identify underperforming agents (score < 0.7)
2. Start optimization (`optimize_agent`)
3. Monitor progress (`get_optimization_history`)
4. Test improved agent
5. Repeat if needed

## Troubleshooting

### MCP Server Not Connecting
1. Check the path in `claude_desktop_config.json` is absolute and correct
2. Verify the project is built: `npm run build`
3. Check logs in Claude Desktop's developer console
4. Restart Claude Desktop

### Agent Not Found
```
List all collections to see what's available
List subsections in [collection-name]
```

### Conversation Not Progressing
- Check current round vs max rounds
- Verify conversation status is 'active'
- Ensure agents are valid participants

### Task Blocked
```
Check dependencies for task [task-id]
```

## Next Steps

Once you're comfortable with the basics:

1. **Explore Collections:**
   ```
   List all available collections
   List subsections in each collection
   ```

2. **Study Top Agents:**
   ```
   Search for agents with minScore of 0.85
   Get details on high-performing agents
   ```

3. **Create Complex Workflows:**
   - Multi-stage pipelines with task dependencies
   - Long-running research conversations
   - Cross-disciplinary agent teams

4. **Contribute:**
   - Create new agent instructions
   - Share effective conversation patterns
   - Document successful workflows

## Resources

- **Full Documentation:** See [MCP_SERVER.md](./MCP_SERVER.md)
- **Architecture:** See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Tool Reference:** See [MCP_SERVER.md#available-tools](./MCP_SERVER.md#available-tools)

## Getting Help

If you encounter issues:
1. Check the documentation
2. Review example workflows
3. Test with simpler queries first
4. Check server logs for errors

Happy collaborating! 🚀
