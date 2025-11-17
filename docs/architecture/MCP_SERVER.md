# Agents MCP Server

A Model Context Protocol (MCP) server that provides collaborative AI agent capabilities including agent discovery, multi-agent conversations, task management, and token sampling.

## Overview

The Agents MCP Server enables AI assistants to:
- **Search and discover** expert AI agents across multiple domains
- **Create conversations** between multiple agents for collaborative problem-solving
- **Assign and track tasks** across agent teams
- **Request token sampling** from the client LLM
- **Monitor optimization** of agent instructions

## Installation

```bash
cd Agents
npm install
npm run build
```

## Usage

### Running the MCP Server

The server uses stdio transport for communication:

```bash
# Run directly
node dist/mcp/server.js

# Or use npm script
npm run mcp-server
```

### Configuring in Claude Desktop

Add to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

Replace `YOUR_USERNAME` and adjust the path to match your installation location.

## Available Tools

### Agent Search & Discovery

#### `search_agents`
Search for AI agents by various criteria.

**Parameters:**
- `query` (optional): Search query for agent name/description
- `tags` (optional): Array of tags to filter by
- `collection` (optional): Filter by collection name
- `subsection` (optional): Filter by subsection
- `difficulty` (optional): Filter by difficulty level (beginner/intermediate/advanced)
- `minScore` (optional): Minimum optimization score (0-1)
- `sortBy` (optional): Sort order (name/score/recent/difficulty)
- `limit` (optional): Maximum results (default: 10)

**Example:**
```json
{
  "query": "web development",
  "tags": ["react", "typescript"],
  "minScore": 0.7,
  "sortBy": "score",
  "limit": 5
}
```

#### `get_agent`
Get complete details about a specific agent.

**Parameters:**
- `collection`: Collection name
- `subsection`: Subsection name
- `agentName`: Agent identifier

**Example:**
```json
{
  "collection": "web-development",
  "subsection": "frontend",
  "agentName": "react-expert"
}
```

#### `list_collections`
List all available agent collections.

**No parameters required.**

#### `list_subsections`
List all subsections within a collection.

**Parameters:**
- `collection`: Collection name

---

### Conversation Management

#### `create_conversation`
Create a multi-agent conversation for collaborative problem-solving.

**Parameters:**
- `agents`: Array of agent references with optional roles
  - `collection`: Collection name
  - `subsection`: Subsection name
  - `agentName`: Agent name
  - `role` (optional): Role in conversation (e.g., "researcher", "validator")
- `topic`: Conversation topic or objective
- `maxRounds` (optional): Maximum conversation rounds (default: 5)
- `metadata` (optional): Additional metadata

**Example:**
```json
{
  "agents": [
    {
      "collection": "research",
      "subsection": "literature-review",
      "agentName": "academic-researcher",
      "role": "lead-researcher"
    },
    {
      "collection": "research",
      "subsection": "validation",
      "agentName": "fact-checker",
      "role": "validator"
    }
  ],
  "topic": "Review current state of transformer architectures",
  "maxRounds": 3
}
```

#### `add_conversation_message`
Add a message to an existing conversation.

**Parameters:**
- `conversationId`: Conversation ID
- `agentRef`: Agent sending the message
- `message`: Message content
- `metadata` (optional): Additional metadata

#### `get_conversation`
Retrieve conversation details and history.

**Parameters:**
- `conversationId`: Conversation ID
- `includeMessages` (optional): Include full message history (default: true)

#### `list_conversations`
List conversations with optional status filter.

**Parameters:**
- `status` (optional): Filter by status (active/completed/paused/all)
- `limit` (optional): Maximum results (default: 20)

---

### Task Management

#### `create_task`
Create and assign a task to one or more agents.

**Parameters:**
- `title`: Task title
- `description`: Detailed task description
- `assignedAgents`: Array of agent references with optional roles
- `priority` (optional): Task priority (low/medium/high/critical)
- `dueDate` (optional): ISO date string
- `requiredCapabilities` (optional): Array of required capabilities
- `metadata` (optional): Additional metadata

**Example:**
```json
{
  "title": "Implement authentication system",
  "description": "Build OAuth2 authentication with JWT tokens",
  "assignedAgents": [
    {
      "collection": "web-development",
      "subsection": "backend",
      "agentName": "auth-specialist",
      "role": "lead"
    },
    {
      "collection": "web-development",
      "subsection": "security",
      "agentName": "security-auditor",
      "role": "reviewer"
    }
  ],
  "priority": "high",
  "dueDate": "2025-11-15T00:00:00Z",
  "requiredCapabilities": ["oauth2", "jwt", "security"]
}
```

#### `update_task_status`
Update the status and progress of a task.

**Parameters:**
- `taskId`: Task ID
- `status`: New status (pending/in-progress/completed/blocked/cancelled)
- `progress` (optional): Progress percentage (0-100)
- `notes` (optional): Update notes

#### `get_task`
Get detailed information about a task.

**Parameters:**
- `taskId`: Task ID

#### `list_tasks`
List tasks with optional filters.

**Parameters:**
- `status` (optional): Filter by status
- `assignedTo` (optional): Filter by assigned agent
- `priority` (optional): Filter by priority
- `limit` (optional): Maximum results (default: 20)

---

### Token Sampling

#### `request_sampling`
Request token sampling from the client LLM.

**Parameters:**
- `messages`: Array of messages
  - `role`: Message role (user/assistant/system)
  - `content`: Message content
- `maxTokens` (optional): Maximum tokens to generate (default: 1000)
- `temperature` (optional): Sampling temperature 0-2 (default: 0.7)
- `stopSequences` (optional): Array of stop sequences
- `metadata` (optional): Additional metadata

**Example:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an expert code reviewer."
    },
    {
      "role": "user",
      "content": "Review this function for potential bugs: function add(a, b) { return a + b; }"
    }
  ],
  "maxTokens": 500,
  "temperature": 0.3
}
```

**Note:** Currently returns simulated responses. In production, this would use the MCP sampling capability to request the client to perform actual LLM token sampling.

---

### Agent Optimization

#### `optimize_agent`
Start an optimization run for an agent using evolutionary algorithms.

**Parameters:**
- `collection`: Collection name
- `subsection`: Subsection name
- `agentName`: Agent name
- `targetScore` (optional): Target optimization score 0-1 (default: 0.85)
- `maxGenerations` (optional): Maximum generations (default: 10)
- `populationSize` (optional): Population size (default: 5)

**Example:**
```json
{
  "collection": "web-development",
  "subsection": "frontend",
  "agentName": "react-expert",
  "targetScore": 0.9,
  "maxGenerations": 15
}
```

#### `get_optimization_history`
Get the optimization history for an agent.

**Parameters:**
- `collection`: Collection name
- `subsection`: Subsection name
- `agentName`: Agent name

---

## Use Cases

### Research Team

Create a multi-agent research team to analyze a complex topic:

```javascript
// 1. Search for research agents
const researchers = await search_agents({
  tags: ["research", "academic"],
  minScore: 0.8,
  sortBy: "score"
});

// 2. Create a research conversation
const conversation = await create_conversation({
  agents: [
    {
      collection: "research",
      subsection: "literature-review",
      agentName: "academic-researcher",
      role: "lead"
    },
    {
      collection: "research",
      subsection: "synthesis",
      agentName: "synthesizer",
      role: "analyst"
    },
    {
      collection: "research",
      subsection: "validation",
      agentName: "fact-checker",
      role: "validator"
    }
  ],
  topic: "Latest advances in quantum computing applications",
  maxRounds: 5
});

// 3. Monitor the conversation
const updates = await get_conversation({
  conversationId: conversation.conversationId
});
```

### Development Team

Assign a complex development task to specialized agents:

```javascript
// 1. Create task
const task = await create_task({
  title: "Build real-time chat feature",
  description: "Implement WebSocket-based real-time chat with message persistence",
  assignedAgents: [
    {
      collection: "web-development",
      subsection: "backend",
      agentName: "websocket-expert",
      role: "backend-lead"
    },
    {
      collection: "web-development",
      subsection: "frontend",
      agentName: "react-expert",
      role: "frontend-lead"
    },
    {
      collection: "web-development",
      subsection: "database",
      agentName: "db-architect",
      role: "data-lead"
    }
  ],
  priority: "high",
  requiredCapabilities: ["websockets", "react", "database-design"]
});

// 2. Create conversation for collaboration
const devConvo = await create_conversation({
  agents: task.assignedAgents,
  topic: `Collaborate on: ${task.title}`,
  maxRounds: 10
});

// 3. Track progress
await update_task_status({
  taskId: task.id,
  status: "in-progress",
  progress: 25,
  notes: "Architecture design phase completed"
});
```

### Expert Consultation

Get expert advice by sampling with specialized agents:

```javascript
// 1. Find security expert
const experts = await search_agents({
  collection: "web-development",
  subsection: "security",
  difficulty: "advanced"
});

// 2. Get the agent details
const securityExpert = await get_agent({
  collection: "web-development",
  subsection: "security",
  agentName: experts[0].id
});

// 3. Request expert analysis via sampling
const analysis = await request_sampling({
  messages: [
    {
      role: "system",
      content: securityExpert.systemPrompt
    },
    {
      role: "user",
      content: "Review this authentication flow for security vulnerabilities: [code here]"
    }
  ],
  maxTokens: 2000,
  temperature: 0.3
});
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         MCP Client (Claude, etc.)           │
└─────────────────┬───────────────────────────┘
                  │ stdio
┌─────────────────▼───────────────────────────┐
│           Agents MCP Server                 │
│  ┌─────────────────────────────────────┐   │
│  │     Agent Manager                   │   │
│  │  • Search & Discovery               │   │
│  │  • Load/Save Agents                 │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │   Conversation Manager              │   │
│  │  • Multi-agent Conversations        │   │
│  │  • Message History                  │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │       Task Manager                  │   │
│  │  • Task Assignment                  │   │
│  │  • Progress Tracking                │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │     Sampling Manager                │   │
│  │  • Token Sampling Requests          │   │
│  │  • Sampling History                 │   │
│  └─────────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│        Agent Collections (Filesystem)       │
│  collections/                               │
│  ├── creative-tools/                        │
│  ├── web-development/                       │
│  ├── research/                              │
│  └── automation/                            │
└─────────────────────────────────────────────┘
```

## Development

### Adding New Tools

1. Define the input schema with Zod:
```typescript
const myToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional()
});
```

2. Register the tool:
```typescript
server.tool(
  "my_tool_name",
  "Tool description",
  myToolSchema.shape,  // Note: use .shape
  async (input) => {
    // Implementation
    return {
      content: [{ type: "text", text: result }]
    };
  }
);
```

### Testing

Use the MCP Inspector for testing:

```bash
# Install globally
npm install -g @modelcontextprotocol/inspector

# Run inspector
npx @modelcontextprotocol/inspector node dist/mcp/server.js
```

## Roadmap

- [ ] **Real sampling integration**: Connect to actual MCP sampling capability
- [ ] **Persistent storage**: Save conversations and tasks to database
- [ ] **Agent discovery API**: Enhanced search with embeddings
- [ ] **Optimization integration**: Connect to Python optimization engine
- [ ] **Analytics dashboard**: Track agent performance and collaboration metrics
- [ ] **Authentication**: Secure multi-user access
- [ ] **Webhooks**: Real-time notifications for task and conversation updates

## Contributing

Contributions are welcome! Please ensure:
- TypeScript code follows the existing style
- All tools include proper error handling
- Tools return responses in the correct MCP format
- Documentation is updated for new features

## License

MIT
