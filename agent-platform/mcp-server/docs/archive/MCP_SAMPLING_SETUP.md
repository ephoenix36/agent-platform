# MCP Sampling Configuration Guide

## ✅ What Was Configured

The Agent Platform MCP Server now uses **MCP Sampling** as the primary method for AI agent execution. This means:

- **✅ No API keys required!** Agents use the client's LLM (Claude, GPT, Gemini, etc.)
- **✅ No additional costs** - uses your existing subscription
- **✅ Automatic fallback** to API providers if MCP unavailable
- **✅ Full feature support** - all agent capabilities work via sampling

## 🚀 How It Works

### Architecture

```
┌─────────────────┐
│  VS Code/Client │  ← Your existing LLM subscription (Claude Pro, GPT, etc.)
└────────┬────────┘
         │ MCP Connection
         ↓
┌─────────────────┐
│   MCP Server    │  ← Agent Platform Server
│  (This Server)  │
└────────┬────────┘
         │
         ↓
    ┌────────────────────────────┐
    │ Agent Execution Flow:      │
    │ 1. Try MCP Sampling FIRST  │ ← Uses YOUR LLM
    │ 2. Fallback to API keys    │ ← If MCP unavailable
    └────────────────────────────┘
```

### Execution Priority

1. **MCP Sampling** (Primary) - Uses client's LLM
2. **API Providers** (Fallback) - Uses API keys if configured

## 📝 Configuration Files

### Modified Files

1. **`src/services/sampling-service.ts`**
   - Added `setMCPSamplingClient()` function
   - Added `sampleViaMCP()` function
   - Modified `performSampling()` to try MCP first

2. **`src/index.ts`**
   - Initialize `SamplingClient` on startup
   - Register with sampling service
   - Updated startup messages

3. **`.env`**
   - Marked API keys as OPTIONAL
   - Added MCP sampling documentation
   - Updated defaults

## 🎯 Testing MCP Sampling

### Test with Execute Agent

```json
{
  "agentId": "test-agent",
  "prompt": "Say hello and tell me what model you're using",
  "temperature": 0.7
}
```

**Expected behavior:**
- Server will use YOUR client's LLM
- Response will indicate the model used by your client
- No API key errors

### Test Optimization Setup

Now you can run the telemetry specialist without API keys:

```json
{
  "agentId": "telemetry-specialist-001",
  "prompt": "Create optimization system for agent-architect-001",
  "maxTokens": 12000,
  "temperature": 0.3
}
```

## 📊 Monitoring

### Server Logs

The server logs will show:

```
✓ MCP sampling client initialized (using client's LLM)
🤖 Sampling Mode: MCP (uses client's LLM - no API keys required!)
   ↳ Fallback to API providers if MCP unavailable
```

### Debugging

If MCP sampling fails, you'll see:
```
MCP sampling failed, falling back to API providers: <error message>
```

This is normal if:
- Client doesn't support sampling
- Connection is not established
- Client capabilities limited

## 🔧 Advanced Configuration

### Caching

MCP sampling includes caching (5 min TTL by default):

```typescript
const samplingClient = new SamplingClient(server, 300000); // 5 min cache
```

### Retry Logic

- Default: 3 retries with exponential backoff
- Timeout: 30 seconds per request
- Configurable in `SamplingClient` constructor

### Model Selection

MCP delegates model selection to the client. To request specific model:

```json
{
  "model": "claude-4.5-sonnet",
  "prompt": "Your task"
}
```

The client will use this as a hint, but may use a different model based on capabilities.

## ⚠️ Fallback to API Keys

If you want guaranteed model selection, configure API keys in `.env`:

```bash
# For Claude models
ANTHROPIC_API_KEY=sk-ant-...

# For GPT models
OPENAI_API_KEY=sk-...

# For Gemini models
GOOGLE_AI_API_KEY=...
```

## 🎓 Benefits of MCP Sampling

### Cost Savings
- No additional API costs
- Uses existing subscription
- No pay-per-token charges

### Privacy
- Your data stays with your LLM provider
- No third-party API calls for agent execution
- Server never sees API keys

### Flexibility
- Works with any MCP client
- Automatic model capabilities detection
- Seamless client upgrades

## 📚 Related Documentation

- [MCP Specification](https://modelcontextprotocol.io/docs)
- [Sampling Capability](https://modelcontextprotocol.io/docs/concepts/sampling)
- [Agent Tools Documentation](./README.md#agent-tools)

## ✅ Verification Checklist

- [x] SamplingClient initialized in `index.ts`
- [x] Sampling service configured for MCP priority
- [x] Environment variables updated
- [x] Fallback to API providers working
- [x] Server builds successfully
- [x] Documentation updated

## 🎉 Ready to Use!

Your MCP server is now configured to use MCP sampling. Simply connect it to your MCP client and execute agents - they'll automatically use your client's LLM!

No API keys needed! 🚀
