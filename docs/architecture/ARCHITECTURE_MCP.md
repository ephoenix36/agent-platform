# Agents MCP Server Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Assistant (Claude)                        │
│                                                                 │
│  "Find research agents and create a conversation"              │
│  "Assign this task to backend and frontend experts"            │
│  "Optimize the literature-synthesizer agent"                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ MCP Protocol (stdio)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  Agents MCP Server                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Server.ts                             │  │
│  │  • 16 Tool Registrations                                 │  │
│  │  • Input Validation (Zod)                                │  │
│  │  • Error Handling                                        │  │
│  │  • Response Formatting                                   │  │
│  └───┬──────────┬───────────┬──────────┬────────────────────┘  │
│      │          │           │          │                        │
│  ┌───▼──────────▼───────────▼──────────▼────────────────────┐  │
│  │              Manager Layer                               │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                │  │
│  │  │ AgentManager   │  │ Conversation   │                │  │
│  │  │                │  │   Manager      │                │  │
│  │  │ • Search       │  │                │                │  │
│  │  │ • Load/Save    │  │ • Create       │                │  │
│  │  │ • List         │  │ • Add Message  │                │  │
│  │  │ • Collections  │  │ • Get History  │                │  │
│  │  └────────────────┘  └────────────────┘                │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                │  │
│  │  │ TaskManager    │  │   Sampling     │                │  │
│  │  │                │  │   Manager      │                │  │
│  │  │ • Create       │  │                │                │  │
│  │  │ • Assign       │  │ • Request      │                │  │
│  │  │ • Track        │  │ • Validate     │                │  │
│  │  │ • Update       │  │ • History      │                │  │
│  │  └────────────────┘  └────────────────┘                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ File I/O
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Data Layer                                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Collections (Filesystem)                         │  │
│  │                                                          │  │
│  │  collections/                                            │  │
│  │  ├── creative-tools/                                     │  │
│  │  │   ├── photoshop/                                      │  │
│  │  │   ├── figma/                                          │  │
│  │  │   └── blender/                                        │  │
│  │  ├── web-development/                                    │  │
│  │  │   ├── frontend/                                       │  │
│  │  │   ├── backend/                                        │  │
│  │  │   └── database/                                       │  │
│  │  ├── research/                                           │  │
│  │  │   ├── literature-review/                              │  │
│  │  │   │   └── literature-synthesizer.json                 │  │
│  │  │   └── data-analysis/                                  │  │
│  │  └── automation/                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Runtime State (In-Memory)                        │  │
│  │                                                          │  │
│  │  • Active Conversations (Map)                            │  │
│  │  • Tasks (Map)                                           │  │
│  │  • Sampling Requests (Map)                               │  │
│  │  • Sampling Results (Map)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Tool Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                      16 MCP Tools                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Agent Discovery (4 tools)                               │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │ search_agents  │  │   get_agent    │                 │  │
│  │  │                │  │                │                 │  │
│  │  │ • Query        │  │ • Full details │                 │  │
│  │  │ • Tags         │  │ • Instructions │                 │  │
│  │  │ • Collection   │  │ • Tools        │                 │  │
│  │  │ • Score        │  │ • History      │                 │  │
│  │  │ • Difficulty   │  │                │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │list_collections│  │list_subsections│                 │  │
│  │  │                │  │                │                 │  │
│  │  │ • Browse all   │  │ • Explore by   │                 │  │
│  │  │   collections  │  │   collection   │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Conversation Management (4 tools)                       │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │create_conver-  │  │add_conversa-   │                 │  │
│  │  │   sation       │  │  tion_message  │                 │  │
│  │  │                │  │                │                 │  │
│  │  │ • Multi-agent  │  │ • Add content  │                 │  │
│  │  │ • Roles        │  │ • Track sender │                 │  │
│  │  │ • Topic        │  │ • Metadata     │                 │  │
│  │  │ • Max rounds   │  │                │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │get_conversation│  │list_conversa-  │                 │  │
│  │  │                │  │    tions       │                 │  │
│  │  │ • Full history │  │                │                 │  │
│  │  │ • Participants │  │ • Filter status│                 │  │
│  │  │ • Messages     │  │ • Pagination   │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Task Management (4 tools)                               │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │ create_task    │  │update_task_    │                 │  │
│  │  │                │  │    status      │                 │  │
│  │  │ • Title/desc   │  │                │                 │  │
│  │  │ • Assign       │  │ • Status       │                 │  │
│  │  │ • Priority     │  │ • Progress %   │                 │  │
│  │  │ • Due date     │  │ • Notes        │                 │  │
│  │  │ • Capabilities │  │                │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │   get_task     │  │  list_tasks    │                 │  │
│  │  │                │  │                │                 │  │
│  │  │ • Full details │  │ • Filter       │                 │  │
│  │  │ • History      │  │ • Sort         │                 │  │
│  │  │ • Updates      │  │ • Pagination   │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Advanced Features (4 tools)                             │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │request_sampling│  │ optimize_agent │                 │  │
│  │  │                │  │                │                 │  │
│  │  │ • Messages     │  │ • Target score │                 │  │
│  │  │ • Max tokens   │  │ • Generations  │                 │  │
│  │  │ • Temperature  │  │ • Population   │                 │  │
│  │  │ • Stop seq     │  │                │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  │                                                          │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │get_optimiza-   │  │   (reserved)   │                 │  │
│  │  │tion_history    │  │                │                 │  │
│  │  │                │  │                │                 │  │
│  │  │ • Score trend  │  │                │                 │  │
│  │  │ • Generations  │  │                │                 │  │
│  │  │ • Best variant │  │                │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Search and Get Agent

```
┌────────┐                                                     ┌────────┐
│ Claude │                                                     │  File  │
│        │                                                     │ System │
└───┬────┘                                                     └───▲────┘
    │                                                              │
    │ 1. search_agents({ tags: ["research"] })                    │
    ├───────────────────────────────────────────────────────►    │
    │                                                              │
    │                                         2. Read collections │
    │                                             │◄───────────────┘
    │                                             │
    │                                         3. Filter & sort
    │                                             │
    │ 4. Return results                          │
    │◄──────────────────────────────────────────┘
    │
    │ 5. get_agent({ collection, subsection, agentName })
    ├───────────────────────────────────────────────────────►
    │                                                              │
    │                                         6. Read JSON file    │
    │                                             │◄───────────────┘
    │                                             │
    │ 7. Return full agent details               │
    │◄──────────────────────────────────────────┘
    │
```

### Example 2: Create Multi-Agent Conversation

```
┌────────┐                                                  ┌──────────┐
│ Claude │                                                  │ In-Memory│
│        │                                                  │  State   │
└───┬────┘                                                  └───▲──────┘
    │                                                           │
    │ 1. create_conversation({ agents, topic, maxRounds })     │
    ├──────────────────────────────────────────────────────►   │
    │                                                           │
    │                              2. Validate agent references│
    │                                                           │
    │                              3. Create conversation obj  │
    │                                      │───────────────────►│
    │                                      │                    │
    │ 4. Return conversation ID            │                    │
    │◄─────────────────────────────────────┘                    │
    │                                                           │
    │ 5. add_conversation_message({ conversationId, ... })      │
    ├──────────────────────────────────────────────────────►   │
    │                                                           │
    │                              6. Validate participant      │
    │                                                           │
    │                              7. Add message to history    │
    │                                      │───────────────────►│
    │                                      │                    │
    │ 8. Return message confirmation       │                    │
    │◄─────────────────────────────────────┘                    │
    │                                                           │
```

### Example 3: Task Assignment and Tracking

```
┌────────┐                                                  ┌──────────┐
│ Claude │                                                  │ In-Memory│
│        │                                                  │  State   │
└───┬────┘                                                  └───▲──────┘
    │                                                           │
    │ 1. create_task({ title, assignedAgents, priority })      │
    ├──────────────────────────────────────────────────────►   │
    │                                                           │
    │                              2. Create task object        │
    │                                      │───────────────────►│
    │                                      │                    │
    │ 3. Return task ID                    │                    │
    │◄─────────────────────────────────────┘                    │
    │                                                           │
    │ ... time passes ...                                       │
    │                                                           │
    │ 4. update_task_status({ taskId, status, progress })      │
    ├──────────────────────────────────────────────────────►   │
    │                                                           │
    │                              5. Update task record        │
    │                                      │───────────────────►│
    │                                      │                    │
    │                              6. Add update to history     │
    │                                      │───────────────────►│
    │                                      │                    │
    │ 7. Return updated task               │                    │
    │◄─────────────────────────────────────┘                    │
    │                                                           │
    │ 8. list_tasks({ status: "in-progress" })                 │
    ├──────────────────────────────────────────────────────►   │
    │                                                           │
    │                              9. Filter and sort           │
    │                                      │◄───────────────────│
    │                                      │                    │
    │ 10. Return task list                 │                    │
    │◄─────────────────────────────────────┘                    │
    │                                                           │
```

## Component Responsibilities

### Server.ts
- **Tool Registration**: Define and register all 16 MCP tools
- **Input Validation**: Validate parameters using Zod schemas
- **Error Handling**: Catch and format errors in MCP format
- **Response Formatting**: Ensure all responses match MCP protocol
- **Manager Coordination**: Route requests to appropriate managers

### AgentManager
- **File Operations**: Read/write agent JSON files
- **Search**: Filter agents by multiple criteria
- **Collections**: List and navigate collection structure
- **Validation**: Ensure agent schema compliance

### ConversationManager
- **State Management**: Track active conversations
- **Message Routing**: Ensure valid participants
- **Round Counting**: Enforce max rounds
- **History**: Maintain complete message history
- **Status**: Manage conversation lifecycle

### TaskManager
- **Assignment**: Track which agents are assigned to tasks
- **Progress**: Monitor completion percentage
- **Priority**: Manage task priorities
- **Dependencies**: Track task relationships
- **Updates**: Maintain update history with notes

### SamplingManager
- **Request Validation**: Ensure valid sampling parameters
- **History**: Track all sampling requests
- **Statistics**: Aggregate usage metrics
- **Future**: Ready for real MCP sampling integration

## Scalability Considerations

### Current (In-Memory)
- Fast performance
- No database overhead
- Suitable for local development
- Limited by process memory

### Future (Persistent)
- Database backend (SQLite/PostgreSQL)
- Unlimited history
- Multi-instance support
- Backup and recovery

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Trust Boundary                           │
│                                                             │
│  Local Machine                                              │
│  ┌────────────┐         ┌──────────────┐                   │
│  │   Claude   │  stdio  │ MCP Server   │                   │
│  │  Desktop   │◄───────►│              │                   │
│  └────────────┘         └──────────────┘                   │
│                                                             │
│  No Authentication Required (Local Trust)                   │
│  Input Validation via Zod Schemas                           │
│  No Network Exposure                                        │
└─────────────────────────────────────────────────────────────┘
```

## Extension Points

### Adding New Tools
1. Define Zod schema
2. Register with `server.tool()`
3. Implement handler function
4. Add error handling
5. Update documentation

### Adding New Managers
1. Create manager class
2. Define interfaces
3. Implement business logic
4. Export for server use
5. Update architecture docs

### Adding Persistence
1. Choose database (SQLite, PostgreSQL)
2. Create schema/migrations
3. Update managers to use DB
4. Add connection management
5. Implement backup/restore

---

This architecture provides a solid foundation for collaborative AI workflows while remaining simple, maintainable, and extensible.
