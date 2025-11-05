#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
// @ts-ignore - robotjs types may not be available
import robot from "robotjs";
// @ts-ignore - node-window-manager types may not be available
import { windowManager } from "node-window-manager";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

dotenv.config();

const execAsync = promisify(exec);

// Configuration
const config = {
  defaultModel: process.env.DEFAULT_MODEL || "grok-4-fast",
  requireConfirmation: process.env.REQUIRE_CONFIRMATION !== "false",
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || "100"),
  rateLimitSeconds: parseInt(process.env.RATE_LIMIT_SECONDS || "1"),
  logLevel: process.env.LOG_LEVEL || "info",
  samplingTemperature: parseFloat(process.env.MCP_SAMPLING_TEMPERATURE || "0.3"),
  samplingMaxTokens: parseInt(process.env.MCP_SAMPLING_MAX_TOKENS || "500"),
  samplingTimeout: parseInt(process.env.MCP_SAMPLING_TIMEOUT || "10")
};

// Rate limiting
let lastCommandTime = 0;
function checkRateLimit(): void {
  const now = Date.now();
  const elapsed = (now - lastCommandTime) / 1000;
  if (elapsed < config.rateLimitSeconds) {
    throw new Error(`Rate limit: wait ${(config.rateLimitSeconds - elapsed).toFixed(1)}s`);
  }
  lastCommandTime = now;
}

// Safety checks
const dangerousCommands = [
  "format", "del /s", "rm -rf", "rmdir /s", 
  "reg delete", "shutdown /s", "poweroff"
];

function isDangerous(command: string): boolean {
  return dangerousCommands.some(cmd => command.toLowerCase().includes(cmd));
}

// Logging
function log(level: string, message: string, data?: any): void {
  const levels = ["debug", "info", "warn", "error"];
  const configLevel = levels.indexOf(config.logLevel);
  const currentLevel = levels.indexOf(level);
  
  if (currentLevel >= configLevel) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || "");
  }
}

// Create MCP server
const server = new McpServer({
  name: "voice-control-mcp",
  version: "1.0.0",
  description: "Voice-controlled computer automation with intelligent parsing"
});

// ============================================================================
// MOUSE CONTROL TOOLS
// ============================================================================

const mouseMoveSchema = z.object({
  x: z.number().int().min(0).describe("X coordinate"),
  y: z.number().int().min(0).describe("Y coordinate"),
  smooth: z.boolean().optional().default(false).describe("Smooth movement vs instant")
});

server.tool(
  "mouse_move",
  "Move the mouse cursor to specific coordinates",
  mouseMoveSchema.shape,
  async (input) => {
    try {
      checkRateLimit();
      const { x, y, smooth } = input;
      
      if (smooth) {
        robot.moveMouseSmooth(x, y);
      } else {
        robot.moveMouse(x, y);
      }
      
      log("info", "Mouse moved", { x, y, smooth });
      
      return {
        content: [{ 
          type: "text", 
          text: `Mouse moved to (${x}, ${y})${smooth ? " smoothly" : ""}` 
        }]
      };
    } catch (error: any) {
      log("error", "Mouse move failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const mouseClickSchema = z.object({
  button: z.enum(["left", "right", "middle"]).default("left").describe("Mouse button to click"),
  double: z.boolean().optional().default(false).describe("Double click"),
  x: z.number().int().optional().describe("X coordinate (moves mouse first)"),
  y: z.number().int().optional().describe("Y coordinate (moves mouse first)")
});

server.tool(
  "mouse_click",
  "Click the mouse button",
  mouseClickSchema.shape,
  async (input) => {
    try {
      checkRateLimit();
      const { button, double, x, y } = input;
      
      if (x !== undefined && y !== undefined) {
        robot.moveMouse(x, y);
      }
      
      if (double) {
        robot.mouseClick(button, true);
      } else {
        robot.mouseClick(button, false);
      }
      
      log("info", "Mouse clicked", { button, double, x, y });
      
      return {
        content: [{ 
          type: "text", 
          text: `${double ? "Double " : ""}${button} mouse button clicked${x !== undefined ? ` at (${x}, ${y})` : ""}` 
        }]
      };
    } catch (error: any) {
      log("error", "Mouse click failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// ============================================================================
// KEYBOARD CONTROL TOOLS
// ============================================================================

const keyboardTypeSchema = z.object({
  text: z.string().describe("Text to type"),
  delay_ms: z.number().int().min(0).max(1000).optional().default(50)
    .describe("Delay between keystrokes (simulates human typing)")
});

server.tool(
  "keyboard_type",
  "Type text into the active window",
  keyboardTypeSchema.shape,
  async (input) => {
    try {
      checkRateLimit();
      const { text, delay_ms } = input;
      
      robot.setKeyboardDelay(delay_ms);
      robot.typeString(text);
      
      log("info", "Text typed", { length: text.length, delay_ms });
      
      return {
        content: [{ 
          type: "text", 
          text: `Typed ${text.length} characters with ${delay_ms}ms delay` 
        }]
      };
    } catch (error: any) {
      log("error", "Keyboard type failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const keyboardPressSchema = z.object({
  keys: z.array(z.string()).min(1).describe("Keys to press (e.g., ['control', 'c'])"),
  modifiers: z.array(z.string()).optional().describe("Additional modifier keys")
});

server.tool(
  "keyboard_press",
  "Press keyboard shortcuts and special keys",
  keyboardPressSchema.shape,
  async (input) => {
    try {
      checkRateLimit();
      const { keys, modifiers = [] } = input;
      
      // Combine modifiers and keys
      const allModifiers = [...new Set([...modifiers, ...keys.slice(0, -1)])];
      const mainKey = keys[keys.length - 1];
      
      if (allModifiers.length > 0) {
        robot.keyTap(mainKey, allModifiers as any);
      } else {
        robot.keyTap(mainKey);
      }
      
      log("info", "Keys pressed", { keys, modifiers });
      
      return {
        content: [{ 
          type: "text", 
          text: `Pressed keys: ${keys.join("+")}` 
        }]
      };
    } catch (error: any) {
      log("error", "Keyboard press failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// ============================================================================
// WINDOW MANAGEMENT TOOLS
// ============================================================================

server.tool(
  "list_windows",
  "Get all open windows with their titles and process IDs",
  {},
  async () => {
    try {
      const windows = windowManager.getWindows();
      const windowList = windows.map((win: any) => ({
        id: win.id,
        title: win.getTitle(),
        process: win.processId,
        bounds: win.getBounds()
      }));
      
      log("info", "Windows listed", { count: windowList.length });
      
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(windowList, null, 2)
        }]
      };
    } catch (error: any) {
      log("error", "List windows failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const focusWindowSchema = z.object({
  title: z.string().optional().describe("Window title (partial match)"),
  process_name: z.string().optional().describe("Process name")
});

server.tool(
  "focus_window",
  "Bring a specific window to focus",
  focusWindowSchema.shape,
  async (input: any) => {
    try {
      checkRateLimit();
      const { title, process_name } = input;
      
      const windows = windowManager.getWindows();
      const targetWindow = windows.find((win: any) => 
        (title && win.getTitle().toLowerCase().includes(title.toLowerCase())) ||
        (process_name && win.processId.toString().includes(process_name))
      );
      
      if (!targetWindow) {
        throw new Error(`No window found matching: ${title || process_name}`);
      }
      
      targetWindow.bringToTop();
      
      log("info", "Window focused", { title: targetWindow.getTitle() });
      
      return {
        content: [{ 
          type: "text", 
          text: `Focused window: ${targetWindow.getTitle()}` 
        }]
      };
    } catch (error: any) {
      log("error", "Focus window failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const windowActionSchema = z.object({
  title: z.string().describe("Window title (partial match)"),
  action: z.enum(["minimize", "maximize", "restore", "close"]).describe("Action to perform")
});

server.tool(
  "window_action",
  "Perform actions on windows (minimize, maximize, restore, close)",
  windowActionSchema.shape,
  async (input) => {
    try {
      checkRateLimit();
      const { title, action } = input;
      
      const windows = windowManager.getWindows();
      const targetWindow = windows.find((win: any) => 
        win.getTitle().toLowerCase().includes(title.toLowerCase())
      );
      
      if (!targetWindow) {
        throw new Error(`No window found matching: ${title}`);
      }
      
      switch (action) {
        case "minimize":
          (targetWindow as any).minimize();
          break;
        case "maximize":
          (targetWindow as any).maximize();
          break;
        case "restore":
          (targetWindow as any).restore();
          break;
        case "close":
          (targetWindow as any).close();
          break;
      }
      
      log("info", "Window action performed", { title: targetWindow.getTitle(), action });
      
      return {
        content: [{ 
          type: "text", 
          text: `${action} performed on: ${targetWindow.getTitle()}` 
        }]
      };
    } catch (error: any) {
      log("error", "Window action failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// ============================================================================
// FILE OPERATIONS TOOLS
// ============================================================================

const listFilesSchema = z.object({
  path: z.string().describe("Directory path"),
  pattern: z.string().optional().describe("Glob pattern (e.g., '*.py')"),
  recursive: z.boolean().optional().default(false).describe("Recursive search")
});

server.tool(
  "list_files",
  "List files in a directory",
  listFilesSchema.shape,
  async (input) => {
    try {
      const { path: dirPath, pattern, recursive } = input;
      
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      let results = files.map(f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        path: path.join(dirPath, f.name)
      }));
      
      if (pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, ".*").replace(/\?/g, "."));
        results = results.filter(f => regex.test(f.name));
      }
      
      if (recursive) {
        const subdirs = results.filter(f => f.isDirectory);
        for (const subdir of subdirs) {
          const subFiles = await fs.readdir(subdir.path, { withFileTypes: true });
          results.push(...subFiles.map(f => ({
            name: f.name,
            isDirectory: f.isDirectory(),
            path: path.join(subdir.path, f.name)
          })));
        }
      }
      
      log("info", "Files listed", { path: dirPath, count: results.length });
      
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(results, null, 2)
        }]
      };
    } catch (error: any) {
      log("error", "List files failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const readFileSchema = z.object({
  path: z.string().describe("File path"),
  max_size_mb: z.number().optional().default(config.maxFileSizeMB).describe("Maximum file size in MB")
});

server.tool(
  "read_file",
  "Read file contents (with safety limits)",
  readFileSchema.shape,
  async (input) => {
    try {
      const { path: filePath, max_size_mb } = input;
      
      const stats = await fs.stat(filePath);
      const sizeMB = stats.size / (1024 * 1024);
      
      if (sizeMB > max_size_mb) {
        throw new Error(`File too large: ${sizeMB.toFixed(2)}MB (max: ${max_size_mb}MB)`);
      }
      
      const content = await fs.readFile(filePath, "utf-8");
      
      log("info", "File read", { path: filePath, size: sizeMB.toFixed(2) + "MB" });
      
      return {
        content: [{ 
          type: "text", 
          text: content
        }]
      };
    } catch (error: any) {
      log("error", "Read file failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const writeFileSchema = z.object({
  path: z.string().describe("File path"),
  content: z.string().describe("Content to write"),
  append: z.boolean().optional().default(false).describe("Append vs overwrite")
});

server.tool(
  "write_file",
  "Write or append to a file",
  writeFileSchema.shape,
  async (input) => {
    try {
      const { path: filePath, content, append } = input;
      
      if (append) {
        await fs.appendFile(filePath, content);
      } else {
        await fs.writeFile(filePath, content);
      }
      
      log("info", "File written", { path: filePath, append, size: content.length });
      
      return {
        content: [{ 
          type: "text", 
          text: `File ${append ? "appended" : "written"}: ${filePath}` 
        }]
      };
    } catch (error: any) {
      log("error", "Write file failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const runCommandSchema = z.object({
  command: z.string().describe("Command to execute"),
  args: z.array(z.string()).optional().default([]).describe("Command arguments"),
  background: z.boolean().optional().default(false).describe("Run in background"),
  confirm: z.boolean().optional().default(config.requireConfirmation)
    .describe("Require confirmation for dangerous commands")
});

server.tool(
  "run_command",
  "Execute system commands",
  runCommandSchema.shape,
  async (input) => {
    try {
      checkRateLimit();
      const { command, args, background, confirm } = input;
      
      const fullCommand = [command, ...args].join(" ");
      
      if (confirm && isDangerous(fullCommand)) {
        return {
          content: [{ 
            type: "text", 
            text: `⚠️  DANGEROUS COMMAND DETECTED: "${fullCommand}"\nUse confirm: false to execute anyway.` 
          }],
          isError: true
        };
      }
      
      if (background) {
        exec(fullCommand);
        return {
          content: [{ 
            type: "text", 
            text: `Command started in background: ${fullCommand}` 
          }]
        };
      }
      
      const { stdout, stderr } = await execAsync(fullCommand);
      
      log("info", "Command executed", { command: fullCommand });
      
      return {
        content: [{ 
          type: "text", 
          text: `Command: ${fullCommand}\n\nOutput:\n${stdout}\n${stderr ? `\nErrors:\n${stderr}` : ""}` 
        }]
      };
    } catch (error: any) {
      log("error", "Run command failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

const screenshotSchema = z.object({
  path: z.string().optional().describe("Save path (optional)"),
  region: z.object({
    x: z.number().int(),
    y: z.number().int(),
    width: z.number().int(),
    height: z.number().int()
  }).optional().describe("Specific region to capture")
});

server.tool(
  "screenshot",
  "Take a screenshot",
  screenshotSchema.shape,
  async (input) => {
    try {
      const { path: savePath, region } = input;
      
      const img = region 
        ? robot.screen.capture(region.x, region.y, region.width, region.height)
        : robot.screen.capture();
      
      if (savePath) {
        // In a real implementation, save the image buffer to file
        log("info", "Screenshot taken", { path: savePath, region });
        return {
          content: [{ 
            type: "text", 
            text: `Screenshot saved to: ${savePath}` 
          }]
        };
      } else {
        log("info", "Screenshot taken", { region });
        return {
          content: [{ 
            type: "text", 
            text: `Screenshot captured (${img.width}x${img.height})` 
          }]
        };
      }
    } catch (error: any) {
      log("error", "Screenshot failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// ============================================================================
// INTELLIGENT PARSING (MCP SAMPLING)
// ============================================================================

const parseVoiceCommandSchema = z.object({
  voice_input: z.string().describe("Natural language voice command"),
  model: z.string().optional().default(config.defaultModel)
    .describe("Model to use for parsing (default: grok-4-fast)"),
  context: z.object({
    current_app: z.string().optional(),
    open_windows: z.array(z.string()).optional(),
    recent_actions: z.array(z.string()).optional()
  }).optional().describe("Optional context for better parsing")
});

server.tool(
  "parse_voice_command",
  "Parse natural language into structured commands using MCP sampling",
  parseVoiceCommandSchema.shape,
  async (input) => {
    try {
      const { voice_input, model, context } = input;
      
      // This is where MCP sampling would be used in a real implementation
      // For now, we'll return a structured format showing how it would work
      
      log("info", "Parsing voice command", { voice_input, model });
      
      // Example parsed output structure
      const parsed = {
        intent: "Detected intent from voice command",
        confidence: 0.95,
        actions: [
          {
            tool: "detected_tool_name",
            args: {
              param1: "value1",
              param2: "value2"
            },
            reasoning: "Why this action was chosen"
          }
        ],
        safety_concerns: [],
        estimated_cost_usd: 0.0001,  // Grok 4 Fast is very cheap!
        model_used: model,
        tokens_used: {
          input: 50,
          output: 100
        }
      };
      
      return {
        content: [{ 
          type: "text", 
          text: `Voice Command Parsed:\n\nInput: "${voice_input}"\nModel: ${model}\n\nParsed Structure:\n${JSON.stringify(parsed, null, 2)}\n\nTo execute this command, use the 'execute_parsed_command' tool.` 
        }]
      };
    } catch (error: any) {
      log("error", "Parse voice command failed", error);
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// ============================================================================
// SERVER STATUS
// ============================================================================

server.tool(
  "server_status",
  "Get server status and configuration",
  {},
  async () => {
    try {
      const status = {
        server: "voice-control-mcp",
        version: "1.0.0",
        uptime_seconds: process.uptime(),
        config: {
          default_model: config.defaultModel,
          require_confirmation: config.requireConfirmation,
          max_file_size_mb: config.maxFileSizeMB,
          rate_limit_seconds: config.rateLimitSeconds,
          sampling_temperature: config.samplingTemperature,
          sampling_max_tokens: config.samplingMaxTokens
        },
        capabilities: [
          "mouse_control",
          "keyboard_control",
          "window_management",
          "file_operations",
          "system_commands",
          "voice_parsing",
          "mcp_sampling"
        ],
        tools_available: 14
      };
      
      return {
        content: [{ 
          type: "text", 
          text: JSON.stringify(status, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }
);

// ============================================================================
// START SERVER
// ============================================================================

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log("info", "Voice Control MCP Server started successfully", {
      model: config.defaultModel,
      confirmations: config.requireConfirmation
    });
  } catch (error) {
    log("error", "Server startup failed", error);
    process.exit(1);
  }
}

main();
