/**
 * MCP (Model Context Protocol) Manager
 * Manages MCP server connections and tool execution
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFile } from 'fs/promises';
import type { MCPConfig, MCPTool, ToolCall } from '../types.js';
import { log, PerfTimer } from '../utils/logger.js';
import { EventEmitter } from 'events';

interface MCPServerConfig {
  command: string;
  args: string[];
  description: string;
  enabled: boolean;
}

interface MCPServersFile {
  mcpServers: Record<string, MCPServerConfig>;
}

export class MCPManager extends EventEmitter {
  private config: MCPConfig;
  private clients: Map<string, Client> = new Map();
  private tools: Map<string, MCPTool> = new Map();
  private serverConfigs: Map<string, MCPServerConfig> = new Map();
  
  constructor(config: MCPConfig) {
    super();
    this.config = config;
  }
  
  /**
   * Initialize MCP servers and load tools
   */
  async initialize(): Promise<void> {
    const timer = new PerfTimer('mcp.initialize');
    
    try {
      log.info('Initializing MCP servers', {
        configPath: this.config.configPath,
      });
      
      // Load server configurations
      await this.loadServerConfigs();
      
      // Connect to enabled servers
      const enabledServers = Array.from(this.serverConfigs.entries())
        .filter(([name, _]) => this.config.enabledServers.includes(name))
        .filter(([_, config]) => config.enabled);
      
      for (const [name, serverConfig] of enabledServers) {
        try {
          await this.connectServer(name, serverConfig);
        } catch (error) {
          log.error(`Failed to connect to MCP server: ${name}`, error as Error);
          // Continue with other servers
        }
      }
      
      // Load tools from all connected servers
      await this.loadTools();
      
      timer.end({
        serversConnected: this.clients.size,
        toolsLoaded: this.tools.size,
      });
      
      log.info('MCP initialization complete', {
        servers: this.clients.size,
        tools: this.tools.size,
      });
      
    } catch (error) {
      timer.end({ success: false });
      log.error('MCP initialization failed', error as Error);
      throw error;
    }
  }
  
  /**
   * Execute a tool call
   */
  async executeTool(toolCall: ToolCall): Promise<unknown> {
    const timer = new PerfTimer('mcp.execute_tool');
    
    try {
      const tool = this.tools.get(toolCall.name);
      
      if (!tool) {
        throw new Error(`Tool not found: ${toolCall.name}`);
      }
      
      log.info('Executing tool', {
        toolName: toolCall.name,
        toolCallId: toolCall.id,
      });
      
      // Execute with timeout
      const result = await this.executeWithTimeout(
        tool.handler(toolCall.args),
        this.config.toolTimeout || 10000
      );
      
      timer.end({
        toolName: toolCall.name,
        success: true,
      });
      
      this.emit('tool.executed', {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        success: true,
      });
      
      return result;
      
    } catch (error) {
      timer.end({
        toolName: toolCall.name,
        success: false,
      });
      
      log.error('Tool execution failed', error as Error, {
        toolName: toolCall.name,
        toolCallId: toolCall.id,
      });
      
      this.emit('tool.executed', {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        success: false,
        error: (error as Error).message,
      });
      
      throw error;
    }
  }
  
  /**
   * Get all available tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Disconnect from all MCP servers
   */
  async disconnect(): Promise<void> {
    log.info('Disconnecting from MCP servers', {
      count: this.clients.size,
    });
    
    for (const [name, client] of this.clients.entries()) {
      try {
        await client.close();
        log.info(`Disconnected from MCP server: ${name}`);
      } catch (error) {
        log.error(`Error disconnecting from MCP server: ${name}`, error as Error);
      }
    }
    
    this.clients.clear();
    this.tools.clear();
  }
  
  /**
   * Load server configurations from file
   */
  private async loadServerConfigs(): Promise<void> {
    try {
      const configData = await readFile(this.config.configPath, 'utf-8');
      const config: MCPServersFile = JSON.parse(configData);
      
      for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
        this.serverConfigs.set(name, serverConfig);
      }
      
      log.info('Loaded MCP server configurations', {
        count: this.serverConfigs.size,
      });
      
    } catch (error) {
      log.error('Failed to load MCP server configurations', error as Error);
      throw error;
    }
  }
  
  /**
   * Connect to a single MCP server
   */
  private async connectServer(name: string, config: MCPServerConfig): Promise<void> {
    log.info(`Connecting to MCP server: ${name}`, {
      command: config.command,
      description: config.description,
    });
    
    try {
      // Create transport
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
      });
      
      // Create client
      const client = new Client({
        name: `voice-agent-${name}`,
        version: '1.0.0',
      }, {
        capabilities: {},
      });
      
      // Connect
      await client.connect(transport);
      
      this.clients.set(name, client);
      
      log.info(`Successfully connected to MCP server: ${name}`);
      
    } catch (error) {
      log.error(`Failed to connect to MCP server: ${name}`, error as Error);
      throw error;
    }
  }
  
  /**
   * Load tools from all connected servers
   */
  private async loadTools(): Promise<void> {
    for (const [serverName, client] of this.clients.entries()) {
      try {
        // List available tools
        const response = await client.listTools();
        
        if (!response.tools || response.tools.length === 0) {
          log.warn(`No tools found for server: ${serverName}`);
          continue;
        }
        
        // Register each tool
        for (const tool of response.tools) {
          const mcpTool: MCPTool = {
            name: tool.name,
            description: tool.description || '',
            inputSchema: tool.inputSchema as MCPTool['inputSchema'],
            server: serverName,
            handler: async (args: Record<string, unknown>) => {
              const result = await client.callTool({
                name: tool.name,
                arguments: args,
              });
              return result.content;
            },
          };
          
          this.tools.set(tool.name, mcpTool);
        }
        
        log.info(`Loaded tools from server: ${serverName}`, {
          count: response.tools.length,
        });
        
      } catch (error) {
        log.error(`Failed to load tools from server: ${serverName}`, error as Error);
      }
    }
  }
  
  /**
   * Execute a promise with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs)
      ),
    ]);
  }
}
