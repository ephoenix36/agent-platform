"""
MCP (Model Context Protocol) Adapter
Complete implementation of the universal standard for AI tools and connectors
"""

from typing import Dict, List, Optional, AsyncIterator, Any
from pydantic import BaseModel, Field
from enum import Enum
import httpx
import json
import asyncio
from datetime import datetime

class MCPAuthType(str, Enum):
    NONE = "none"
    API_KEY = "api_key"
    OAUTH2 = "oauth2"
    BASIC = "basic"

class MCPAuthConfig(BaseModel):
    """Authentication configuration for MCP server"""
    type: MCPAuthType
    api_key: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    token: Optional[str] = None
    
class MCPTool(BaseModel):
    """MCP Tool definition"""
    name: str
    description: str
    parameters: Dict[str, Any]
    server_label: str
    requires_approval: bool = False
    
class MCPToolCall(BaseModel):
    """MCP Tool call execution"""
    id: str
    tool_name: str
    arguments: Dict[str, Any]
    server_label: str
    
class MCPToolResult(BaseModel):
    """Result from MCP tool execution"""
    id: str
    tool_name: str
    output: Any
    error: Optional[str] = None
    approval_request_id: Optional[str] = None
    
class MCPApprovalRequest(BaseModel):
    """Request for user approval before executing tool"""
    id: str
    tool_name: str
    arguments: Dict[str, Any]
    server_label: str
    timestamp: datetime = Field(default_factory=datetime.now)
    
class MCPConnection(BaseModel):
    """Active MCP server connection"""
    server_url: str
    server_label: str
    auth: MCPAuthConfig
    tools: List[MCPTool] = []
    connected: bool = False
    last_heartbeat: Optional[datetime] = None

class MCPEvent(BaseModel):
    """MCP streaming event"""
    type: str  # 'arguments.delta', 'arguments.done', 'call.completed', 'call.failed'
    event_id: str
    item_id: str
    output_index: int
    data: Any

class MCPAdapter:
    """
    Complete MCP (Model Context Protocol) implementation
    
    Supports:
    - Remote and local MCP servers
    - Tool discovery and registration
    - Approval workflows
    - Streaming execution
    - Multiple authentication methods
    """
    
    def __init__(self):
        self.connections: Dict[str, MCPConnection] = {}
        self.pending_approvals: Dict[str, MCPApprovalRequest] = {}
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
    async def connect_server(
        self,
        server_url: str,
        server_label: str,
        auth: MCPAuthConfig
    ) -> MCPConnection:
        """
        Connect to an MCP server
        
        Args:
            server_url: URL of the MCP server
            server_label: Label to identify this server
            auth: Authentication configuration
            
        Returns:
            MCPConnection with available tools
        """
        # Create connection
        connection = MCPConnection(
            server_url=server_url,
            server_label=server_label,
            auth=auth
        )
        
        # Build headers
        headers = self._build_auth_headers(auth)
        
        try:
            # Connect to server
            response = await self.http_client.get(
                f"{server_url}/health",
                headers=headers
            )
            response.raise_for_status()
            
            # List available tools
            tools_response = await self.http_client.get(
                f"{server_url}/tools",
                headers=headers
            )
            tools_response.raise_for_status()
            
            # Parse tools
            tools_data = tools_response.json()
            connection.tools = [
                MCPTool(**tool) for tool in tools_data.get('tools', [])
            ]
            
            connection.connected = True
            connection.last_heartbeat = datetime.now()
            
            # Store connection
            self.connections[server_label] = connection
            
            return connection
            
        except Exception as e:
            raise Exception(f"Failed to connect to MCP server: {str(e)}")
    
    async def disconnect_server(self, server_label: str) -> None:
        """Disconnect from MCP server"""
        if server_label in self.connections:
            self.connections[server_label].connected = False
            del self.connections[server_label]
    
    async def list_tools(
        self,
        server_label: Optional[str] = None
    ) -> List[MCPTool]:
        """
        List available tools from MCP servers
        
        Args:
            server_label: Optional filter by server
            
        Returns:
            List of available MCP tools
        """
        tools = []
        
        if server_label:
            # List tools from specific server
            if server_label in self.connections:
                tools = self.connections[server_label].tools
        else:
            # List all tools from all servers
            for connection in self.connections.values():
                if connection.connected:
                    tools.extend(connection.tools)
        
        return tools
    
    async def execute_tool(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        server_label: Optional[str] = None,
        require_approval: bool = False
    ) -> MCPToolResult:
        """
        Execute an MCP tool
        
        Args:
            tool_name: Name of the tool to execute
            arguments: Arguments to pass to the tool
            server_label: Optional server to execute on
            require_approval: Whether to require user approval
            
        Returns:
            MCPToolResult with output or error
        """
        # Find the tool
        tool = None
        connection = None
        
        if server_label:
            if server_label in self.connections:
                connection = self.connections[server_label]
                tool = next((t for t in connection.tools if t.name == tool_name), None)
        else:
            # Search all connections
            for conn in self.connections.values():
                if conn.connected:
                    tool = next((t for t in conn.tools if t.name == tool_name), None)
                    if tool:
                        connection = conn
                        break
        
        if not tool or not connection:
            return MCPToolResult(
                id=f"mcp_{datetime.now().timestamp()}",
                tool_name=tool_name,
                output=None,
                error=f"Tool '{tool_name}' not found"
            )
        
        # Check if approval is required
        if require_approval or tool.requires_approval:
            # Create approval request
            approval_request = MCPApprovalRequest(
                id=f"mcpr_{datetime.now().timestamp()}",
                tool_name=tool_name,
                arguments=arguments,
                server_label=connection.server_label
            )
            
            self.pending_approvals[approval_request.id] = approval_request
            
            # Return result with approval request ID
            return MCPToolResult(
                id=f"mcp_{datetime.now().timestamp()}",
                tool_name=tool_name,
                output=None,
                approval_request_id=approval_request.id
            )
        
        # Execute the tool
        try:
            headers = self._build_auth_headers(connection.auth)
            
            response = await self.http_client.post(
                f"{connection.server_url}/tools/{tool_name}/execute",
                headers=headers,
                json=arguments
            )
            response.raise_for_status()
            
            result_data = response.json()
            
            return MCPToolResult(
                id=f"mcp_{datetime.now().timestamp()}",
                tool_name=tool_name,
                output=result_data.get('output'),
                error=result_data.get('error')
            )
            
        except Exception as e:
            return MCPToolResult(
                id=f"mcp_{datetime.now().timestamp()}",
                tool_name=tool_name,
                output=None,
                error=str(e)
            )
    
    async def approve_execution(
        self,
        approval_request_id: str,
        approved: bool
    ) -> Optional[MCPToolResult]:
        """
        Approve or reject a pending tool execution
        
        Args:
            approval_request_id: ID of the approval request
            approved: Whether to approve or reject
            
        Returns:
            MCPToolResult if approved, None if rejected
        """
        if approval_request_id not in self.pending_approvals:
            return None
        
        request = self.pending_approvals[approval_request_id]
        del self.pending_approvals[approval_request_id]
        
        if not approved:
            return MCPToolResult(
                id=f"mcp_{datetime.now().timestamp()}",
                tool_name=request.tool_name,
                output=None,
                error="User rejected execution"
            )
        
        # Execute the approved tool
        return await self.execute_tool(
            tool_name=request.tool_name,
            arguments=request.arguments,
            server_label=request.server_label,
            require_approval=False  # Already approved
        )
    
    async def stream_execution(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        server_label: Optional[str] = None
    ) -> AsyncIterator[MCPEvent]:
        """
        Stream tool execution events
        
        Args:
            tool_name: Name of the tool to execute
            arguments: Arguments to pass to the tool
            server_label: Optional server to execute on
            
        Yields:
            MCPEvent objects as execution progresses
        """
        # Find the tool and connection
        tool = None
        connection = None
        
        if server_label:
            if server_label in self.connections:
                connection = self.connections[server_label]
                tool = next((t for t in connection.tools if t.name == tool_name), None)
        else:
            for conn in self.connections.values():
                if conn.connected:
                    tool = next((t for t in conn.tools if t.name == tool_name), None)
                    if tool:
                        connection = conn
                        break
        
        if not tool or not connection:
            # Yield error event
            yield MCPEvent(
                type="call.failed",
                event_id=f"event_{datetime.now().timestamp()}",
                item_id=f"mcp_{datetime.now().timestamp()}",
                output_index=0,
                data={"error": f"Tool '{tool_name}' not found"}
            )
            return
        
        try:
            headers = self._build_auth_headers(connection.auth)
            
            # Stream execution
            async with self.http_client.stream(
                'POST',
                f"{connection.server_url}/tools/{tool_name}/stream",
                headers=headers,
                json=arguments
            ) as response:
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith('data: '):
                        event_data = json.loads(line[6:])
                        
                        yield MCPEvent(
                            type=event_data.get('type'),
                            event_id=event_data.get('event_id'),
                            item_id=event_data.get('item_id'),
                            output_index=event_data.get('output_index', 0),
                            data=event_data
                        )
        
        except Exception as e:
            # Yield error event
            yield MCPEvent(
                type="call.failed",
                event_id=f"event_{datetime.now().timestamp()}",
                item_id=f"mcp_{datetime.now().timestamp()}",
                output_index=0,
                data={"error": str(e)}
            )
    
    def _build_auth_headers(self, auth: MCPAuthConfig) -> Dict[str, str]:
        """Build authentication headers"""
        headers = {
            "Content-Type": "application/json"
        }
        
        if auth.type == MCPAuthType.API_KEY:
            headers["Authorization"] = f"Bearer {auth.api_key}"
        elif auth.type == MCPAuthType.BASIC:
            import base64
            credentials = base64.b64encode(
                f"{auth.username}:{auth.password}".encode()
            ).decode()
            headers["Authorization"] = f"Basic {credentials}"
        elif auth.type == MCPAuthType.OAUTH2:
            headers["Authorization"] = f"Bearer {auth.token}"
        
        return headers
    
    async def healthcheck(self, server_label: str) -> bool:
        """Check if MCP server is healthy"""
        if server_label not in self.connections:
            return False
        
        connection = self.connections[server_label]
        
        try:
            headers = self._build_auth_headers(connection.auth)
            response = await self.http_client.get(
                f"{connection.server_url}/health",
                headers=headers
            )
            response.raise_for_status()
            
            connection.last_heartbeat = datetime.now()
            return True
            
        except Exception:
            connection.connected = False
            return False
    
    async def discover_servers(
        self,
        registry_url: str = "https://mcp-registry.openai.com"
    ) -> List[Dict[str, Any]]:
        """
        Discover available MCP servers from registry
        
        Args:
            registry_url: URL of MCP server registry
            
        Returns:
            List of available server information
        """
        try:
            response = await self.http_client.get(f"{registry_url}/servers")
            response.raise_for_status()
            return response.json().get('servers', [])
        except Exception as e:
            print(f"Failed to discover servers: {str(e)}")
            return []
    
    async def close(self):
        """Close all connections and cleanup"""
        for connection in self.connections.values():
            connection.connected = False
        
        self.connections.clear()
        await self.http_client.aclose()


# FastAPI endpoints
from fastapi import APIRouter, HTTPException, Depends
from typing import AsyncIterator
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/v1/mcp", tags=["mcp"])

# Global MCP adapter instance
mcp_adapter = MCPAdapter()

@router.post("/servers/connect")
async def connect_mcp_server(
    server_url: str,
    server_label: str,
    auth: MCPAuthConfig
) -> MCPConnection:
    """Connect to an MCP server"""
    try:
        connection = await mcp_adapter.connect_server(
            server_url=server_url,
            server_label=server_label,
            auth=auth
        )
        return connection
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/servers/{server_label}/disconnect")
async def disconnect_mcp_server(server_label: str):
    """Disconnect from MCP server"""
    await mcp_adapter.disconnect_server(server_label)
    return {"status": "disconnected"}

@router.get("/tools")
async def list_mcp_tools(server_label: Optional[str] = None) -> List[MCPTool]:
    """List available MCP tools"""
    return await mcp_adapter.list_tools(server_label=server_label)

@router.post("/tools/execute")
async def execute_mcp_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    server_label: Optional[str] = None,
    require_approval: bool = False
) -> MCPToolResult:
    """Execute an MCP tool"""
    return await mcp_adapter.execute_tool(
        tool_name=tool_name,
        arguments=arguments,
        server_label=server_label,
        require_approval=require_approval
    )

@router.post("/approvals/{approval_id}/approve")
async def approve_mcp_execution(
    approval_id: str,
    approved: bool
) -> Optional[MCPToolResult]:
    """Approve or reject a pending MCP tool execution"""
    result = await mcp_adapter.approve_execution(approval_id, approved)
    if result is None:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return result

@router.get("/approvals")
async def list_pending_approvals() -> List[MCPApprovalRequest]:
    """List pending approval requests"""
    return list(mcp_adapter.pending_approvals.values())

@router.post("/tools/stream")
async def stream_mcp_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    server_label: Optional[str] = None
):
    """Stream MCP tool execution"""
    async def event_generator():
        async for event in mcp_adapter.stream_execution(
            tool_name=tool_name,
            arguments=arguments,
            server_label=server_label
        ):
            yield f"data: {event.json()}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )

@router.get("/servers/discover")
async def discover_mcp_servers() -> List[Dict[str, Any]]:
    """Discover available MCP servers from registry"""
    return await mcp_adapter.discover_servers()

@router.get("/servers/{server_label}/health")
async def check_server_health(server_label: str) -> Dict[str, bool]:
    """Check MCP server health"""
    healthy = await mcp_adapter.healthcheck(server_label)
    return {"healthy": healthy}
