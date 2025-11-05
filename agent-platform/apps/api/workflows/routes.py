"""
Workflow API Routes
Create, execute, monitor, and manage workflows
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime

from .executor import (
    Workflow,
    WorkflowNode,
    NodeType,
    NodeStatus,
    execute_workflow,
    workflow_executor
)

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

@router.post("/create")
async def create_workflow(workflow: Workflow):
    """Create a new workflow"""
    try:
        # Validate workflow
        if not workflow.nodes:
            raise ValueError("Workflow must have at least one node")
        
        # Store in database
        # For now, just return the workflow
        return {
            "id": workflow.id,
            "name": workflow.name,
            "status": "created",
            "node_count": len(workflow.nodes),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{workflow_id}/execute")
async def execute_workflow_endpoint(workflow_id: str):
    """Execute a workflow"""
    try:
        # Fetch workflow from database
        # For now, create a sample workflow
        workflow = Workflow(
            id=workflow_id,
            name="Sample Workflow",
            description="A sample multi-step workflow",
            nodes=[
                WorkflowNode(
                    id="node1",
                    type=NodeType.LLM,
                    name="Generate Code",
                    config={
                        "provider": "xai",
                        "model": "grok-4-fast",
                        "prompt": "Write a Python function to calculate fibonacci numbers",
                        "temperature": 0.7,
                    },
                ),
                WorkflowNode(
                    id="node2",
                    type=NodeType.LLM,
                    name="Review Code",
                    config={
                        "provider": "xai",
                        "model": "grok-4-fast",
                        "prompt": "Review this code: {node1}",
                        "temperature": 0.3,
                    },
                    inputs=["node1"],
                ),
            ],
        )
        
        # Execute workflow
        result = await execute_workflow(workflow)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workflow_id}/status")
async def get_workflow_status(workflow_id: str):
    """Get workflow execution status"""
    try:
        # Check active workflows
        workflow = workflow_executor.active_workflows.get(workflow_id)
        
        if workflow:
            # Calculate progress
            completed = sum(1 for n in workflow.nodes if n.status == NodeStatus.COMPLETED)
            failed = sum(1 for n in workflow.nodes if n.status == NodeStatus.FAILED)
            total = len(workflow.nodes)
            progress = (completed / total * 100) if total > 0 else 0
            
            return {
                "id": workflow.id,
                "name": workflow.name,
                "status": workflow.status,
                "progress": progress,
                "nodes_completed": completed,
                "nodes_failed": failed,
                "nodes_total": total,
                "started_at": workflow.started_at.isoformat() if workflow.started_at else None,
            }
        else:
            # Fetch from database
            return {
                "id": workflow_id,
                "status": "not_found",
                "error": "Workflow not found or already completed",
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{workflow_id}/pause")
async def pause_workflow(workflow_id: str):
    """Pause workflow execution"""
    try:
        workflow = workflow_executor.active_workflows.get(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found or not running")
        
        workflow.status = "paused"
        
        return {"id": workflow_id, "status": "paused"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{workflow_id}/resume")
async def resume_workflow(workflow_id: str):
    """Resume paused workflow"""
    try:
        workflow = workflow_executor.active_workflows.get(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow.status = "running"
        
        return {"id": workflow_id, "status": "resumed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{workflow_id}/cancel")
async def cancel_workflow(workflow_id: str):
    """Cancel workflow execution"""
    try:
        workflow = workflow_executor.active_workflows.get(workflow_id)
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        workflow.status = "cancelled"
        workflow.completed_at = datetime.utcnow()
        
        # Remove from active workflows
        workflow_executor.active_workflows.pop(workflow_id, None)
        
        return {"id": workflow_id, "status": "cancelled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_workflows(
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """List workflows"""
    try:
        # Fetch from database
        # For now, return active workflows
        workflows = []
        
        for wf_id, wf in workflow_executor.active_workflows.items():
            if status is None or wf.status == status:
                workflows.append({
                    "id": wf.id,
                    "name": wf.name,
                    "status": wf.status,
                    "node_count": len(wf.nodes),
                    "created_at": wf.created_at.isoformat(),
                    "started_at": wf.started_at.isoformat() if wf.started_at else None,
                })
        
        return {
            "workflows": workflows[offset:offset+limit],
            "total": len(workflows),
            "limit": limit,
            "offset": offset,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get workflow details"""
    try:
        workflow = workflow_executor.active_workflows.get(workflow_id)
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        return {
            "id": workflow.id,
            "name": workflow.name,
            "description": workflow.description,
            "status": workflow.status,
            "nodes": [
                {
                    "id": node.id,
                    "type": node.type,
                    "name": node.name,
                    "status": node.status,
                    "execution_time_ms": node.execution_time_ms,
                    "error": node.error,
                }
                for node in workflow.nodes
            ],
            "created_at": workflow.created_at.isoformat(),
            "started_at": workflow.started_at.isoformat() if workflow.started_at else None,
            "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow"""
    try:
        # Cancel if running
        if workflow_id in workflow_executor.active_workflows:
            await cancel_workflow(workflow_id)
        
        # Delete from database
        
        return {"id": workflow_id, "status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{workflow_id}/clone")
async def clone_workflow(workflow_id: str, new_name: Optional[str] = None):
    """Clone an existing workflow"""
    try:
        # Fetch original workflow
        original = workflow_executor.active_workflows.get(workflow_id)
        
        if not original:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Create clone
        import uuid
        cloned = Workflow(
            id=str(uuid.uuid4()),
            name=new_name or f"{original.name} (Copy)",
            description=original.description,
            nodes=[node.copy() for node in original.nodes],
            variables=original.variables.copy(),
        )
        
        return {
            "id": cloned.id,
            "name": cloned.name,
            "status": "created",
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
