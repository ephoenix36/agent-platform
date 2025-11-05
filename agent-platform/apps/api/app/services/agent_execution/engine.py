"""
Agent Execution Engine

Main engine that routes agent executions to the appropriate protocol adapter
and manages the execution lifecycle.
"""

import uuid
from typing import Dict, Any, AsyncIterator, Optional
from datetime import datetime
import logging

from .adapters import (
    AgentAdapter,
    ExecutionEvent,
    ExecutionEventType,
    ExecutionStatus,
    MCPAdapter,
    CrewAIAdapter,
    LangChainAdapter
)

logger = logging.getLogger(__name__)


class ExecutionEngine:
    """
    Main execution engine with protocol routing
    
    Handles:
    - Protocol detection and adapter routing
    - Execution lifecycle management
    - Event streaming coordination
    - Error handling and recovery
    """
    
    def __init__(self):
        self.adapters: Dict[str, AgentAdapter] = {
            "mcp": MCPAdapter(),
            "crewai": CrewAIAdapter(),
            "langchain": LangChainAdapter(),
            "langgraph": LangChainAdapter(),  # LangGraph uses LangChain adapter
            # Future adapters:
            # "agent_protocol": AgentProtocolAdapter(),
            # "autogen": AutoGenAdapter(),
            # "custom": CustomFormatAdapter()
        }
        self.active_executions: Dict[str, Dict[str, Any]] = {}
    
    async def execute_agent(
        self,
        agent_id: str,
        agent_config: Dict[str, Any],
        input_data: Dict[str, Any],
        protocol: Optional[str] = None,
        execution_id: Optional[str] = None
    ) -> AsyncIterator[ExecutionEvent]:
        """
        Execute agent and stream events
        
        Args:
            agent_id: Unique agent identifier
            agent_config: Agent configuration (from multi-format parser)
            input_data: Input data for agent
            protocol: Protocol to use (auto-detected if None)
            execution_id: Execution ID (generated if None)
            
        Yields:
            ExecutionEvent: Stream of execution events
        """
        # Generate execution ID if not provided
        if execution_id is None:
            execution_id = f"exec-{uuid.uuid4().hex[:12]}"
        
        # Detect protocol if not specified
        if protocol is None:
            protocol = agent_config.get("protocol", "mcp")
        
        # Get appropriate adapter
        adapter = self.adapters.get(protocol)
        if not adapter:
            # Emit error event
            yield ExecutionEvent(
                type=ExecutionEventType.ERROR,
                data={
                    "error": f"Unknown protocol: {protocol}",
                    "available_protocols": list(self.adapters.keys())
                },
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            return
        
        # Track execution
        self.active_executions[execution_id] = {
            "agent_id": agent_id,
            "protocol": protocol,
            "started_at": datetime.now(),
            "status": ExecutionStatus.PENDING
        }
        
        logger.info(f"Starting execution {execution_id} for agent {agent_id} using {protocol}")
        
        try:
            # Emit metadata event
            yield ExecutionEvent(
                type=ExecutionEventType.METADATA,
                data={
                    "execution_id": execution_id,
                    "agent_id": agent_id,
                    "protocol": protocol,
                    "adapter_features": adapter.get_supported_features(),
                    "started_at": datetime.now().isoformat()
                },
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Execute through adapter and stream events
            async for event in adapter.execute(agent_config, input_data, execution_id):
                # Update execution status
                if event.type == ExecutionEventType.STATUS:
                    self.active_executions[execution_id]["status"] = event.data.get("status")
                
                # Yield event to caller
                yield event
            
            # Mark as completed
            self.active_executions[execution_id]["completed_at"] = datetime.now()
            logger.info(f"Execution {execution_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Execution {execution_id} failed: {str(e)}", exc_info=True)
            
            # Emit error event
            yield ExecutionEvent(
                type=ExecutionEventType.ERROR,
                data={
                    "error": str(e),
                    "type": type(e).__name__
                },
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Update status
            self.active_executions[execution_id]["status"] = ExecutionStatus.FAILED
            self.active_executions[execution_id]["error"] = str(e)
            
        finally:
            # Cleanup after some time (could be moved to background task)
            # For now, keep execution record for debugging
            pass
    
    async def cancel_execution(self, execution_id: str) -> bool:
        """
        Cancel a running execution
        
        Args:
            execution_id: Execution to cancel
            
        Returns:
            True if cancelled successfully
        """
        execution = self.active_executions.get(execution_id)
        if not execution:
            return False
        
        protocol = execution["protocol"]
        adapter = self.adapters.get(protocol)
        
        if adapter:
            success = await adapter.cancel(execution_id)
            if success:
                self.active_executions[execution_id]["status"] = ExecutionStatus.CANCELLED
                self.active_executions[execution_id]["cancelled_at"] = datetime.now()
                logger.info(f"Execution {execution_id} cancelled")
            return success
        
        return False
    
    def get_execution_status(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get current execution status"""
        return self.active_executions.get(execution_id)
    
    def list_active_executions(self) -> Dict[str, Dict[str, Any]]:
        """List all active executions"""
        return {
            exec_id: info
            for exec_id, info in self.active_executions.items()
            if info.get("status") in [ExecutionStatus.PENDING, ExecutionStatus.RUNNING]
        }
    
    def get_supported_protocols(self) -> list[str]:
        """Get list of supported protocols"""
        return list(self.adapters.keys())
    
    def register_adapter(self, protocol: str, adapter: AgentAdapter) -> None:
        """
        Register a new protocol adapter
        
        Args:
            protocol: Protocol identifier
            adapter: Adapter instance
        """
        self.adapters[protocol] = adapter
        logger.info(f"Registered adapter for protocol: {protocol}")


# Global singleton instance
_execution_engine: Optional[ExecutionEngine] = None


def get_execution_engine() -> ExecutionEngine:
    """Get or create execution engine singleton"""
    global _execution_engine
    if _execution_engine is None:
        _execution_engine = ExecutionEngine()
    return _execution_engine
