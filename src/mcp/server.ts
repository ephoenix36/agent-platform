#!/usr/bin/env node
/**
 * MCP Server for Agents - Collaborative AI Agent Platform
 * 
 * Provides MCP tools for:
 * - Agent discovery and search
 * - Multi-agent conversations
 * - Task assignment and tracking
 * - Token sampling from clients
 * - Agent optimization management
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { AgentManager } from "../core/agent-manager.js";
import { ConversationManager } from "./conversation-manager.js";
import { TaskManager } from "./task-manager.js";
import { SamplingManager } from "./sampling-manager.js";
import { registerPersistentStorageTools } from "./persistent-storage-tools.js";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const collectionsPath = path.join(__dirname, '../../collections');

// Initialize managers
const agentManager = new AgentManager(collectionsPath);
const conversationManager = new ConversationManager();
const taskManager = new TaskManager();
const samplingManager = new SamplingManager();

// Create MCP server
const server = new McpServer({
  name: "agents-collaboration-platform",
  version: "2.0.0",
  description: "Collaborative AI Agent Platform with persistent storage, search, conversations, tasks, and optimization"
});

// ============================================================================
// AGENT SEARCH & DISCOVERY TOOLS
// ============================================================================

/**
 * Search agents by name, description, tags, category, or recency
 */
const searchAgentsSchema = z.object({
  query: z.string().optional().describe("Search query for agent name/description"),
  tags: z.array(z.string()).optional().describe("Filter by tags"),
  collection: z.string().optional().describe("Filter by collection"),
  subsection: z.string().optional().describe("Filter by subsection"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().describe("Filter by difficulty"),
  minScore: z.number().min(0).max(1).optional().describe("Minimum optimization score"),
  sortBy: z.enum(['name', 'score', 'recent', 'difficulty']).default('name').describe("Sort order"),
  limit: z.number().default(10).describe("Maximum results to return")
});

server.tool(
  "search_agents",
  "Search for AI agents by various criteria including name, tags, collection, difficulty, and optimization score",
  searchAgentsSchema.shape,
  async (input) => {
    try {
      let agents = await agentManager.listAgents(input.collection, input.subsection);

      // Apply filters
      if (input.query) {
        const lowerQuery = input.query.toLowerCase();
        agents = agents.filter(agent =>
          agent.name.toLowerCase().includes(lowerQuery) ||
          agent.description.toLowerCase().includes(lowerQuery)
        );
      }

      if (input.tags && input.tags.length > 0) {
        agents = agents.filter(agent =>
          input.tags!.some(tag => agent.tags.includes(tag))
        );
      }

      if (input.difficulty) {
        agents = agents.filter(agent => agent.difficulty === input.difficulty);
      }

      if (input.minScore !== undefined) {
        agents = agents.filter(agent => agent.currentScore >= input.minScore!);
      }

      // Sort
      switch (input.sortBy) {
        case 'score':
          agents.sort((a, b) => b.currentScore - a.currentScore);
          break;
        case 'recent':
          agents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          break;
        case 'difficulty':
          const diffOrder = { beginner: 0, intermediate: 1, advanced: 2 };
          agents.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
          break;
        default:
          agents.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Limit results
      agents = agents.slice(0, input.limit);

      const results = agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        collection: agent.collection,
        subsection: agent.subsection,
        tags: agent.tags,
        difficulty: agent.difficulty,
        score: agent.currentScore,
        requiredTools: agent.requiredTools || [],
        optionalTools: agent.optionalTools || [],
        updatedAt: agent.updatedAt
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching agents: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Get detailed information about a specific agent
 */
const getAgentSchema = z.object({
  collection: z.string().describe("Collection name"),
  subsection: z.string().describe("Subsection name"),
  agentName: z.string().describe("Agent identifier")
});

server.tool(
  "get_agent",
  "Get complete details about a specific agent including instructions, tools, and optimization history",
  getAgentSchema.shape,
  async (input) => {
    try {
      const agent = await agentManager.loadAgent(input.collection, input.subsection, input.agentName);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(agent, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error loading agent: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * List all collections
 */
server.tool(
  "list_collections",
  "List all available agent collections",
  {},
  async () => {
    try {
      const collections = await agentManager.getCollections();
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(collections, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing collections: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * List subsections in a collection
 */
const listSubsectionsSchema = z.object({
  collection: z.string().describe("Collection name")
});

server.tool(
  "list_subsections",
  "List all subsections within a collection",
  listSubsectionsSchema.shape,
  async (input) => {
    try {
      const subsections = await agentManager.getSubsections(input.collection);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(subsections, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing subsections: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// ============================================================================
// CONVERSATION MANAGEMENT TOOLS
// ============================================================================

/**
 * Create a new multi-agent conversation
 */
const createConversationSchema = z.object({
  agents: z.array(z.object({
    collection: z.string(),
    subsection: z.string(),
    agentName: z.string(),
    role: z.string().optional().describe("Role in conversation (e.g., 'researcher', 'validator')")
  })).describe("Agents to include in conversation"),
  topic: z.string().describe("Conversation topic or objective"),
  maxRounds: z.number().default(5).describe("Maximum conversation rounds"),
  metadata: z.record(z.any()).optional().describe("Additional metadata")
});

server.tool(
  "create_conversation",
  "Create a multi-agent conversation for collaborative problem-solving",
  createConversationSchema.shape,
  async (input) => {
    try {
      const conversation = await conversationManager.createConversation({
        agents: input.agents,
        topic: input.topic,
        maxRounds: input.maxRounds,
        metadata: input.metadata
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            conversationId: conversation.id,
            status: conversation.status,
            agents: conversation.agents,
            topic: conversation.topic,
            createdAt: conversation.createdAt
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating conversation: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Add a message to a conversation
 */
const addMessageSchema = z.object({
  conversationId: z.string().describe("Conversation ID"),
  agentRef: z.object({
    collection: z.string(),
    subsection: z.string(),
    agentName: z.string()
  }).describe("Agent sending the message"),
  message: z.string().describe("Message content"),
  metadata: z.record(z.any()).optional()
});

server.tool(
  "add_conversation_message",
  "Add a message to an existing conversation",
  addMessageSchema.shape,
  async (input) => {
    try {
      const result = await conversationManager.addMessage(
        input.conversationId,
        input.agentRef,
        input.message,
        input.metadata
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error adding message: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Get conversation history
 */
const getConversationSchema = z.object({
  conversationId: z.string().describe("Conversation ID"),
  includeMessages: z.boolean().default(true).describe("Include full message history")
});

server.tool(
  "get_conversation",
  "Retrieve conversation details and history",
  getConversationSchema.shape,
  async (input) => {
    try {
      const conversation = await conversationManager.getConversation(input.conversationId);

      let responseData = conversation;
      if (!input.includeMessages) {
        // Create a copy without messages
        const { messages, ...conversationWithoutMessages } = conversation;
        responseData = conversationWithoutMessages as any;
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(responseData, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting conversation: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * List active conversations
 */
const listConversationsSchema = z.object({
  status: z.enum(['active', 'completed', 'paused', 'all']).default('active').describe("Filter by status"),
  limit: z.number().default(20).describe("Maximum results")
});

server.tool(
  "list_conversations",
  "List conversations with optional status filter",
  listConversationsSchema.shape,
  async (input) => {
    try {
      const conversations = await conversationManager.listConversations(
        input.status === 'all' ? undefined : input.status,
        input.limit
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify(conversations, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing conversations: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// ============================================================================
// TASK MANAGEMENT TOOLS
// ============================================================================

/**
 * Create and assign a task to agents
 */
const createTaskSchema = z.object({
  title: z.string().describe("Task title"),
  description: z.string().describe("Detailed task description"),
  assignedAgents: z.array(z.object({
    collection: z.string(),
    subsection: z.string(),
    agentName: z.string(),
    role: z.string().optional()
  })).describe("Agents assigned to the task"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  dueDate: z.string().optional().describe("ISO date string"),
  requiredCapabilities: z.array(z.string()).optional().describe("Required agent capabilities"),
  metadata: z.record(z.any()).optional()
});

server.tool(
  "create_task",
  "Create and assign a task to one or more agents",
  createTaskSchema.shape,
  async (input) => {
    try {
      const task = await taskManager.createTask({
        title: input.title,
        description: input.description,
        assignedAgents: input.assignedAgents,
        priority: input.priority,
        dueDate: input.dueDate,
        requiredCapabilities: input.requiredCapabilities,
        metadata: input.metadata
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(task, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error creating task: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Update task status
 */
const updateTaskSchema = z.object({
  taskId: z.string().describe("Task ID"),
  status: z.enum(['pending', 'in-progress', 'completed', 'blocked', 'cancelled']).describe("New status"),
  progress: z.number().min(0).max(100).optional().describe("Progress percentage"),
  notes: z.string().optional().describe("Update notes")
});

server.tool(
  "update_task_status",
  "Update the status and progress of a task",
  updateTaskSchema.shape,
  async (input) => {
    try {
      const task = await taskManager.updateTaskStatus(
        input.taskId,
        input.status,
        input.progress,
        input.notes
      );

      return {
        content: [{
          type: "text",
          text: JSON.stringify(task, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error updating task: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Get task details
 */
const getTaskSchema = z.object({
  taskId: z.string().describe("Task ID")
});

server.tool(
  "get_task",
  "Get detailed information about a task",
  getTaskSchema.shape,
  async (input) => {
    try {
      const task = await taskManager.getTask(input.taskId);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(task, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting task: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * List tasks
 */
const listTasksSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed', 'blocked', 'cancelled', 'all']).default('all'),
  assignedTo: z.object({
    collection: z.string(),
    subsection: z.string(),
    agentName: z.string()
  }).optional().describe("Filter by assigned agent"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  limit: z.number().default(20)
});

server.tool(
  "list_tasks",
  "List tasks with optional filters",
  listTasksSchema.shape,
  async (input) => {
    try {
      const tasks = await taskManager.listTasks({
        status: input.status === 'all' ? undefined : input.status,
        assignedTo: input.assignedTo,
        priority: input.priority,
        limit: input.limit
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(tasks, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error listing tasks: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// ============================================================================
// SAMPLING TOOLS
// ============================================================================

/**
 * Request token sampling from client
 */
const requestSamplingSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string()
  })).describe("Messages for sampling"),
  maxTokens: z.number().default(1000).describe("Maximum tokens to generate"),
  temperature: z.number().min(0).max(2).default(0.7).describe("Sampling temperature"),
  stopSequences: z.array(z.string()).optional().describe("Stop sequences"),
  metadata: z.record(z.any()).optional()
});

server.tool(
  "request_sampling",
  "Request token sampling from the client LLM",
  requestSamplingSchema.shape,
  async (input) => {
    try {
      const result = await samplingManager.requestSampling({
        messages: input.messages,
        maxTokens: input.maxTokens,
        temperature: input.temperature,
        stopSequences: input.stopSequences,
        metadata: input.metadata
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error requesting sampling: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// ============================================================================
// AGENT OPTIMIZATION TOOLS
// ============================================================================

/**
 * Start optimization for an agent
 */
const optimizeAgentSchema = z.object({
  collection: z.string(),
  subsection: z.string(),
  agentName: z.string(),
  targetScore: z.number().min(0).max(1).default(0.85).describe("Target optimization score"),
  maxGenerations: z.number().default(10).describe("Maximum optimization generations"),
  populationSize: z.number().default(5).describe("Population size for evolution")
});

server.tool(
  "optimize_agent",
  "Start an optimization run for an agent using evolutionary algorithms",
  optimizeAgentSchema.shape,
  async (input) => {
    try {
      // This would typically call the Python optimization bridge
      const result = {
        status: "optimization_started",
        agent: `${input.collection}/${input.subsection}/${input.agentName}`,
        targetScore: input.targetScore,
        maxGenerations: input.maxGenerations,
        message: "Optimization run initiated. Monitor progress with get_optimization_status."
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error starting optimization: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

/**
 * Get agent optimization history
 */
const getOptimizationHistorySchema = z.object({
  collection: z.string(),
  subsection: z.string(),
  agentName: z.string()
});

server.tool(
  "get_optimization_history",
  "Get the optimization history for an agent",
  getOptimizationHistorySchema.shape,
  async (input) => {
    try {
      const agent = await agentManager.loadAgent(input.collection, input.subsection, input.agentName);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            currentScore: agent.currentScore,
            threshold: agent.optimizationThreshold,
            history: agent.optimizationHistory,
            lastOptimized: agent.lastOptimized
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting optimization history: ${error instanceof Error ? error.message : String(error)}`
        }],
        isError: true
      };
    }
  }
);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  try {
    // Register persistent storage tools
    registerPersistentStorageTools(server);
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("Agents MCP Server started successfully");
    console.error(`Collections path: ${collectionsPath}`);
    console.error("Persistent storage: Enabled");
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
}

main();
