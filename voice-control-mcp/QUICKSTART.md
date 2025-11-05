# 🚀 Voice Control MCP Server - Quick Start Guide

Get up and running with voice-controlled computer automation in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- pnpm, npm, or yarn package manager
- Windows, macOS, or Linux
- An MCP client (VS Code with MCP extension, Claude Desktop, etc.)

## Step 1: Installation (2 minutes)

```bash
# Navigate to the project directory
cd C:/Users/ephoe/Documents/Coding_Projects/Agents/voice-control-mcp

# Install dependencies (pnpm recommended for speed)
pnpm install

# Or use npm
npm install
```

## Step 2: Configuration (1 minute)

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if you want to customize settings
# Default settings use Grok 4 Fast and are production-ready
```

**Default configuration (no changes needed):**
- Model: Grok 4 Fast (best speed/cost ratio)
- Confirmations: Enabled for safety
- Rate limit: 1 second between commands
- Max file size: 100MB

## Step 3: Build (1 minute)

```bash
# Build the TypeScript project
pnpm build

# Or use npm
npm run build
```

## Step 4: Configure MCP Client (1 minute)

### For VS Code:

Create `.vscode/mcp.json` in your workspace:

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

### For Claude Desktop:

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

## Step 5: Test It! (30 seconds)

### Option A: Use MCP Inspector

```bash
pnpm inspect
```

This opens a web UI where you can test all tools interactively.

### Option B: Test with your MCP client

Restart your MCP client (VS Code or Claude Desktop), then try these commands:

**Simple test:**
```
"Use the voice-control server to get server status"
```

**Mouse control:**
```
"Use voice-control to move my mouse to coordinates 500, 300"
```

**Window management:**
```
"Use voice-control to list all open windows"
```

**Voice parsing:**
```
"Use voice-control to parse the command: open calculator"
```

## Common First Commands

### 1. Check Server Status
```json
{
  "tool": "server_status",
  "arguments": {}
}
```

Expected output: Server version, capabilities, and configuration

### 2. List Windows
```json
{
  "tool": "list_windows",
  "arguments": {}
}
```

Expected output: All open windows with titles and IDs

### 3. Move Mouse
```json
{
  "tool": "mouse_move",
  "arguments": {
    "x": 500,
    "y": 300,
    "smooth": true
  }
}
```

Expected output: Mouse moves smoothly to (500, 300)

### 4. Type Text
```json
{
  "tool": "keyboard_type",
  "arguments": {
    "text": "Hello from MCP!",
    "delay_ms": 50
  }
}
```

Expected output: Text typed into active window

### 5. Parse Voice Command
```json
{
  "tool": "parse_voice_command",
  "arguments": {
    "voice_input": "open the calculator application"
  }
}
```

Expected output: Structured command with actions to execute

## Next Steps

### Integrate with Voice Recognition

**Browser-based (Web Speech API):**
```javascript
const recognition = new webkitSpeechRecognition();
recognition.onresult = async (event) => {
  const command = event.results[event.results.length - 1][0].transcript;
  // Send to MCP server via your backend API
  await fetch('/api/voice-command', {
    method: 'POST',
    body: JSON.stringify({ voice_input: command })
  });
};
recognition.start();
```

**Desktop app:**
- Use libraries like `node-record-lpcm16` for audio recording
- Integrate with Google Cloud Speech-to-Text or Azure Speech
- See examples in `EXAMPLES.md`

### Register as Platform Agent

To enable optimization and monitoring:

```bash
# Register with your agent platform
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d @agent.config.json
```

Or use the platform UI to upload `agent.config.json`.

### Customize Model Selection

Edit `.env` to change the default model:

```bash
# Use Claude 3.5 Haiku for higher quality
DEFAULT_MODEL=claude-3-5-haiku

# Use GPT-4o mini for OpenAI ecosystem
DEFAULT_MODEL=gpt-4o-mini

# Use Grok 4 for more complex reasoning (still cheap!)
DEFAULT_MODEL=grok-4
```

### Advanced Configuration

See `CONFIGURATION.md` for:
- Multiple model routing
- Custom safety rules
- Performance tuning
- Production deployment
- Monitoring and analytics

## Troubleshooting

### "Cannot find module 'robotjs'"

```bash
# Rebuild native dependencies
pnpm rebuild robotjs
# or
npm rebuild robotjs
```

### "Permission denied" errors

**Windows:**
- Run as Administrator for window management features

**macOS:**
- Grant Accessibility permissions in System Preferences

**Linux:**
- Install X11 development headers: `sudo apt-get install libx11-dev`

### Mouse/keyboard not working

1. Check that RobotJS is properly installed:
   ```bash
   node -e "const robot = require('robotjs'); console.log(robot.getMousePos())"
   ```

2. Rebuild for your platform:
   ```bash
   pnpm rebuild
   ```

### MCP client not connecting

1. Verify the path in your MCP config is correct
2. Check that the build completed successfully: `ls build/index.js`
3. Test manually: `node build/index.js` (should not error)
4. Check logs in your MCP client

### High API costs

1. Verify you're using Grok 4 Fast:
   ```bash
   echo $DEFAULT_MODEL  # Should show "grok-4-fast"
   ```

2. Enable command caching (planned feature)

3. Review command complexity in logs

## Performance Tips

1. **Use Grok 4 Fast** for 80% of commands (fastest + cheapest)
2. **Route by complexity**: Use Claude for safety-critical operations only
3. **Enable caching**: Frequently used commands cached locally
4. **Batch operations**: Combine multiple actions when possible
5. **Rate limit wisely**: Balance responsiveness vs API costs

## Cost Estimate

**Typical usage** (500 commands/day with Grok 4 Fast):
- **Daily**: $0.0225
- **Monthly**: $0.68
- **Annual**: $8.21

**That's less than a coffee per month!** ☕

## Support & Resources

- **Documentation**: `README.md`, `CONFIGURATION.md`, `EXAMPLES.md`
- **Agent Config**: `agent.config.json`
- **Issues**: Check TypeScript errors with `pnpm build`
- **Logs**: Set `LOG_LEVEL=debug` in `.env`
- **Community**: [MCP Discord](https://discord.gg/modelcontextprotocol)

## What's Next?

You now have a powerful voice-controlled automation system! Try:

1. **Natural language commands**: "open chrome and go to github"
2. **Complex workflows**: "find all PDFs and move them to archive"
3. **System automation**: "take a screenshot every 5 minutes"
4. **Custom integrations**: Connect to your own services

Happy automating! 🎉
