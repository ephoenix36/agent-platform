/**
 * File Operation Tools
 * 
 * Comprehensive file and directory operations for agents.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_ENCODING = 'utf-8';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Simple glob-like file finder (without external dependency)
 */
function findFiles(dir: string, pattern: RegExp, recursive: boolean = true): string[] {
  const results: string[] = [];
  
  function scan(currentDir: string, basePath: string = '') {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const relativePath = path.join(basePath, item);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          if (recursive && !['node_modules', '.git', 'dist', 'build'].includes(item)) {
            scan(fullPath, relativePath);
          }
        } else if (stats.isFile() && pattern.test(relativePath)) {
          results.push(relativePath);
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }
  
  scan(dir);
  return results;
}

/**
 * Check if path is allowed based on configuration
 */
function isPathAllowed(filePath: string, deniedDirectories: string[] = []): boolean {
  const normalizedPath = path.normalize(filePath);
  
  for (const denied of deniedDirectories) {
    if (normalizedPath.includes(path.normalize(denied))) {
      return false;
    }
  }
  
  return true;
}

/**
 * Read file content safely
 */
function readFileSafe(filePath: string, maxSize: number = MAX_FILE_SIZE): string {
  const stats = fs.statSync(filePath);
  
  if (stats.size > maxSize) {
    throw new Error(`File too large: ${stats.size} bytes (max: ${maxSize} bytes)`);
  }
  
  return fs.readFileSync(filePath, DEFAULT_ENCODING);
}

export function registerFileOperationTools(server: McpServer, logger: Logger) {
  
  /**
   * Read file content
   */
  server.tool(
    "file_read",
    "Read the complete contents of a file",
    {
      path: z.string().describe("Absolute or relative file path"),
      encoding: z.string().optional().default('utf-8').describe("File encoding"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.path, ['node_modules', '.git', 'dist', 'build'])) {
          throw new Error(`Access denied to path: ${args.path}`);
        }
        
        const content = readFileSafe(args.path);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              path: args.path,
              content,
              size: content.length,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to read file:", error);
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
   * Write file content
   */
  server.tool(
    "file_write",
    "Write content to a file (creates parent directories if needed)",
    {
      path: z.string().describe("File path to write"),
      content: z.string().describe("Content to write"),
      encoding: z.string().optional().default('utf-8').describe("File encoding"),
      createDirs: z.boolean().optional().default(true).describe("Create parent directories"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.path)) {
          throw new Error(`Access denied to path: ${args.path}`);
        }
        
        // Create parent directories if needed
        if (args.createDirs) {
          const dir = path.dirname(args.path);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        }
        
        fs.writeFileSync(args.path, args.content, args.encoding as BufferEncoding);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `File written successfully: ${args.path}`,
              path: args.path,
              size: args.content.length,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to write file:", error);
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
   * Append to file
   */
  server.tool(
    "file_append",
    "Append content to an existing file",
    {
      path: z.string().describe("File path"),
      content: z.string().describe("Content to append"),
      newline: z.boolean().optional().default(true).describe("Add newline before content"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.path)) {
          throw new Error(`Access denied to path: ${args.path}`);
        }
        
        const contentToAppend = args.newline && fs.existsSync(args.path) 
          ? '\n' + args.content 
          : args.content;
        
        fs.appendFileSync(args.path, contentToAppend, DEFAULT_ENCODING);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Content appended to: ${args.path}`,
              path: args.path,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to append to file:", error);
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
   * Delete file
   */
  server.tool(
    "file_delete",
    "Delete a file",
    {
      path: z.string().describe("File path to delete"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.path)) {
          throw new Error(`Access denied to path: ${args.path}`);
        }
        
        if (!fs.existsSync(args.path)) {
          throw new Error(`File does not exist: ${args.path}`);
        }
        
        fs.unlinkSync(args.path);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `File deleted: ${args.path}`,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to delete file:", error);
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
   * Check if file/directory exists
   */
  server.tool(
    "file_exists",
    "Check if a file or directory exists",
    {
      path: z.string().describe("Path to check"),
    },
    async (args) => {
      try {
        const exists = fs.existsSync(args.path);
        let stats = null;
        
        if (exists) {
          const s = fs.statSync(args.path);
          stats = {
            isFile: s.isFile(),
            isDirectory: s.isDirectory(),
            size: s.size,
            created: s.birthtime,
            modified: s.mtime,
          };
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              exists,
              path: args.path,
              stats,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to check file existence:", error);
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
   * List directory contents
   */
  server.tool(
    "dir_list",
    "List contents of a directory",
    {
      path: z.string().describe("Directory path"),
      recursive: z.boolean().optional().default(false).describe("List recursively"),
      includeHidden: z.boolean().optional().default(false).describe("Include hidden files"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.path)) {
          throw new Error(`Access denied to path: ${args.path}`);
        }
        
        if (!fs.existsSync(args.path)) {
          throw new Error(`Directory does not exist: ${args.path}`);
        }
        
        const stats = fs.statSync(args.path);
        if (!stats.isDirectory()) {
          throw new Error(`Path is not a directory: ${args.path}`);
        }
        
        let items: any[] = [];
        
        if (args.recursive) {
          const pattern = args.includeHidden ? /.*/ : /^[^.]/;
          const files = findFiles(args.path, pattern, true);
          items = files.map((file: string) => {
            const fullPath = path.join(args.path, file);
            const s = fs.statSync(fullPath);
            return {
              name: file,
              path: fullPath,
              isDirectory: s.isDirectory(),
              isFile: s.isFile(),
              size: s.size,
              modified: s.mtime,
            };
          });
        } else {
          const files = fs.readdirSync(args.path);
          items = files
            .filter(file => args.includeHidden || !file.startsWith('.'))
            .map(file => {
              const fullPath = path.join(args.path, file);
              const s = fs.statSync(fullPath);
              return {
                name: file,
                path: fullPath,
                isDirectory: s.isDirectory(),
                isFile: s.isFile(),
                size: s.size,
                modified: s.mtime,
              };
            });
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              path: args.path,
              count: items.length,
              items,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to list directory:", error);
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
   * Create directory
   */
  server.tool(
    "dir_create",
    "Create a directory (creates parent directories if needed)",
    {
      path: z.string().describe("Directory path to create"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.path)) {
          throw new Error(`Access denied to path: ${args.path}`);
        }
        
        fs.mkdirSync(args.path, { recursive: true });
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Directory created: ${args.path}`,
              path: args.path,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to create directory:", error);
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
   * Copy file
   */
  server.tool(
    "file_copy",
    "Copy a file to a new location",
    {
      source: z.string().describe("Source file path"),
      destination: z.string().describe("Destination file path"),
      overwrite: z.boolean().optional().default(false).describe("Overwrite if exists"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.source) || !isPathAllowed(args.destination)) {
          throw new Error(`Access denied`);
        }
        
        if (!fs.existsSync(args.source)) {
          throw new Error(`Source file does not exist: ${args.source}`);
        }
        
        if (fs.existsSync(args.destination) && !args.overwrite) {
          throw new Error(`Destination already exists: ${args.destination}. Use overwrite=true to replace.`);
        }
        
        // Create parent directory if needed
        const dir = path.dirname(args.destination);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.copyFileSync(args.source, args.destination);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `File copied: ${args.source} → ${args.destination}`,
              source: args.source,
              destination: args.destination,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to copy file:", error);
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
   * Move/rename file
   */
  server.tool(
    "file_move",
    "Move or rename a file",
    {
      source: z.string().describe("Source file path"),
      destination: z.string().describe("Destination file path"),
      overwrite: z.boolean().optional().default(false).describe("Overwrite if exists"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.source) || !isPathAllowed(args.destination)) {
          throw new Error(`Access denied`);
        }
        
        if (!fs.existsSync(args.source)) {
          throw new Error(`Source file does not exist: ${args.source}`);
        }
        
        if (fs.existsSync(args.destination) && !args.overwrite) {
          throw new Error(`Destination already exists: ${args.destination}. Use overwrite=true to replace.`);
        }
        
        // Create parent directory if needed
        const dir = path.dirname(args.destination);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.renameSync(args.source, args.destination);
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `File moved: ${args.source} → ${args.destination}`,
              source: args.source,
              destination: args.destination,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to move file:", error);
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
   * Search files by pattern
   */
  server.tool(
    "file_search",
    "Search for files matching a glob pattern",
    {
      pattern: z.string().describe("Glob pattern (e.g., '**/*.ts', 'src/**/*.json')"),
      cwd: z.string().optional().default(process.cwd()).describe("Base directory for search"),
      includeHidden: z.boolean().optional().default(false).describe("Include hidden files"),
      limit: z.number().optional().default(100).describe("Maximum number of results"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.cwd)) {
          throw new Error(`Access denied to path: ${args.cwd}`);
        }
        
        // Convert glob pattern to regex (simplified)
        const regexPattern = args.pattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const regex = new RegExp(regexPattern);
        
        const files = findFiles(args.cwd!, regex, true);
        
        const results = files.slice(0, args.limit).map((file: string) => {
          const fullPath = path.join(args.cwd!, file);
          const stats = fs.statSync(fullPath);
          return {
            path: fullPath,
            relativePath: file,
            size: stats.size,
            modified: stats.mtime,
          };
        });
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              pattern: args.pattern,
              cwd: args.cwd,
              count: results.length,
              total: files.length,
              results,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to search files:", error);
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
   * Get file info/stats
   */
  server.tool(
    "file_info",
    "Get detailed information about a file or directory",
    {
      path: z.string().describe("File or directory path"),
    },
    async (args) => {
      try {
        if (!fs.existsSync(args.path)) {
          throw new Error(`Path does not exist: ${args.path}`);
        }
        
        const stats = fs.statSync(args.path);
        const info = {
          path: args.path,
          absolutePath: path.resolve(args.path),
          name: path.basename(args.path),
          extension: path.extname(args.path),
          directory: path.dirname(args.path),
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          permissions: {
            readable: fs.constants.R_OK,
            writable: fs.constants.W_OK,
            executable: fs.constants.X_OK,
          }
        };
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              info,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to get file info:", error);
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
   * Search file content
   */
  server.tool(
    "file_grep",
    "Search for text within files (grep-like functionality)",
    {
      pattern: z.string().describe("Text pattern to search for (regex supported)"),
      filePattern: z.string().describe("File glob pattern (e.g., '**/*.ts')"),
      cwd: z.string().optional().default(process.cwd()).describe("Base directory"),
      caseSensitive: z.boolean().optional().default(false).describe("Case-sensitive search"),
      contextLines: z.number().optional().default(0).describe("Number of context lines to include"),
      limit: z.number().optional().default(50).describe("Maximum number of matches"),
    },
    async (args) => {
      try {
        if (!isPathAllowed(args.cwd)) {
          throw new Error(`Access denied to path: ${args.cwd}`);
        }
        
        // Convert glob pattern to regex
        const fileRegexPattern = args.filePattern
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*');
        const fileRegex = new RegExp(fileRegexPattern);
        
        const files = findFiles(args.cwd!, fileRegex, true);
        
        const regex = new RegExp(args.pattern, args.caseSensitive ? 'g' : 'gi');
        const matches: any[] = [];
        
        for (const file of files) {
          if (matches.length >= args.limit) break;
          
          const fullPath = path.join(args.cwd!, file);
          try {
            const content = readFileSafe(fullPath);
            const lines = content.split('\n');
            
            lines.forEach((line, lineNum) => {
              if (matches.length >= args.limit) return;
              
              if (regex.test(line)) {
                const context = {
                  before: args.contextLines > 0 
                    ? lines.slice(Math.max(0, lineNum - args.contextLines), lineNum)
                    : [],
                  after: args.contextLines > 0
                    ? lines.slice(lineNum + 1, lineNum + 1 + args.contextLines)
                    : []
                };
                
                matches.push({
                  file: fullPath,
                  relativePath: file,
                  line: lineNum + 1,
                  content: line,
                  context,
                });
              }
            });
          } catch (err) {
            // Skip files that can't be read
            logger.debug(`Skipping file ${file}: ${err}`);
          }
        }
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              pattern: args.pattern,
              filePattern: args.filePattern,
              count: matches.length,
              matches,
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Failed to grep files:", error);
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

  logger.info("✓ File operation tools registered (12 tools)");
}
