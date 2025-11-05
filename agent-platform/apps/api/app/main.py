"""
AI Agent Platform API

FastAPI backend for the collaborative agent marketplace platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.api.v1 import agents, executions, security
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Agent Platform API",
    description="Backend API for building, sharing, and monetizing AI agents",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
app.include_router(executions.router, prefix="/api/v1/executions", tags=["executions"])
app.include_router(security.router, prefix="/api/v1/security", tags=["security"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Agent Platform API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting AI Agent Platform API...")
    # Initialize database connections
    # Initialize Redis
    # Initialize other services
    logger.info("API started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down API...")
    # Close database connections
    # Close Redis connections
    # Cleanup other resources
    logger.info("API shutdown complete")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
