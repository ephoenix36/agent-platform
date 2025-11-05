# 🎤 Voice-Controlled Computer Automation MCP Server

An intelligent voice-controlled automation system built on the Model Context Protocol (MCP) that allows you to control your computer using natural language commands while you work on other tasks.

## 🌟 Key Features

- **🎙️ Voice Control**: Speak commands naturally while doing other things
- **🤖 Intelligent Parsing**: Uses MCP sampling with fast, cost-effective models (Grok 4 Fast recommended)
- **💻 Full Computer Control**: Mouse, keyboard, windows, files, system commands
- **💰 Cost-Effective**: Optimized to use Grok 4 Fast by default ($0.10/M input, $0.40/M output tokens)
- **🔒 Safety First**: Confirmation prompts for dangerous operations
- **🔧 Self-Optimizing**: Can be registered as an agent in the platform for continuous improvement
- **⚡ Real-Time**: Designed for quick responses with low latency

## 📊 Pricing Comparison (per 1M tokens)

| Model | Input Price | Output Price | Intelligence Index | Speed (t/s) | Best For |
|-------|------------|--------------|-------------------|-------------|----------|
| **Grok 4 Fast** | $0.10 | $0.40 | 60.25 (reasoning) / 38.56 (standard) | Very High | **✅ Recommended - Best balance** |
| GPT-4o mini | $0.15 | $0.60 | 21.15 | High | Budget option |
| Claude 3.5 Haiku | $0.80 | $4.00 | 20.22 | Very High | Quality focus |
| GPT-4o | $2.50 | $10.00 | 26.31 | Medium | Advanced tasks |

**Why Grok 4 Fast?**
- 🚀 Fast reasoning (60.25 intelligence index)
- 💵 Extremely cost-effective ($0.10 input / $0.40 output)
- ⚡ High output speed for real-time responses
- 🎯 Perfect for voice command parsing

## 🚀 Quick Start

### 1. Installation

```bash
cd voice-control-mcp
pnpm install  # or npm install
```

### 2. Configuration

```bash
cp .env.example .env
# Edit .env with your preferences
```

### 3. Build

```bash
pnpm build
```

### 4. Configure MCP Client

Add to your MCP client configuration (VS Code, Claude Desktop, etc.):

**VS Code (`.vscode/mcp.json`):**
```json
{
  "mcpServers": {
    "voice-control": {
      "command": "node",
      "args": [
        "C:/Users/ephoe/Documents/Coding_Projects/Agents/voice-control-mcp/build/index.js"
      ],
      "env": {}
    }
  }
}
```

**Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` or Windows equivalent):**
```json
{
  "mcpServers": {
    "voice-control": {
      "command": "node",
      "args": [
        "C:/Users/ephoe/Documents/Coding_Projects/Agents/voice-control-mcp/build/index.js"
      ]
    }
  }
}
```

### 5. Test

```bash
pnpm inspect
```

## 🎯 Usage Examples

### Basic Voice Commands

```
"Click at coordinates 500, 300"
"Type 'Hello World' into the active window"
"Open the calculator application"
"Close the current window"
"Take a screenshot and save it"
"List all open windows"
```

### Natural Language Commands (Parsed with MCP Sampling)

```
"Move my mouse to the search bar and click it"
"Open Visual Studio Code and create a new file"
"Find all Python files in my Documents folder"
"Take a screenshot of the active window"
"Minimize all windows except Chrome"
```

### Complex Workflows

```
"Start recording my screen, wait 5 seconds, stop recording, and save to Desktop"
"Open Chrome, navigate to GitHub, and click the first repository"
"Find the largest file in Downloads and move it to Archive"
```

## 🛠️ Available Tools

### Core Control Tools

#### `mouse_move`
Move the mouse cursor to specific coordinates.

```typescript
{
  "x": 500,
  "y": 300,
  "smooth": true  // Smooth movement vs instant
}
```

#### `mouse_click`
Click the mouse button.

```typescript
{
  "button": "left",  // left, right, middle
  "double": false,
  "x": 500,          // Optional: move before clicking
  "y": 300
}
```

#### `keyboard_type`
Type text into the active window.

```typescript
{
  "text": "Hello, World!",
  "delay_ms": 50  // Delay between keystrokes (simulates human typing)
}
```

#### `keyboard_press`
Press keyboard shortcuts and special keys.

```typescript
{
  "keys": ["control", "c"],  // Copy
  "modifiers": ["shift"]     // Optional additional modifiers
}
```

### Window Management

#### `list_windows`
Get all open windows with their titles and process IDs.

#### `focus_window`
Bring a specific window to focus.

```typescript
{
  "title": "Visual Studio Code",  // Partial match
  "process_name": "Code.exe"      // Alternative identifier
}
```

#### `close_window`
Close a specific window.

```typescript
{
  "title": "Untitled - Notepad",
  "force": false  // Force close without saving
}
```

#### `window_action`
Perform actions on windows.

```typescript
{
  "title": "Chrome",
  "action": "minimize"  // minimize, maximize, restore, close
}
```

### File Operations

#### `list_files`
List files in a directory.

```typescript
{
  "path": "C:/Users/ephoe/Documents",
  "pattern": "*.py",    // Optional glob pattern
  "recursive": false
}
```

#### `read_file`
Read file contents (with safety limits).

```typescript
{
  "path": "C:/Users/ephoe/Documents/notes.txt",
  "max_size_mb": 10  // Safety limit
}
```

#### `write_file`
Write or append to a file.

```typescript
{
  "path": "C:/Users/ephoe/Documents/log.txt",
  "content": "New log entry",
  "append": true  // Append vs overwrite
}
```

#### `move_file`
Move or rename a file.

```typescript
{
  "from": "C:/Users/ephoe/Downloads/file.pdf",
  "to": "C:/Users/ephoe/Documents/Archive/file.pdf"
}
```

#### `delete_file`
Delete a file (with confirmation for large files).

```typescript
{
  "path": "C:/Users/ephoe/Downloads/temp.txt",
  "force": false  // Skip confirmation
}
```

### System Commands

#### `run_command`
Execute system commands.

```typescript
{
  "command": "calc.exe",
  "args": [],
  "background": true,
  "confirm": true  // Require confirmation for potentially dangerous commands
}
```

#### `screenshot`
Take a screenshot.

```typescript
{
  "path": "C:/Users/ephoe/Desktop/screenshot.png",
  "region": {  // Optional: capture specific region
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080
  }
}
```

### Intelligent Parsing (MCP Sampling)

#### `parse_voice_command`
Parse natural language into structured commands using MCP sampling.

```typescript
{
  "voice_input": "open chrome and go to github",
  "model": "grok-4-fast",  // Optional: override default model
  "context": {              // Optional: provide context
    "current_app": "VS Code",
    "open_windows": ["Chrome", "Terminal"]
  }
}
```

This tool uses MCP sampling to:
1. **Understand Intent**: Parse what the user wants to do
2. **Extract Parameters**: Identify specific targets, locations, actions
3. **Generate Actions**: Convert to a sequence of executable commands
4. **Validate Safety**: Check for potentially dangerous operations

#### `execute_parsed_command`
Execute a previously parsed command with confirmation.

```typescript
{
  "parsed_command": {
    "actions": [
      {"tool": "run_command", "args": {"command": "chrome.exe"}},
      {"tool": "keyboard_type", "args": {"text": "github.com"}}
    ]
  },
  "confirm": true  // Require user confirmation
}
```

## 🔒 Safety Features

### Confirmation System
Dangerous operations require explicit confirmation:
- File deletion (size > 10MB)
- System commands
- Batch operations (> 10 files)
- Window closing without saving

### Rate Limiting
- Minimum 1 second between commands (configurable)
- Prevents accidental command flooding
- Protects against infinite loops

### Size Limits
- File read: 100MB maximum
- File write: 100MB maximum
- Screenshot: Full screen max

### Restricted Commands
Blacklist for dangerous system commands:
- `format`
- `del /s`
- `rm -rf`
- Registry edits (unless explicitly allowed)

## 🤖 Integration with Agent Platform

This MCP server can be registered as an optimizable agent in your platform:

```json
{
  "agent": {
    "name": "voice-control-assistant",
    "type": "mcp-server",
    "capabilities": ["computer-control", "voice-parsing", "automation"],
    "optimization_targets": [
      "command_accuracy",
      "parsing_speed",
      "cost_per_command",
      "user_satisfaction"
    ],
    "model_config": {
      "default_model": "grok-4-fast",
      "fallback_models": ["gpt-4o-mini", "claude-3-5-haiku"],
      "sampling_config": {
        "temperature": 0.3,
        "max_tokens": 500,
        "timeout_seconds": 10
      }
    }
  }
}
```

### Optimization Metrics
- **Accuracy**: % of commands executed correctly
- **Speed**: Average response time
- **Cost**: Total API cost per session
- **Safety**: % of dangerous commands caught
- **User Satisfaction**: User feedback score

## 📈 Performance Optimization

### Command Caching
Frequently used commands are cached to reduce API calls:
```typescript
{
  "cache_enabled": true,
  "cache_ttl_seconds": 300,
  "max_cache_size": 100
}
```

### Batching
Multiple similar commands can be batched:
```typescript
// Instead of 5 separate API calls:
"type 'Hello', press Enter, type 'World', press Enter, save file"

// Parsed as single batch:
{
  "actions": [
    {"type": "keyboard_type", "text": "Hello"},
    {"type": "keyboard_press", "keys": ["enter"]},
    {"type": "keyboard_type", "text": "World"},
    {"type": "keyboard_press", "keys": ["enter"]},
    {"type": "keyboard_press", "keys": ["control", "s"]}
  ]
}
```

### Model Selection
Automatic model selection based on command complexity:
- **Simple commands**: Grok 4 Fast (fastest, cheapest)
- **Complex parsing**: Grok 4 (higher reasoning)
- **Safety-critical**: Claude 3.5 Sonnet (most careful)

## 🔧 Advanced Configuration

### Custom Model Routing

```typescript
{
  "model_routing": {
    "simple_commands": "grok-4-fast",
    "complex_parsing": "grok-4",
    "safety_critical": "claude-3-5-sonnet",
    "code_generation": "claude-3-5-sonnet"
  },
  "command_classification": {
    "simple": ["click", "type", "move"],
    "complex": ["open and navigate", "find and move"],
    "safety_critical": ["delete", "format", "shutdown"]
  }
}
```

### Voice Recognition Integration

For hands-free operation, integrate with speech recognition:

```typescript
// Browser-based (Web Speech API)
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.onresult = async (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  await mcpClient.callTool('parse_voice_command', { voice_input: transcript });
};

// Or use Google Cloud Speech-to-Text, Azure Speech, etc.
```

## 📊 Monitoring & Analytics

The server provides detailed logs and metrics:

```typescript
{
  "session_id": "abc123",
  "commands_executed": 45,
  "total_cost_usd": 0.02,  // Very low with Grok 4 Fast!
  "average_response_ms": 250,
  "accuracy_rate": 0.96,
  "safety_blocks": 2,
  "model_usage": {
    "grok-4-fast": 42,
    "claude-3-5-sonnet": 3
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**Mouse movements not working:**
- Check screen resolution configuration
- Verify robotjs installation: `pnpm rebuild robotjs`

**Windows not focusing:**
- Run as administrator (Windows requires elevated privileges)
- Check window manager permissions

**Voice commands timing out:**
- Increase `MCP_SAMPLING_TIMEOUT` in `.env`
- Check network connection to API providers

**High API costs:**
- Verify `DEFAULT_MODEL` is set to `grok-4-fast`
- Enable command caching
- Review command complexity

### Debug Mode

```bash
LOG_LEVEL=debug pnpm dev
```

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Additional automation tools
- Voice recognition integrations
- Safety improvements
- Performance optimizations
- Platform-specific features (macOS, Linux)

## 📄 License

MIT

## 🙏 Acknowledgments

- Built on [Model Context Protocol](https://modelcontextprotocol.io/)
- Uses [RobotJS](https://robotjs.io/) for automation
- Optimized for [xAI Grok](https://x.ai/) models
- Inspired by voice assistants and automation tools

---

**⚠️ Safety Notice:** This tool has powerful system access. Always review commands before execution, especially when using `force` or `confirm: false` options. Keep `REQUIRE_CONFIRMATION=true` in production.
