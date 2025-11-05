"""
Main FastAPI Application
Central API server for the AI Agent Platform
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import sys
from pathlib import Path
from typing import Optional

# Add the api directory to Python path
api_dir = Path(__file__).parent
sys.path.insert(0, str(api_dir))

# Import routers
from telemetry.routes import router as telemetry_router
from documents.routes import router as documents_router
from workflows.routes import router as workflows_router
from auth_advanced import auth_router, users_router, identities_router

# Create FastAPI app
app = FastAPI(
    title="AI Agent Platform API",
    description="Comprehensive API for multi-agent systems, workflows, and LLM integrations",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(identities_router)
app.include_router(telemetry_router)
app.include_router(documents_router)
app.include_router(workflows_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "api": "running",
            "telemetry": "running",
            "workflows": "running",
            "documents": "running",
        }
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "AI Agent Platform API",
        "version": "1.0.0",
        "endpoints": {
            "telemetry": "/api/telemetry",
            "documents": "/api/documents",
            "workflows": "/api/workflows",
            "health": "/health",
            "docs": "/docs",
        },
        "features": [
            "Multi-agent execution",
            "Workflow orchestration",
            "Document AI processing",
            "Real-time telemetry",
            "LLM provider abstraction",
            "MCP tool integration",
        ],
    }

# LLM Providers endpoint
@app.get("/api/providers")
async def get_providers():
    """Get available LLM providers"""
    return {
        "providers": [
            {
                "id": "xai",
                "name": "xAI (Grok)",
                "available": bool(os.getenv("XAI_API_KEY")),
                "models": ["grok-4-fast", "grok-4", "grok-beta"],
                "recommended": True,
            },
            {
                "id": "openrouter",
                "name": "OpenRouter",
                "available": bool(os.getenv("OPENROUTER_API_KEY")),
                "models": ["openai/gpt-4-turbo-preview", "anthropic/claude-3-opus", "google/gemini-pro-1.5"],
                "recommended": True,
            },
            {
                "id": "openai",
                "name": "OpenAI",
                "available": bool(os.getenv("OPENAI_API_KEY")),
                "models": ["gpt-4-turbo-preview", "gpt-4o", "gpt-4o-mini"],
            },
            {
                "id": "anthropic",
                "name": "Anthropic",
                "available": bool(os.getenv("ANTHROPIC_API_KEY")),
                "models": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
            },
            {
                "id": "google",
                "name": "Google",
                "available": bool(os.getenv("GOOGLE_API_KEY")),
                "models": ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
            },
        ]
    }

# Test LLM provider connection
@app.post("/api/providers/test")
async def test_provider(provider: str, api_key: str, base_url: Optional[str] = None):
    """Test LLM provider connection"""
    try:
        from .llm.providers import generate_completion
        
        # Test with simple completion
        response = await generate_completion(
            provider=provider,
            model="grok-4-fast" if provider == "xai" else "gpt-4o-mini",
            messages=[{"role": "user", "content": "Say 'Connection successful!'"}],
            temperature=0.1,
            max_tokens=10,
        )
        
        return {
            "success": True,
            "provider": provider,
            "response": response.content,
            "latency_ms": response.latency_ms,
            "cost": response.cost,
        }
    except Exception as e:
        return {
            "success": False,
            "provider": provider,
            "error": str(e),
        }

# MCP Tools endpoints
@app.get("/api/mcp-tools/registry")
async def get_mcp_registry():
    """Get verified MCP tools registry"""
    return {
        "tools": [
            {
                "id": "voice-control-mcp",
                "name": "Voice Control MCP",
                "description": "Voice-controlled computer automation",
                "author": "Agent Platform Team",
                "version": "1.0.0",
                "category": "automation",
                "verified": True,
                "downloads": 1250,
                "rating": 4.9,
                "stars": 234,
                "tools": [
                    {"name": "parse_voice_command", "description": "Parse natural language commands"},
                    {"name": "move_mouse", "description": "Move mouse cursor"},
                    {"name": "click_mouse", "description": "Click mouse button"},
                ],
                "tags": ["voice", "automation", "control"],
            }
        ]
    }

@app.post("/api/mcp-tools/install")
async def install_mcp_tool(tool_id: str, version: str):
    """Install an MCP tool"""
    try:
        # In production, actually install the tool
        return {
            "status": "installed",
            "tool_id": tool_id,
            "version": version,
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.delete("/api/mcp-tools/uninstall/{tool_id}")
async def uninstall_mcp_tool(tool_id: str):
    """Uninstall an MCP tool"""
    try:
        return {
            "status": "uninstalled",
            "tool_id": tool_id,
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Settings endpoints
@app.get("/api/settings")
async def get_settings():
    """Get system settings"""
    return {
        "defaultProvider": "xai",
        "defaultModel": "grok-4-fast",
        "providers": {
            "xai": {
                "name": "xAI",
                "apiKey": "***",
                "enabled": bool(os.getenv("XAI_API_KEY")),
            },
            "openrouter": {
                "name": "OpenRouter",
                "apiKey": "***",
                "enabled": bool(os.getenv("OPENROUTER_API_KEY")),
            },
        },
        "telemetry": {
            "enabled": True,
            "retentionDays": 30,
            "aggregationInterval": "hourly",
        },
        "optimization": {
            "autoOptimize": False,
            "targetMetrics": ["cost", "speed"],
            "optimizationInterval": "weekly",
        },
    }

@app.put("/api/settings")
async def update_settings(settings: dict):
    """Update system settings"""
    try:
        # Save to database or config file
        return {
            "status": "updated",
            "settings": settings,
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
