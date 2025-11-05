"""
Multi-Protocol Support System
Supports: MCP (Model Context Protocol), CrewAI, LangChain, LangGraph, AutoGen
"""

from typing import Dict, List, Any, Optional, Protocol, AsyncIterator
from enum import Enum
from pydantic import BaseModel, Field
from abc import ABC, abstractmethod
import asyncio
import json

class ProtocolType(str, Enum):
    """Supported agent protocols"""
    MCP = "mcp"  # Model Context Protocol (Universal standard for tools)
    CREWAI = "crewai"  # CrewAI multi-agent framework
    LANGCHAIN = "langchain"  # LangChain agent framework
    LANGGRAPH = "langgraph"  # LangGraph stateful agents
    AUTOGEN = "autogen"  # Microsoft AutoGen

class AgentMessage(BaseModel):
    """Universal message format for inter-agent communication"""
    id: str
    from_agent: str
    to_agent: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str
    protocol: ProtocolType

class AgentCapability(BaseModel):
    """Agent capability definition"""
    name: str
    description: str
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    protocol: ProtocolType

class AgentProtocolAdapter(ABC):
    """Base class for protocol adapters"""
    
    @abstractmethod
    async def execute(
        self,
        capability: str,
        input_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a capability"""
        pass
    
    @abstractmethod
    async def list_capabilities(self) -> List[AgentCapability]:
        """List all available capabilities"""
        pass
    
    @abstractmethod
    async def send_message(self, message: AgentMessage) -> None:
        """Send message to another agent"""
        pass
    
    @abstractmethod
    async def receive_messages(self) -> AsyncIterator[AgentMessage]:
        """Receive messages from other agents"""
        pass


class MCPAdapter(AgentProtocolAdapter):
    """
    Model Context Protocol (MCP) Adapter
    MCP is a universal protocol for tools/functions that AI can use
    """
    
    def __init__(self, server_config: Dict[str, Any]):
        self.server_config = server_config
        self.tools: Dict[str, Dict] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
    async def execute(
        self,
        capability: str,
        input_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute an MCP tool"""
        
        tool = self.tools.get(capability)
        if not tool:
            raise ValueError(f"Tool '{capability}' not found")
        
        # MCP tools are simple function calls
        result = await self._call_mcp_tool(tool, input_data)
        
        return {
            "success": True,
            "result": result,
            "protocol": "mcp"
        }
    
    async def list_capabilities(self) -> List[AgentCapability]:
        """List all MCP tools"""
        capabilities = []
        
        for name, tool in self.tools.items():
            capabilities.append(AgentCapability(
                name=name,
                description=tool.get("description", ""),
                input_schema=tool.get("inputSchema", {}),
                output_schema=tool.get("outputSchema", {}),
                protocol=ProtocolType.MCP
            ))
        
        return capabilities
    
    async def send_message(self, message: AgentMessage) -> None:
        """Send MCP message"""
        await self.message_queue.put(message)
    
    async def receive_messages(self) -> AsyncIterator[AgentMessage]:
        """Receive MCP messages"""
        while True:
            message = await self.message_queue.get()
            yield message
    
    async def _call_mcp_tool(self, tool: Dict, params: Dict[str, Any]) -> Any:
        """Call MCP tool (simulated - would use actual MCP SDK)"""
        # In production, this would use the MCP SDK
        # For now, simulate tool execution
        return {"status": "executed", "params": params}
    
    async def register_tool(self, name: str, tool_def: Dict[str, Any]) -> None:
        """Register a new MCP tool"""
        self.tools[name] = tool_def


class CrewAIAdapter(AgentProtocolAdapter):
    """
    CrewAI Protocol Adapter
    CrewAI is a framework for orchestrating role-playing AI agents
    """
    
    def __init__(self, crew_config: Dict[str, Any]):
        self.crew_config = crew_config
        self.agents: Dict[str, Any] = {}
        self.tasks: List[Dict] = []
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
    async def execute(
        self,
        capability: str,
        input_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a CrewAI workflow"""
        
        # CrewAI uses sequential or hierarchical processes
        results = []
        
        for agent_id, agent in self.agents.items():
            task_result = await self._execute_agent_task(
                agent,
                input_data,
                context
            )
            results.append(task_result)
        
        return {
            "success": True,
            "results": results,
            "protocol": "crewai"
        }
    
    async def list_capabilities(self) -> List[AgentCapability]:
        """List CrewAI agent capabilities"""
        capabilities = []
        
        for agent_id, agent in self.agents.items():
            capabilities.append(AgentCapability(
                name=agent.get("role", agent_id),
                description=agent.get("goal", ""),
                input_schema={},
                output_schema={},
                protocol=ProtocolType.CREWAI
            ))
        
        return capabilities
    
    async def send_message(self, message: AgentMessage) -> None:
        """Send message between crew agents"""
        await self.message_queue.put(message)
    
    async def receive_messages(self) -> AsyncIterator[AgentMessage]:
        """Receive crew messages"""
        while True:
            message = await self.message_queue.get()
            yield message
    
    async def _execute_agent_task(
        self,
        agent: Dict,
        input_data: Dict,
        context: Optional[Dict] = None
    ) -> Dict:
        """Execute task for a crew agent"""
        return {
            "agent": agent.get("role"),
            "output": f"Processed by {agent.get('role')}",
            "status": "completed"
        }


class LangChainAdapter(AgentProtocolAdapter):
    """
    LangChain Protocol Adapter
    LangChain is a framework for building LLM applications
    """
    
    def __init__(self, chain_config: Dict[str, Any]):
        self.chain_config = chain_config
        self.chains: Dict[str, Any] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
    async def execute(
        self,
        capability: str,
        input_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a LangChain chain"""
        
        chain = self.chains.get(capability)
        if not chain:
            raise ValueError(f"Chain '{capability}' not found")
        
        result = await self._run_chain(chain, input_data, context)
        
        return {
            "success": True,
            "result": result,
            "protocol": "langchain"
        }
    
    async def list_capabilities(self) -> List[AgentCapability]:
        """List LangChain chains"""
        capabilities = []
        
        for name, chain in self.chains.items():
            capabilities.append(AgentCapability(
                name=name,
                description=chain.get("description", ""),
                input_schema={},
                output_schema={},
                protocol=ProtocolType.LANGCHAIN
            ))
        
        return capabilities
    
    async def send_message(self, message: AgentMessage) -> None:
        """Send message to chain"""
        await self.message_queue.put(message)
    
    async def receive_messages(self) -> AsyncIterator[AgentMessage]:
        """Receive chain messages"""
        while True:
            message = await self.message_queue.get()
            yield message
    
    async def _run_chain(
        self,
        chain: Dict,
        input_data: Dict,
        context: Optional[Dict] = None
    ) -> Any:
        """Run LangChain chain"""
        return {"output": "Chain executed", "input": input_data}


class LangGraphAdapter(AgentProtocolAdapter):
    """
    LangGraph Protocol Adapter
    LangGraph is a library for building stateful, multi-actor applications
    """
    
    def __init__(self, graph_config: Dict[str, Any]):
        self.graph_config = graph_config
        self.graph_state: Dict[str, Any] = {}
        self.nodes: Dict[str, Any] = {}
        self.edges: List[tuple] = []
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
    async def execute(
        self,
        capability: str,
        input_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute LangGraph workflow"""
        
        # Initialize state
        self.graph_state = input_data.copy()
        
        # Execute graph nodes in order
        current_node = "start"
        results = []
        
        while current_node != "end":
            node = self.nodes.get(current_node)
            if not node:
                break
            
            result = await self._execute_node(node, self.graph_state)
            results.append(result)
            
            # Update state
            self.graph_state.update(result.get("state_updates", {}))
            
            # Get next node
            current_node = self._get_next_node(current_node, self.graph_state)
        
        return {
            "success": True,
            "results": results,
            "final_state": self.graph_state,
            "protocol": "langgraph"
        }
    
    async def list_capabilities(self) -> List[AgentCapability]:
        """List LangGraph nodes"""
        capabilities = []
        
        for name, node in self.nodes.items():
            capabilities.append(AgentCapability(
                name=name,
                description=node.get("description", ""),
                input_schema={},
                output_schema={},
                protocol=ProtocolType.LANGGRAPH
            ))
        
        return capabilities
    
    async def send_message(self, message: AgentMessage) -> None:
        """Send message to graph node"""
        await self.message_queue.put(message)
    
    async def receive_messages(self) -> AsyncIterator[AgentMessage]:
        """Receive graph messages"""
        while True:
            message = await self.message_queue.get()
            yield message
    
    async def _execute_node(self, node: Dict, state: Dict) -> Dict:
        """Execute a graph node"""
        return {
            "node": node.get("name"),
            "output": "Node executed",
            "state_updates": {}
        }
    
    def _get_next_node(self, current: str, state: Dict) -> str:
        """Determine next node based on edges and state"""
        for from_node, to_node, condition in self.edges:
            if from_node == current:
                if condition is None or condition(state):
                    return to_node
        return "end"


class AutoGenAdapter(AgentProtocolAdapter):
    """
    AutoGen Protocol Adapter
    AutoGen is Microsoft's framework for multi-agent conversations
    """
    
    def __init__(self, autogen_config: Dict[str, Any]):
        self.autogen_config = autogen_config
        self.agents: Dict[str, Any] = {}
        self.conversation_history: List[Dict] = []
        self.message_queue: asyncio.Queue = asyncio.Queue()
        
    async def execute(
        self,
        capability: str,
        input_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute AutoGen conversation"""
        
        # Start conversation between agents
        conversation = await self._run_conversation(
            input_data.get("message", ""),
            input_data.get("max_turns", 10)
        )
        
        return {
            "success": True,
            "conversation": conversation,
            "protocol": "autogen"
        }
    
    async def list_capabilities(self) -> List[AgentCapability]:
        """List AutoGen agents"""
        capabilities = []
        
        for name, agent in self.agents.items():
            capabilities.append(AgentCapability(
                name=name,
                description=agent.get("system_message", ""),
                input_schema={},
                output_schema={},
                protocol=ProtocolType.AUTOGEN
            ))
        
        return capabilities
    
    async def send_message(self, message: AgentMessage) -> None:
        """Send message in conversation"""
        await self.message_queue.put(message)
        self.conversation_history.append(message.dict())
    
    async def receive_messages(self) -> AsyncIterator[AgentMessage]:
        """Receive conversation messages"""
        while True:
            message = await self.message_queue.get()
            yield message
    
    async def _run_conversation(
        self,
        initial_message: str,
        max_turns: int
    ) -> List[Dict]:
        """Run multi-agent conversation"""
        conversation = []
        
        for turn in range(max_turns):
            # Simulate conversation between agents
            response = {
                "turn": turn,
                "speaker": list(self.agents.keys())[turn % len(self.agents)],
                "message": f"Response to: {initial_message}",
                "role": "assistant"
            }
            conversation.append(response)
        
        return conversation


class ProtocolManager:
    """
    Manages multiple protocol adapters
    Routes requests to appropriate protocol
    """
    
    def __init__(self):
        self.adapters: Dict[ProtocolType, AgentProtocolAdapter] = {}
    
    def register_adapter(
        self,
        protocol: ProtocolType,
        adapter: AgentProtocolAdapter
    ) -> None:
        """Register a protocol adapter"""
        self.adapters[protocol] = adapter
    
    async def execute(
        self,
        protocol: ProtocolType,
        capability: str,
        input_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute capability using specified protocol"""
        
        adapter = self.adapters.get(protocol)
        if not adapter:
            raise ValueError(f"Protocol '{protocol}' not supported")
        
        return await adapter.execute(capability, input_data, context)
    
    async def list_all_capabilities(self) -> Dict[ProtocolType, List[AgentCapability]]:
        """List capabilities for all protocols"""
        all_capabilities = {}
        
        for protocol, adapter in self.adapters.items():
            capabilities = await adapter.list_capabilities()
            all_capabilities[protocol] = capabilities
        
        return all_capabilities
    
    async def send_message(
        self,
        protocol: ProtocolType,
        message: AgentMessage
    ) -> None:
        """Send message via specified protocol"""
        adapter = self.adapters.get(protocol)
        if adapter:
            await adapter.send_message(message)
    
    async def broadcast_message(self, message: AgentMessage) -> None:
        """Broadcast message to all protocols"""
        for adapter in self.adapters.values():
            await adapter.send_message(message)


# FastAPI integration
from fastapi import APIRouter, HTTPException, Depends

router = APIRouter(prefix="/api/v1/protocols", tags=["protocols"])

# Global protocol manager
protocol_manager = ProtocolManager()

@router.post("/execute")
async def execute_protocol_capability(
    protocol: ProtocolType,
    capability: str,
    input_data: Dict[str, Any],
    context: Optional[Dict[str, Any]] = None
):
    """
    Execute a capability using the specified protocol
    
    Supports:
    - MCP: Universal tool protocol
    - CrewAI: Multi-agent orchestration
    - LangChain: LLM chains
    - LangGraph: Stateful workflows
    - AutoGen: Conversational agents
    """
    try:
        result = await protocol_manager.execute(
            protocol, capability, input_data, context
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/capabilities")
async def list_capabilities(protocol: Optional[ProtocolType] = None):
    """List all available capabilities across protocols"""
    if protocol:
        adapter = protocol_manager.adapters.get(protocol)
        if not adapter:
            raise HTTPException(status_code=404, detail=f"Protocol '{protocol}' not found")
        capabilities = await adapter.list_capabilities()
        return {protocol: capabilities}
    else:
        return await protocol_manager.list_all_capabilities()

@router.post("/message/send")
async def send_agent_message(message: AgentMessage):
    """Send message to agent via specified protocol"""
    try:
        await protocol_manager.send_message(message.protocol, message)
        return {"status": "sent", "message_id": message.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/protocols")
async def list_protocols():
    """List all registered protocols"""
    return {
        "protocols": [
            {
                "type": protocol.value,
                "name": protocol.name,
                "adapter_registered": protocol in protocol_manager.adapters
            }
            for protocol in ProtocolType
        ]
    }
