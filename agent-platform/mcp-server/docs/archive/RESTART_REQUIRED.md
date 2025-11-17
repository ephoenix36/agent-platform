# MCP Server Restart Required

## Current Situation

The MCP sampling was working, but after making changes to support workflows, the server needs to be restarted properly.

## How to Restart the MCP Server in VS Code

### Option 1: Reload VS Code Window (Recommended)
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `Developer: Reload Window`
3. Press Enter

This will restart all MCP servers with the latest code.

### Option 2: Restart Specific MCP Server
1. Open Command Palette: `Ctrl+Shift+P`
2. Type: `MCP: Restart Server`
3. Select "agents" from the list

### Option 3: Manual Process Kill
```powershell
# Find and kill the agents server process
Get-Process | Where-Object {$_.CommandLine -like "*agent-platform*"} | Stop-Process -Force
```
Then reload the VS Code window.

## After Restart

Test if MCP sampling is working again:
```json
{
  "tool": "execute_agent",
  "arguments": {
    "agentId": "restart-test",
    "prompt": "Say hello and confirm you're working",
    "maxTokens": 100
  }
}
```

You should see a response from `copilot/gpt-5-mini` model (not an Anthropic error).

## Changes Made

✅ **Workflow agent steps now use MCP sampling**
- Updated `executeAgentStep` to pass `includeContext` parameter
- Updated `executeAgentTeamStep` for multi-agent workflows
- Both now support tool access within workflows

## Next Steps After Restart

Once the server is restarted, test:
1. `execute_agent` - should work (was working before)
2. `execute_workflow` with agent steps - should now work with MCP sampling
3. Workflows with tool access enabled
