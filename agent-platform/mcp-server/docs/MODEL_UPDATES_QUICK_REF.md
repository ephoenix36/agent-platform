# Model Configuration Quick Reference

## New Default Models

```typescript
// Smart Model (Complex Reasoning)
"gpt-5"

// Default Model (General Purpose)
"claude-sonnet-4.5-haiku"

// Fast Text Generation
"gpt-5-mini"

// Fast Code Generation
"grok-code-fast"
```

## Model Selection Logic

```typescript
// Creative Writing
if (complexity === "high") → "claude-3-opus-20240229"
else → "gpt-5"

// Code Generation
if (speed === "fast") → "grok-code-fast"
else → "claude-4.5-sonnet" ✨

// Reasoning
→ "gpt-5"

// Research/Analysis
if (contextLength > 100000) → "gemini-2.5-pro" ✨ (2M context!)
else → "gpt-5"

// Budget Constraint
if (budget === "low") → "gpt-5-mini"
```

## Environment Setup

```bash
# Required for new models
export XAI_API_KEY="your-xai-key"          # For grok-code-fast
export OPENAI_API_KEY="your-openai-key"    # For gpt-5, gpt-5-mini
export ANTHROPIC_API_KEY="your-claude-key" # For claude-sonnet-4.5-haiku

# Override defaults
export DEFAULT_MODEL="claude-sonnet-4.5-haiku"
```

## All Available Models

### OpenAI
- `gpt-5` (256K context) - **NEW**
- `gpt-5-mini` (128K context) - **NEW**
- `gpt-4-turbo-preview` (128K context)
- `gpt-4` (8K context)
- `gpt-3.5-turbo` (16K context)
- `o1-preview` (128K context)
- `o1-mini` (128K context)

### Anthropic
- **`claude-4.5-sonnet` (200K context) - NEW ✨ Quality Code**
- `claude-sonnet-4.5-haiku` (200K context) - **NEW**
- `claude-3-opus-20240229` (200K context)
- `claude-3-sonnet-20240229` (200K context)
- `claude-3-haiku-20240307` (200K context)

### xAI - **NEW PROVIDER**
- `grok-code-fast` (131K context)

### Google
- **`gemini-2.5-pro` (2M context) - NEW ✨ Large Docs**
- `gemini-pro` (32K context)
- `gemini-pro-vision` (16K context)

## Files Changed

✅ `src/services/sampling-service.ts` - Model registry + xAI provider  
✅ `src/tools/model-tools.ts` - Selection logic  
✅ `src/tools/agent-tools.ts` - 5 instances updated  
✅ `src/tools/workflow-tools.ts` - 2 instances updated  
✅ `src/index.ts` - Logger output  

## Build Status

```
npm run build
✅ Success - 0 errors
```
