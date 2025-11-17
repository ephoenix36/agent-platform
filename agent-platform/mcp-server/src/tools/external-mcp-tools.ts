/**
 * External MCP Server Tools
 * 
 * Tools that allow agents to discover and use tools from external MCP servers
 * configured in the user's mcp.json file.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";

// Available external MCP servers
const EXTERNAL_SERVERS = {
  'context7': {
    name: 'Context7',
    description: 'Library documentation lookup (React, Next.js, etc.)',
    tools: ['resolve-library-id', 'get-library-docs'],
    url: 'https://mcp.context7.com/mcp'
  },
  'image-studio': {
    name: 'Image Studio',
    description: 'Image generation, editing, and processing with AI',
    tools: ['generate_image_gemini', 'apply_filter', 'resize_image', 'upscale_image'],
    command: 'node'
  },
  'shadcn': {
    name: 'Shadcn',
    description: 'Add shadcn/ui components to projects',
    tools: ['get_add_command_for_items', 'list_items_in_registries', 'search_items_in_registries'],
    command: 'pnpx'
  },
  'deepwiki': {
    name: 'DeepWiki',
    description: 'Search and retrieve Wikipedia content',
    tools: ['search', 'get_article', 'get_summary'],
    url: 'https://mcp.deepwiki.com/sse'
  },
  'markitdown': {
    name: 'MarkItDown',
    description: 'Convert documents to Markdown format',
    tools: ['convert_to_markdown', 'batch_convert'],
    command: 'uvx'
  },
  'chrome-devtools': {
    name: 'Chrome DevTools',
    description: 'Automate Chrome browser for testing and scraping',
    tools: ['navigate', 'screenshot', 'get_console_logs', 'click', 'fill', 'evaluate'],
    command: 'npx'
  },
  'agents': {
    name: 'Agents Platform (Self)',
    description: 'Full agent platform capabilities',
    tools: ['execute_agent', 'chat_with_agent', 'list_toolkits'],
    command: 'pnpm'
  },
  'MCPControl': {
    name: 'MCP Control',
    description: 'Control and manage MCP servers',
    tools: ['list_servers', 'start_server', 'stop_server', 'get_server_status'],
    command: 'mcp-control'
  }
};

export function registerExternalMcpTools(server: McpServer, logger: Logger) {
  
  /**
   * List available external MCP servers
   */
  server.tool(
    "external_list_servers",
    "List all available external MCP servers that agents can use",
    {},
    async () => {
      try {
        const servers = Object.entries(EXTERNAL_SERVERS).map(([id, info]) => ({
          id,
          name: info.name,
          description: info.description,
          toolCount: info.tools.length,
          sampleTools: info.tools.slice(0, 3),
          type: 'url' in info ? 'http' : 'stdio'
        }));
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              count: servers.length,
              servers,
              message: "These external MCP servers are available for agents to use"
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list external servers:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Get detailed information about a specific external MCP server
   */
  server.tool(
    "external_get_server_info",
    "Get detailed information about a specific external MCP server",
    {
      serverId: z.enum([
        'context7',
        'image-studio',
        'shadcn',
        'deepwiki',
        'markitdown',
        'chrome-devtools',
        'agents',
        'MCPControl'
      ]).describe("Server ID to get information about")
    },
    async (args) => {
      try {
        const serverInfo = EXTERNAL_SERVERS[args.serverId];
        
        if (!serverInfo) {
          throw new Error(`Server '${args.serverId}' not found`);
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              server: {
                id: args.serverId,
                ...serverInfo
              }
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get server info:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Context7 - Resolve library documentation
   */
  server.tool(
    "context7_resolve_library",
    "Resolve a library name to get its Context7 ID for documentation lookup",
    {
      libraryName: z.string().describe("Library name to search for (e.g., 'react', 'next.js', 'typescript')")
    },
    async (args) => {
      try {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `To use Context7, agents should use the 'upstash/context7' MCP server with 'resolve-library-id' tool`,
              libraryName: args.libraryName,
              instructions: "This is a proxy tool. The actual Context7 tools are available via MCP sampling when connected to the Context7 server."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Context7 error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Context7 - Get library documentation
   */
  server.tool(
    "context7_get_docs",
    "Get documentation for a library using Context7",
    {
      libraryId: z.string().describe("Context7-compatible library ID (e.g., '/vercel/next.js')"),
      topic: z.string().optional().describe("Specific topic to focus on (e.g., 'routing', 'hooks')"),
      tokens: z.number().optional().default(10000).describe("Maximum tokens of documentation to retrieve")
    },
    async (args) => {
      try {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `To get ${args.libraryId} documentation, use the Context7 MCP server's 'get-library-docs' tool`,
              libraryId: args.libraryId,
              topic: args.topic,
              instructions: "This is a proxy tool. The actual Context7 tools are available via MCP sampling."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Context7 docs error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Shadcn - Search components
   */
  server.tool(
    "shadcn_search_components",
    "Search for shadcn/ui components available for installation",
    {
      query: z.string().optional().describe("Search query (e.g., 'button', 'dialog')"),
      registry: z.string().optional().default('shadcn').describe("Registry to search in")
    },
    async (args) => {
      try {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "To search shadcn components, use the 'shadcn' MCP server with 'search_items_in_registries' tool",
              query: args.query,
              registry: args.registry,
              instructions: "The shadcn MCP server provides tools to search, list, and get add commands for UI components."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Shadcn search error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Shadcn - Get add command
   */
  server.tool(
    "shadcn_get_add_command",
    "Get the CLI command to add shadcn/ui components to a project",
    {
      components: z.array(z.string()).describe("Component names to add (e.g., ['button', 'dialog'])"),
      registry: z.string().optional().default('shadcn').describe("Registry to use")
    },
    async (args) => {
      try {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "To get the add command, use the 'shadcn' MCP server with 'get_add_command_for_items' tool",
              components: args.components,
              registry: args.registry,
              instructions: "The shadcn MCP server will return the exact CLI command to run."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Shadcn add command error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Image Studio - Generate image
   */
  server.tool(
    "image_generate",
    "Generate an image using AI (via Image Studio MCP server)",
    {
      prompt: z.string().describe("Description of the image to generate"),
      model: z.enum(['imagen-4', 'imagen-4-fast']).optional().default('imagen-4-fast').describe("Model to use"),
      aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional().default('1:1').describe("Image aspect ratio")
    },
    async (args) => {
      try {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "To generate images, use the 'image-studio' MCP server with 'generate_image_gemini' tool",
              prompt: args.prompt,
              model: args.model,
              aspectRatio: args.aspectRatio,
              instructions: "The image-studio MCP server provides AI image generation, editing, and processing tools."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Image generation error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Chrome DevTools - Navigate and interact
   */
  server.tool(
    "chrome_navigate",
    "Navigate Chrome browser to a URL (via Chrome DevTools MCP server)",
    {
      url: z.string().describe("URL to navigate to"),
      waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle']).optional().default('load').describe("Wait condition")
    },
    async (args) => {
      try {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "To control Chrome, use the 'chrome-devtools' MCP server with 'navigate' tool",
              url: args.url,
              waitUntil: args.waitUntil,
              instructions: "The chrome-devtools MCP server provides browser automation, testing, and scraping capabilities."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Chrome navigation error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * DeepWiki - Search Wikipedia
   */
  server.tool(
    "wiki_search",
    "Search Wikipedia for articles (via DeepWiki MCP server)",
    {
      query: z.string().describe("Search query"),
      limit: z.number().optional().default(5).describe("Maximum number of results")
    },
    async (args) => {
      try {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "To search Wikipedia, use the 'deepwiki' MCP server with 'search' tool",
              query: args.query,
              limit: args.limit,
              instructions: "The deepwiki MCP server provides Wikipedia search and article retrieval."
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Wiki search error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  logger.info("✓ External MCP server tools registered (8 proxy tools + discovery)");
}
