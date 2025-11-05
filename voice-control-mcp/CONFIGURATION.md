# Voice Control MCP Server - Example Configurations

## Basic Claude Desktop Configuration

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "voice-control": {
      "command": "node",
      "args": [
        "C:/Users/ephoe/Documents/Coding_Projects/Agents/voice-control-mcp/build/index.js"
      ],
      "env": {
        "DEFAULT_MODEL": "grok-4-fast",
        "REQUIRE_CONFIRMATION": "true",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## VS Code MCP Configuration

**Location**: `.vscode/mcp.json` in your workspace

```json
{
  "mcpServers": {
    "voice-control": {
      "command": "node",
      "args": [
        "${workspaceFolder}/../voice-control-mcp/build/index.js"
      ],
      "env": {
        "DEFAULT_MODEL": "grok-4-fast",
        "MCP_SAMPLING_TEMPERATURE": "0.3",
        "MCP_SAMPLING_MAX_TOKENS": "500"
      }
    }
  }
}
```

## Advanced Configuration with Multiple Models

```json
{
  "mcpServers": {
    "voice-control-fast": {
      "command": "node",
      "args": [
        "C:/path/to/voice-control-mcp/build/index.js"
      ],
      "env": {
        "DEFAULT_MODEL": "grok-4-fast",
        "MCP_SAMPLING_TEMPERATURE": "0.2",
        "RATE_LIMIT_SECONDS": "0.5"
      }
    },
    "voice-control-quality": {
      "command": "node",
      "args": [
        "C:/path/to/voice-control-mcp/build/index.js"
      ],
      "env": {
        "DEFAULT_MODEL": "claude-3-5-sonnet",
        "MCP_SAMPLING_TEMPERATURE": "0.3",
        "REQUIRE_CONFIRMATION": "true"
      }
    }
  }
}
```

## Development Mode Configuration

```json
{
  "mcpServers": {
    "voice-control-dev": {
      "command": "pnpm",
      "args": ["dev"],
      "cwd": "C:/path/to/voice-control-mcp",
      "env": {
        "LOG_LEVEL": "debug",
        "REQUIRE_CONFIRMATION": "false",
        "DEFAULT_MODEL": "grok-4-fast"
      }
    }
  }
}
```

## Production Configuration with Safety

```json
{
  "mcpServers": {
    "voice-control": {
      "command": "node",
      "args": [
        "C:/path/to/voice-control-mcp/build/index.js"
      ],
      "env": {
        "DEFAULT_MODEL": "grok-4-fast",
        "REQUIRE_CONFIRMATION": "true",
        "MAX_FILE_SIZE_MB": "50",
        "RATE_LIMIT_SECONDS": "2",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_MODEL` | `grok-4-fast` | Default model for command parsing |
| `REQUIRE_CONFIRMATION` | `true` | Require confirmation for dangerous operations |
| `MAX_FILE_SIZE_MB` | `100` | Maximum file size for operations |
| `RATE_LIMIT_SECONDS` | `1` | Minimum seconds between commands |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `MCP_SAMPLING_TEMPERATURE` | `0.3` | Temperature for MCP sampling |
| `MCP_SAMPLING_MAX_TOKENS` | `500` | Max tokens for parsing |
| `MCP_SAMPLING_TIMEOUT` | `10` | Timeout in seconds for sampling |

## Platform Integration

To register this MCP server as an optimizable agent in your platform:

```bash
# POST to platform API
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d @agent.config.json
```

Or use the platform UI to upload `agent.config.json`.

## Testing Configuration

Test your configuration with the MCP inspector:

```bash
cd voice-control-mcp
pnpm inspect
```

This will open an inspector UI where you can:
- View all available tools
- Test tool execution
- Monitor logs and errors
- Verify MCP sampling integration
