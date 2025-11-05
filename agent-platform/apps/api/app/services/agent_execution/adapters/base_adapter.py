"""
Base adapter interface for agent execution

All protocol adapters must implement this interface to ensure
consistent behavior across different agent frameworks.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, AsyncIterator, Optional
from enum import Enum
from pydantic import BaseModel


class ExecutionEventType(str, Enum):
    """Types of execution events"""
    STATUS = "status"
    LOG = "log"
    ERROR = "error"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    UI_COMPONENT = "ui_component"
    THINKING = "thinking"
    RESULT = "result"
    METADATA = "metadata"


class ExecutionStatus(str, Enum):
    """Execution status states"""
    PENDING = "pending"
    INITIALIZING = "initializing"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ExecutionEvent(BaseModel):
    """Unified execution event structure"""
    type: ExecutionEventType
    data: Dict[str, Any]
    timestamp: Optional[float] = None
    execution_id: Optional[str] = None


class AgentAdapter(ABC):
    """Base adapter for different agent protocols"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
    
    @abstractmethod
    async def validate_config(self, agent_config: Dict[str, Any]) -> bool:
        """
        Validate agent configuration before execution
        
        Args:
            agent_config: Agent configuration to validate
            
        Returns:
            True if valid, False otherwise
            
        Raises:
            ValueError: If configuration is invalid
        """
        pass
    
    @abstractmethod
    async def execute(
        self,
        agent_config: Dict[str, Any],
        input_data: Dict[str, Any],
        execution_id: str
    ) -> AsyncIterator[ExecutionEvent]:
        """
        Execute agent and stream events
        
        Args:
            agent_config: Agent configuration including instructions, tools, etc.
            input_data: Input data for the agent
            execution_id: Unique execution ID for tracking
            
        Yields:
            ExecutionEvent: Stream of execution events
            
        Raises:
            Exception: If execution fails
        """
        pass
    
    @abstractmethod
    async def cancel(self, execution_id: str) -> bool:
        """
        Cancel a running execution
        
        Args:
            execution_id: ID of execution to cancel
            
        Returns:
            True if cancelled successfully
        """
        pass
    
    async def on_start(self, execution_id: str) -> None:
        """Hook called when execution starts"""
        pass
    
    async def on_complete(self, execution_id: str) -> None:
        """Hook called when execution completes"""
        pass
    
    async def on_error(self, execution_id: str, error: Exception) -> None:
        """Hook called when execution errors"""
        pass
    
    def get_supported_features(self) -> Dict[str, bool]:
        """
        Get features supported by this adapter
        
        Returns:
            Dictionary of feature flags
        """
        return {
            "streaming": True,
            "tool_calling": True,
            "ui_generation": False,
            "cancellation": True,
            "parallel_execution": False,
        }
