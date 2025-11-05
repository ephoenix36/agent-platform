"""
Telemetry System for Agent and Workflow Monitoring
Collects, stores, and analyzes performance metrics
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from enum import Enum

class MetricType(str, Enum):
    """Types of metrics collected"""
    EXECUTION_TIME = "execution_time"
    TOKEN_USAGE = "token_usage"
    COST = "cost"
    SUCCESS_RATE = "success_rate"
    ERROR_RATE = "error_rate"
    QUALITY_SCORE = "quality_score"
    LATENCY = "latency"
    THROUGHPUT = "throughput"

class EventType(str, Enum):
    """Types of telemetry events"""
    AGENT_START = "agent_start"
    AGENT_COMPLETE = "agent_complete"
    AGENT_ERROR = "agent_error"
    WORKFLOW_START = "workflow_start"
    WORKFLOW_COMPLETE = "workflow_complete"
    WORKFLOW_ERROR = "workflow_error"
    LLM_REQUEST = "llm_request"
    LLM_RESPONSE = "llm_response"
    TOOL_EXECUTION = "tool_execution"
    OPTIMIZATION_START = "optimization_start"
    OPTIMIZATION_COMPLETE = "optimization_complete"

class AgentTelemetryEvent(BaseModel):
    """Individual telemetry event for agent execution"""
    event_id: str = Field(default_factory=lambda: f"evt_{datetime.utcnow().timestamp()}")
    agent_id: str
    event_type: EventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Execution details
    execution_time_ms: Optional[float] = None
    success: bool = True
    error_message: Optional[str] = None
    
    # LLM details
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    
    # Token usage
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    
    # Cost tracking
    input_cost: Optional[float] = None
    output_cost: Optional[float] = None
    total_cost: Optional[float] = None
    
    # Quality metrics
    quality_score: Optional[float] = None
    confidence: Optional[float] = None
    
    # Context
    workflow_id: Optional[str] = None
    parent_event_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class WorkflowTelemetryEvent(BaseModel):
    """Telemetry event for workflow execution"""
    event_id: str = Field(default_factory=lambda: f"wf_evt_{datetime.utcnow().timestamp()}")
    workflow_id: str
    event_type: EventType
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Execution details
    total_execution_time_ms: Optional[float] = None
    node_count: int = 0
    completed_nodes: int = 0
    failed_nodes: int = 0
    
    # Aggregate costs
    total_cost: float = 0.0
    total_tokens: int = 0
    
    # Node execution details
    node_events: List[str] = Field(default_factory=list)
    
    # Status
    status: str = "running"  # running, completed, failed, cancelled
    error_message: Optional[str] = None
    
    # Context
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AggregatedMetrics(BaseModel):
    """Aggregated metrics over a time period"""
    agent_id: Optional[str] = None
    workflow_id: Optional[str] = None
    start_time: datetime
    end_time: datetime
    
    # Execution metrics
    total_executions: int = 0
    successful_executions: int = 0
    failed_executions: int = 0
    success_rate: float = 0.0
    
    # Performance metrics
    avg_execution_time_ms: float = 0.0
    p50_execution_time_ms: float = 0.0
    p95_execution_time_ms: float = 0.0
    p99_execution_time_ms: float = 0.0
    
    # Cost metrics
    total_cost: float = 0.0
    avg_cost_per_execution: float = 0.0
    total_tokens: int = 0
    avg_tokens_per_execution: int = 0
    
    # Quality metrics
    avg_quality_score: Optional[float] = None
    avg_confidence: Optional[float] = None
    
    # Provider distribution
    provider_usage: Dict[str, int] = Field(default_factory=dict)
    model_usage: Dict[str, int] = Field(default_factory=dict)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class TelemetryCollector:
    """Collects and stores telemetry events"""
    
    def __init__(self, storage_backend: str = "mongodb"):
        self.storage_backend = storage_backend
        self.buffer: List[AgentTelemetryEvent | WorkflowTelemetryEvent] = []
        self.buffer_size = 100
        
    async def record_agent_event(self, event: AgentTelemetryEvent) -> str:
        """Record an agent telemetry event"""
        self.buffer.append(event)
        
        if len(self.buffer) >= self.buffer_size:
            await self.flush()
            
        return event.event_id
    
    async def record_workflow_event(self, event: WorkflowTelemetryEvent) -> str:
        """Record a workflow telemetry event"""
        self.buffer.append(event)
        
        if len(self.buffer) >= self.buffer_size:
            await self.flush()
            
        return event.event_id
    
    async def flush(self):
        """Flush buffered events to storage"""
        if not self.buffer:
            return
            
        # Store in database (MongoDB, PostgreSQL, etc.)
        # This would connect to the actual storage backend
        print(f"Flushing {len(self.buffer)} events to {self.storage_backend}")
        
        # Clear buffer
        self.buffer = []
    
    async def get_agent_metrics(
        self,
        agent_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> AggregatedMetrics:
        """Get aggregated metrics for an agent"""
        # Query storage backend and aggregate
        # This is a placeholder implementation
        return AggregatedMetrics(
            agent_id=agent_id,
            start_time=start_time,
            end_time=end_time,
            total_executions=0,
            successful_executions=0,
            failed_executions=0,
            success_rate=0.0,
            avg_execution_time_ms=0.0,
            p50_execution_time_ms=0.0,
            p95_execution_time_ms=0.0,
            p99_execution_time_ms=0.0,
            total_cost=0.0,
            avg_cost_per_execution=0.0,
            total_tokens=0,
            avg_tokens_per_execution=0,
        )
    
    async def get_workflow_metrics(
        self,
        workflow_id: str,
        start_time: datetime,
        end_time: datetime
    ) -> AggregatedMetrics:
        """Get aggregated metrics for a workflow"""
        # Query storage backend and aggregate
        return AggregatedMetrics(
            workflow_id=workflow_id,
            start_time=start_time,
            end_time=end_time,
            total_executions=0,
            successful_executions=0,
            failed_executions=0,
            success_rate=0.0,
            avg_execution_time_ms=0.0,
            p50_execution_time_ms=0.0,
            p95_execution_time_ms=0.0,
            p99_execution_time_ms=0.0,
            total_cost=0.0,
            avg_cost_per_execution=0.0,
            total_tokens=0,
            avg_tokens_per_execution=0,
        )

# Global telemetry collector instance
telemetry_collector = TelemetryCollector()

async def track_agent_execution(agent_id: str, **kwargs):
    """Decorator/context manager for tracking agent execution"""
    start_time = datetime.utcnow()
    
    try:
        # Record start event
        start_event = AgentTelemetryEvent(
            agent_id=agent_id,
            event_type=EventType.AGENT_START,
            **kwargs
        )
        await telemetry_collector.record_agent_event(start_event)
        
        yield start_event.event_id
        
        # Record completion event
        end_time = datetime.utcnow()
        execution_time = (end_time - start_time).total_seconds() * 1000
        
        complete_event = AgentTelemetryEvent(
            agent_id=agent_id,
            event_type=EventType.AGENT_COMPLETE,
            execution_time_ms=execution_time,
            success=True,
            parent_event_id=start_event.event_id,
            **kwargs
        )
        await telemetry_collector.record_agent_event(complete_event)
        
    except Exception as e:
        # Record error event
        end_time = datetime.utcnow()
        execution_time = (end_time - start_time).total_seconds() * 1000
        
        error_event = AgentTelemetryEvent(
            agent_id=agent_id,
            event_type=EventType.AGENT_ERROR,
            execution_time_ms=execution_time,
            success=False,
            error_message=str(e),
            parent_event_id=start_event.event_id,
            **kwargs
        )
        await telemetry_collector.record_agent_event(error_event)
        raise

async def track_llm_request(
    agent_id: str,
    provider: str,
    model: str,
    input_tokens: int,
    output_tokens: int,
    input_cost: float,
    output_cost: float,
    **kwargs
):
    """Track an LLM API request"""
    event = AgentTelemetryEvent(
        agent_id=agent_id,
        event_type=EventType.LLM_REQUEST,
        provider=provider,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=input_tokens + output_tokens,
        input_cost=input_cost,
        output_cost=output_cost,
        total_cost=input_cost + output_cost,
        **kwargs
    )
    return await telemetry_collector.record_agent_event(event)
