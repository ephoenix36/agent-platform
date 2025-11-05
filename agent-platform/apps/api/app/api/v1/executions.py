"""
Agent execution API endpoints
"""

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Dict, Any, Optional
from pydantic import BaseModel
import json
import logging

from app.services.agent_execution import (
    get_execution_engine,
    ExecutionEventType
)
from app.services.parsers.multi_format_parser import MultiFormatParser

logger = logging.getLogger(__name__)
router = APIRouter()


class ExecutionCreate(BaseModel):
    """Schema for creating an execution"""
    agent_id: str
    agent_config: Optional[Dict[str, Any]] = None  # If not provided, load from DB
    input_data: Dict[str, Any]
    protocol: Optional[str] = None  # Auto-detect if None
    stream: bool = True


class ExecutionResponse(BaseModel):
    """Schema for execution response"""
    execution_id: str
    agent_id: str
    status: str  # pending, running, completed, failed
    result: Optional[Dict[str, Any]] = None


@router.post("/", response_model=ExecutionResponse, status_code=status.HTTP_201_CREATED)
async def create_execution(execution: ExecutionCreate):
    """Create a new agent execution"""
    engine = get_execution_engine()
    
    # For now, use provided agent_config
    # In production, this would load from database
    agent_config = execution.agent_config
    if not agent_config:
        raise HTTPException(
            status_code=400,
            detail="agent_config required (database integration pending)"
        )
    
    # Parse agent config if it's a string
    if isinstance(agent_config, str):
        parser = MultiFormatParser()
        parsed_agent = parser.parse(agent_config)
        agent_config = parsed_agent.model_dump()
    
    # Start execution (fire and forget for non-streaming)
    execution_id = None
    async for event in engine.execute_agent(
        agent_id=execution.agent_id,
        agent_config=agent_config,
        input_data=execution.input_data,
        protocol=execution.protocol
    ):
        if event.type == ExecutionEventType.METADATA:
            execution_id = event.execution_id
            break
    
    return ExecutionResponse(
        execution_id=execution_id or "unknown",
        agent_id=execution.agent_id,
        status="running",
        result=None
    )


@router.get("/{execution_id}")
async def get_execution(execution_id: str):
    """Get execution status and results"""
    engine = get_execution_engine()
    execution = engine.get_execution_status(execution_id)
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    return execution


@router.post("/execute")
async def execute_agent_streaming(execution: ExecutionCreate):
    """Execute agent and stream events in real-time"""
    
    async def event_generator():
        """Generate SSE events from execution"""
        try:
            engine = get_execution_engine()
            
            # Parse agent config if needed
            agent_config = execution.agent_config
            if not agent_config:
                # Return error if no config provided
                error_data = {
                    "type": "error",
                    "data": {"error": "agent_config required"},
                    "timestamp": None,
                    "execution_id": None
                }
                yield f"event: error\ndata: {json.dumps(error_data)}\n\n"
                return
            
            if isinstance(agent_config, str):
                parser = MultiFormatParser()
                parsed_agent = parser.parse(agent_config)
                agent_config = parsed_agent.model_dump()
            
            # Execute and stream events
            async for event in engine.execute_agent(
                agent_id=execution.agent_id,
                agent_config=agent_config,
                input_data=execution.input_data,
                protocol=execution.protocol
            ):
                # Convert event to SSE format
                event_data = {
                    "type": event.type.value,
                    "data": event.data,
                    "timestamp": event.timestamp,
                    "execution_id": event.execution_id
                }
                
                yield f"event: {event.type.value}\ndata: {json.dumps(event_data)}\n\n"
                
        except Exception as e:
            logger.error(f"Streaming error: {str(e)}", exc_info=True)
            error_data = {
                "type": "error",
                "data": {"error": str(e)},
                "timestamp": None,
                "execution_id": None
            }
            yield f"event: error\ndata: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.delete("/{execution_id}/cancel", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_execution(execution_id: str):
    """Cancel a running execution"""
    engine = get_execution_engine()
    success = await engine.cancel_execution(execution_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Execution not found or already completed")
    
    return None


@router.get("/active/list")
async def list_active_executions():
    """List all currently active executions"""
    engine = get_execution_engine()
    return engine.list_active_executions()
