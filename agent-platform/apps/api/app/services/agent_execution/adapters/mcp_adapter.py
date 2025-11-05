"""
MCP (Model Context Protocol) Adapter

Implements execution of MCP-based agents with streaming support.
"""

import asyncio
import json
from typing import Dict, Any, AsyncIterator, Optional
from datetime import datetime

from .base_adapter import (
    AgentAdapter,
    ExecutionEvent,
    ExecutionEventType,
    ExecutionStatus
)


class MCPAdapter(AgentAdapter):
    """Adapter for Model Context Protocol agents"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.active_executions: Dict[str, bool] = {}
    
    async def validate_config(self, agent_config: Dict[str, Any]) -> bool:
        """Validate MCP agent configuration"""
        required_fields = ["name", "instructions"]
        
        for field in required_fields:
            if field not in agent_config:
                raise ValueError(f"Missing required field: {field}")
        
        # Validate tools if present
        if "tools" in agent_config:
            if not isinstance(agent_config["tools"], list):
                raise ValueError("Tools must be a list")
        
        return True
    
    async def execute(
        self,
        agent_config: Dict[str, Any],
        input_data: Dict[str, Any],
        execution_id: str
    ) -> AsyncIterator[ExecutionEvent]:
        """Execute MCP agent with streaming"""
        
        # Mark execution as active
        self.active_executions[execution_id] = True
        
        try:
            # Validate configuration
            await self.validate_config(agent_config)
            await self.on_start(execution_id)
            
            # Emit initializing status
            yield ExecutionEvent(
                type=ExecutionEventType.STATUS,
                data={"status": ExecutionStatus.INITIALIZING},
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Emit log message
            yield ExecutionEvent(
                type=ExecutionEventType.LOG,
                data={"message": f"Initializing MCP agent: {agent_config['name']}"},
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Emit running status
            yield ExecutionEvent(
                type=ExecutionEventType.STATUS,
                data={"status": ExecutionStatus.RUNNING},
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Process instructions
            instructions = agent_config.get("instructions", "")
            user_query = input_data.get("query", input_data.get("input", ""))
            
            yield ExecutionEvent(
                type=ExecutionEventType.THINKING,
                data={
                    "message": f"Processing query: {user_query}",
                    "instructions": instructions
                },
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Simulate MCP tool execution
            tools = agent_config.get("tools", [])
            for i, tool in enumerate(tools):
                if not self.active_executions.get(execution_id, False):
                    break
                
                tool_name = tool.get("name", f"tool_{i}")
                
                yield ExecutionEvent(
                    type=ExecutionEventType.TOOL_CALL,
                    data={
                        "tool": tool_name,
                        "parameters": {"query": user_query}
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
                
                # Simulate processing time
                await asyncio.sleep(0.5)
                
                yield ExecutionEvent(
                    type=ExecutionEventType.TOOL_RESULT,
                    data={
                        "tool": tool_name,
                        "result": f"Result from {tool_name}",
                        "success": True
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
            
            # Generate UI component if enabled
            if agent_config.get("ui_components"):
                yield ExecutionEvent(
                    type=ExecutionEventType.UI_COMPONENT,
                    data={
                        "id": f"card-{execution_id}",
                        "type": "card",
                        "props": {
                            "title": "Agent Results",
                            "content": f"Processed: {user_query}",
                            "status": "success"
                        }
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
            
            # Generate final result
            result = {
                "summary": f"Successfully processed query using {len(tools)} tools",
                "query": user_query,
                "agent": agent_config["name"],
                "tools_used": [t.get("name", f"tool_{i}") for i, t in enumerate(tools)],
                "timestamp": datetime.now().isoformat()
            }
            
            yield ExecutionEvent(
                type=ExecutionEventType.RESULT,
                data=result,
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Emit completion status
            yield ExecutionEvent(
                type=ExecutionEventType.STATUS,
                data={"status": ExecutionStatus.COMPLETED},
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            await self.on_complete(execution_id)
            
        except Exception as e:
            await self.on_error(execution_id, e)
            
            yield ExecutionEvent(
                type=ExecutionEventType.ERROR,
                data={
                    "error": str(e),
                    "type": type(e).__name__
                },
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            yield ExecutionEvent(
                type=ExecutionEventType.STATUS,
                data={"status": ExecutionStatus.FAILED},
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
        finally:
            # Clean up
            self.active_executions.pop(execution_id, None)
    
    async def cancel(self, execution_id: str) -> bool:
        """Cancel MCP execution"""
        if execution_id in self.active_executions:
            self.active_executions[execution_id] = False
            return True
        return False
    
    def get_supported_features(self) -> Dict[str, bool]:
        """Get MCP adapter features"""
        return {
            "streaming": True,
            "tool_calling": True,
            "ui_generation": True,
            "cancellation": True,
            "parallel_execution": False,
        }


# For future: Real MCP implementation would look like:
"""
from mcp import Client, StdioServerParameters
from mcp.client.stdio import stdio_client

async def connect_to_mcp_server(server_path: str):
    server_params = StdioServerParameters(
        command=server_path,
        args=[],
        env=None
    )
    
    async with stdio_client(server_params) as (read, write):
        async with Client(read, write) as client:
            # Initialize connection
            await client.initialize()
            
            # List available tools
            tools = await client.list_tools()
            
            # Call tool
            result = await client.call_tool("tool_name", arguments={})
            
            return result
"""
