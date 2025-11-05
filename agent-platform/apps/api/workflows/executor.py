"""
Workflow Execution Engine
Executes multi-step workflows with agents, collects telemetry, handles errors
"""

import asyncio
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from enum import Enum
from datetime import datetime
import uuid

from telemetry.collector import (
    telemetry_collector,
    WorkflowTelemetryEvent,
    AgentTelemetryEvent,
    EventType
)

class NodeType(str, Enum):
    AGENT = "agent"
    CONDITION = "condition"
    LOOP = "loop"
    PARALLEL = "parallel"
    TRANSFORM = "transform"
    API_CALL = "api_call"
    LLM = "llm"

class NodeStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class WorkflowNode(BaseModel):
    id: str
    type: NodeType
    name: str
    config: Dict[str, Any]
    inputs: List[str] = []  # IDs of input nodes
    outputs: List[str] = []  # IDs of output nodes
    status: NodeStatus = NodeStatus.PENDING
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None

class Workflow(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[WorkflowNode]
    variables: Dict[str, Any] = {}
    status: str = "pending"
    created_at: datetime = datetime.utcnow()
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class WorkflowExecutionContext:
    """Context for workflow execution"""
    
    def __init__(self, workflow: Workflow):
        self.workflow = workflow
        self.node_results: Dict[str, Any] = {}
        self.execution_order: List[str] = []
        self.start_time = datetime.utcnow()
        
    def get_node_result(self, node_id: str) -> Any:
        """Get result from a previously executed node"""
        return self.node_results.get(node_id)
    
    def set_node_result(self, node_id: str, result: Any):
        """Store node execution result"""
        self.node_results[node_id] = result
        self.execution_order.append(node_id)

class WorkflowExecutor:
    """Executes workflows with telemetry collection"""
    
    def __init__(self):
        self.active_workflows: Dict[str, Workflow] = {}
    
    async def execute(self, workflow: Workflow) -> Dict[str, Any]:
        """Execute a workflow"""
        # Store active workflow
        self.active_workflows[workflow.id] = workflow
        
        # Record workflow start event
        start_event = WorkflowTelemetryEvent(
            workflow_id=workflow.id,
            event_type=EventType.WORKFLOW_START,
            node_count=len(workflow.nodes),
        )
        await telemetry_collector.record_workflow_event(start_event)
        
        # Update workflow status
        workflow.status = "running"
        workflow.started_at = datetime.utcnow()
        
        try:
            # Create execution context
            context = WorkflowExecutionContext(workflow)
            
            # Execute nodes in topological order
            execution_order = self._get_execution_order(workflow)
            
            for node_id in execution_order:
                node = next(n for n in workflow.nodes if n.id == node_id)
                
                # Execute node
                result = await self._execute_node(node, context)
                context.set_node_result(node_id, result)
                
                # Update node status
                node.status = NodeStatus.COMPLETED
                node.result = result
            
            # Record completion
            end_time = datetime.utcnow()
            execution_time = (end_time - context.start_time).total_seconds() * 1000
            
            complete_event = WorkflowTelemetryEvent(
                workflow_id=workflow.id,
                event_type=EventType.WORKFLOW_COMPLETE,
                total_execution_time_ms=execution_time,
                node_count=len(workflow.nodes),
                completed_nodes=len(execution_order),
                failed_nodes=0,
                status="completed",
            )
            await telemetry_collector.record_workflow_event(complete_event)
            
            workflow.status = "completed"
            workflow.completed_at = end_time
            
            return {
                "workflow_id": workflow.id,
                "status": "completed",
                "execution_time_ms": execution_time,
                "results": context.node_results,
                "execution_order": context.execution_order,
            }
            
        except Exception as e:
            # Record error
            error_event = WorkflowTelemetryEvent(
                workflow_id=workflow.id,
                event_type=EventType.WORKFLOW_ERROR,
                status="failed",
                error_message=str(e),
            )
            await telemetry_collector.record_workflow_event(error_event)
            
            workflow.status = "failed"
            workflow.completed_at = datetime.utcnow()
            
            raise
        finally:
            # Remove from active workflows
            self.active_workflows.pop(workflow.id, None)
    
    def _get_execution_order(self, workflow: Workflow) -> List[str]:
        """Get topological order for node execution"""
        # Simple topological sort
        visited = set()
        order = []
        
        def visit(node_id: str):
            if node_id in visited:
                return
            
            node = next((n for n in workflow.nodes if n.id == node_id), None)
            if not node:
                return
            
            # Visit dependencies first
            for input_id in node.inputs:
                visit(input_id)
            
            visited.add(node_id)
            order.append(node_id)
        
        # Visit all nodes
        for node in workflow.nodes:
            visit(node.id)
        
        return order
    
    async def _execute_node(self, node: WorkflowNode, context: WorkflowExecutionContext) -> Any:
        """Execute a single node"""
        node.status = NodeStatus.RUNNING
        start_time = datetime.utcnow()
        
        try:
            # Get inputs from previous nodes
            inputs = {}
            for input_id in node.inputs:
                inputs[input_id] = context.get_node_result(input_id)
            
            # Execute based on node type
            if node.type == NodeType.AGENT:
                result = await self._execute_agent_node(node, inputs, context)
            elif node.type == NodeType.LLM:
                result = await self._execute_llm_node(node, inputs, context)
            elif node.type == NodeType.TRANSFORM:
                result = await self._execute_transform_node(node, inputs, context)
            elif node.type == NodeType.API_CALL:
                result = await self._execute_api_node(node, inputs, context)
            elif node.type == NodeType.CONDITION:
                result = await self._execute_condition_node(node, inputs, context)
            elif node.type == NodeType.PARALLEL:
                result = await self._execute_parallel_node(node, inputs, context)
            else:
                raise ValueError(f"Unknown node type: {node.type}")
            
            # Calculate execution time
            end_time = datetime.utcnow()
            node.execution_time_ms = (end_time - start_time).total_seconds() * 1000
            
            return result
            
        except Exception as e:
            node.status = NodeStatus.FAILED
            node.error = str(e)
            raise
    
    async def _execute_agent_node(self, node: WorkflowNode, inputs: Dict, context: WorkflowExecutionContext) -> Any:
        """Execute an agent node"""
        from llm.providers import generate_completion
        
        # Get agent configuration
        agent_id = node.config.get("agent_id")
        prompt = node.config.get("prompt", "")
        
        # Replace variables in prompt
        for key, value in inputs.items():
            prompt = prompt.replace(f"{{{key}}}", str(value))
        
        # Record agent execution
        event_id = f"node_{node.id}_{datetime.utcnow().timestamp()}"
        
        agent_event = AgentTelemetryEvent(
            agent_id=agent_id or "workflow_agent",
            event_type=EventType.AGENT_START,
            workflow_id=context.workflow.id,
        )
        await telemetry_collector.record_agent_event(agent_event)
        
        # Execute using LLM
        provider = node.config.get("provider", "xai")
        model = node.config.get("model", "grok-4-fast")
        
        response = await generate_completion(
            provider=provider,
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=node.config.get("temperature", 0.7),
            max_tokens=node.config.get("max_tokens", 2000),
        )
        
        # Record completion
        complete_event = AgentTelemetryEvent(
            agent_id=agent_id or "workflow_agent",
            event_type=EventType.AGENT_COMPLETE,
            workflow_id=context.workflow.id,
            provider=provider,
            model=model,
            input_tokens=response.usage.get("prompt_tokens", 0),
            output_tokens=response.usage.get("completion_tokens", 0),
            total_cost=response.cost,
            execution_time_ms=response.latency_ms,
        )
        await telemetry_collector.record_agent_event(complete_event)
        
        return response.content
    
    async def _execute_llm_node(self, node: WorkflowNode, inputs: Dict, context: WorkflowExecutionContext) -> Any:
        """Execute an LLM node"""
        return await self._execute_agent_node(node, inputs, context)
    
    async def _execute_transform_node(self, node: WorkflowNode, inputs: Dict, context: WorkflowExecutionContext) -> Any:
        """Execute a transform node"""
        # Apply transformation function
        transform_func = node.config.get("function", "identity")
        
        if transform_func == "identity":
            return inputs
        elif transform_func == "json_parse":
            import json
            return json.loads(list(inputs.values())[0])
        elif transform_func == "json_stringify":
            import json
            return json.dumps(list(inputs.values())[0])
        else:
            return inputs
    
    async def _execute_api_node(self, node: WorkflowNode, inputs: Dict, context: WorkflowExecutionContext) -> Any:
        """Execute an API call node"""
        import aiohttp
        
        url = node.config.get("url", "")
        method = node.config.get("method", "GET")
        headers = node.config.get("headers", {})
        body = node.config.get("body", {})
        
        # Replace variables
        for key, value in inputs.items():
            url = url.replace(f"{{{key}}}", str(value))
            body = str(body).replace(f"{{{key}}}", str(value))
        
        async with aiohttp.ClientSession() as session:
            async with session.request(method, url, headers=headers, json=body) as response:
                return await response.json()
    
    async def _execute_condition_node(self, node: WorkflowNode, inputs: Dict, context: WorkflowExecutionContext) -> Any:
        """Execute a condition node"""
        condition = node.config.get("condition", "true")
        
        # Evaluate condition
        # In production, use safe expression evaluator
        result = eval(condition, {"inputs": inputs})
        
        return result
    
    async def _execute_parallel_node(self, node: WorkflowNode, inputs: Dict, context: WorkflowExecutionContext) -> Any:
        """Execute nodes in parallel"""
        parallel_nodes = node.config.get("nodes", [])
        
        # Execute in parallel
        tasks = [
            self._execute_node(n, context)
            for n in parallel_nodes
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return results

# Global workflow executor
workflow_executor = WorkflowExecutor()

async def execute_workflow(workflow: Workflow) -> Dict[str, Any]:
    """Execute a workflow"""
    return await workflow_executor.execute(workflow)
