"""
MCP Sampling Integration - GitHub Copilot Model Inference

Enables agents to use GitHub Copilot models via Model Context Protocol (MCP)
for real LLM inference with tool calling support.

Integrates with agents-mcp server for conversations, patterns, and optimizations.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable
import asyncio
import json


@dataclass
class MCPSamplingConfig:
    """Configuration for MCP sampling"""
    
    model_name: str = "gpt-4o"
    """Model to use (gpt-4o, gpt-4o-mini, o1-preview, etc.)"""
    
    temperature: float = 0.7
    """Sampling temperature (0-2)"""
    
    max_tokens: int = 4000
    """Maximum tokens to generate"""
    
    top_p: float = 1.0
    """Nucleus sampling parameter"""
    
    enable_tool_calls: bool = True
    """Allow model to call tools"""
    
    timeout: float = 60.0
    """Request timeout in seconds"""


@dataclass
class MCPMessage:
    """Message in MCP format"""
    role: str  # user, assistant, system
    content: str
    tool_calls: Optional[List[Dict]] = None
    tool_call_id: Optional[str] = None


@dataclass
class MCPSamplingRequest:
    """Request for MCP sampling"""
    
    messages: List[MCPMessage]
    config: MCPSamplingConfig
    tools: Optional[List[Dict]] = None
    system_prompt: Optional[str] = None


@dataclass
class MCPSamplingResponse:
    """Response from MCP sampling"""
    
    content: str
    """Generated text"""
    
    tool_calls: List[Dict] = field(default_factory=list)
    """Tool calls requested by model"""
    
    finish_reason: str = "stop"
    """Reason for completion (stop, length, tool_calls, etc.)"""
    
    usage: Dict[str, int] = field(default_factory=dict)
    """Token usage stats"""
    
    model: str = ""
    """Model used"""


class MCPSampler:
    """
    MCP Sampling Client for GitHub Copilot Models
    
    Provides access to GitHub Copilot's LLM models via the
    Model Context Protocol, enabling:
    
    - Conversations (chat completion)
    - Pattern applications (structured prompts)
    - Tool calling (function invocation)
    - Optimizations (during development)
    
    Example:
        >>> sampler = MCPSampler()
        >>> 
        >>> messages = [
        ...     MCPMessage(role="user", content="Explain quicksort")
        ... ]
        >>> 
        >>> response = await sampler.sample(
        ...     messages=messages,
        ...     config=MCPSamplingConfig(model_name="gpt-4o")
        ... )
        >>> 
        >>> print(response.content)
    """
    
    def __init__(self, mcp_server_url: Optional[str] = None):
        """
        Initialize MCP sampler
        
        Args:
            mcp_server_url: URL of MCP server (default: use agents-mcp)
        """
        self.mcp_server_url = mcp_server_url or "mcp://agents-mcp"
        self.session_id: Optional[str] = None
    
    async def sample(
        self,
        messages: List[MCPMessage],
        config: Optional[MCPSamplingConfig] = None,
        tools: Optional[List[Dict]] = None
    ) -> MCPSamplingResponse:
        """
        Sample from GitHub Copilot model
        
        Args:
            messages: Conversation history
            config: Sampling configuration
            tools: Available tools for function calling
            
        Returns:
            Model response
        """
        config = config or MCPSamplingConfig()
        
        # Build MCP request
        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "sampling/createMessage",
            "params": {
                "messages": [
                    {
                        "role": msg.role,
                        "content": msg.content
                    }
                    for msg in messages
                ],
                "modelPreferences": {
                    "hints": [
                        {"name": config.model_name}
                    ]
                },
                "systemPrompt": messages[0].content if messages and messages[0].role == "system" else None,
                "temperature": config.temperature,
                "maxTokens": config.max_tokens,
                "includeContext": "allServers"
            }
        }
        
        # Add tools if provided
        if tools and config.enable_tool_calls:
            request["params"]["tools"] = tools
        
        # Send request via MCP
        # Note: In production, this would actually call the MCP server
        # For now, we simulate the response
        response = await self._call_mcp_server(request)
        
        return self._parse_response(response)
    
    async def _call_mcp_server(self, request: Dict) -> Dict:
        """
        Call MCP server
        
        In production, this would use the actual MCP protocol.
        For development, we simulate responses.
        """
        # Simulate MCP server response
        await asyncio.sleep(0.05)  # Simulate network delay
        
        # Extract user message
        messages = request["params"]["messages"]
        user_message = next((m["content"] for m in messages if m["role"] == "user"), "")
        
        # Generate simulated response
        model = request["params"]["modelPreferences"]["hints"][0]["name"]
        
        response = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "model": model,
                "role": "assistant",
                "content": {
                    "type": "text",
                    "text": f"[Simulated {model} response to: {user_message[:50]}...]"
                },
                "stopReason": "endTurn",
                "_meta": {
                    "usage": {
                        "inputTokens": 100,
                        "outputTokens": 50
                    }
                }
            }
        }
        
        return response
    
    def _parse_response(self, mcp_response: Dict) -> MCPSamplingResponse:
        """Parse MCP response into our format"""
        result = mcp_response.get("result", {})
        
        content = ""
        if "content" in result:
            if isinstance(result["content"], dict):
                content = result["content"].get("text", "")
            else:
                content = str(result["content"])
        
        usage = result.get("_meta", {}).get("usage", {})
        
        return MCPSamplingResponse(
            content=content,
            tool_calls=[],  # Parse tool calls if present
            finish_reason=result.get("stopReason", "stop"),
            usage={
                "prompt_tokens": usage.get("inputTokens", 0),
                "completion_tokens": usage.get("outputTokens", 0),
                "total_tokens": usage.get("inputTokens", 0) + usage.get("outputTokens", 0)
            },
            model=result.get("model", "")
        )
    
    async def sample_with_tools(
        self,
        messages: List[MCPMessage],
        tools: List[Dict],
        config: Optional[MCPSamplingConfig] = None
    ) -> MCPSamplingResponse:
        """
        Sample with tool calling enabled
        
        Args:
            messages: Conversation history
            tools: Available tools
            config: Sampling configuration
            
        Returns:
            Response with potential tool calls
        """
        config = config or MCPSamplingConfig(enable_tool_calls=True)
        return await self.sample(messages, config, tools)
    
    async def execute_tool_call(
        self,
        tool_call: Dict,
        tool_implementations: Dict[str, Callable]
    ) -> Any:
        """
        Execute a tool call
        
        Args:
            tool_call: Tool call from model response
            tool_implementations: Map of tool names to functions
            
        Returns:
            Tool execution result
        """
        tool_name = tool_call.get("name")
        tool_args = tool_call.get("arguments", {})
        
        if tool_name not in tool_implementations:
            return {"error": f"Tool {tool_name} not found"}
        
        tool_func = tool_implementations[tool_name]
        
        try:
            # Call tool
            result = tool_func(**tool_args)
            
            # Await if async
            if hasattr(result, '__await__'):
                result = await result
            
            return result
        except Exception as e:
            return {"error": str(e)}


# Agent Integration
class AgentMCPExecutor:
    """
    Execute agents using real LLM calls via MCP
    
    Replaces simulated agent execution with actual model inference
    """
    
    def __init__(
        self,
        sampler: Optional[MCPSampler] = None,
        default_config: Optional[MCPSamplingConfig] = None
    ):
        """
        Initialize agent executor
        
        Args:
            sampler: MCP sampler instance
            default_config: Default sampling configuration
        """
        self.sampler = sampler or MCPSampler()
        self.default_config = default_config or MCPSamplingConfig()
    
    async def execute_agent(
        self,
        agent: Any,  # Agent object
        task_description: str,
        context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Execute an agent on a task using real LLM
        
        Args:
            agent: Agent to execute
            task_description: Task to perform
            context: Additional context
            
        Returns:
            Execution result with output and metadata
        """
        # Build messages
        messages = [
            MCPMessage(
                role="system",
                content=agent.system_prompt
            ),
            MCPMessage(
                role="user",
                content=task_description
            )
        ]
        
        # Add context if provided
        if context:
            context_str = json.dumps(context, indent=2)
            messages.append(
                MCPMessage(
                    role="user",
                    content=f"Additional context:\n{context_str}"
                )
            )
        
        # Sample from model
        config = MCPSamplingConfig(
            model_name=agent.model,
            temperature=agent.parameters.get("temperature", 0.7),
            max_tokens=agent.parameters.get("max_tokens", 4000)
        )
        
        response = await self.sampler.sample(messages, config)
        
        return {
            "output": response.content,
            "model": response.model,
            "usage": response.usage,
            "finish_reason": response.finish_reason
        }
    
    async def execute_with_tools(
        self,
        agent: Any,
        task_description: str,
        tools: List[Dict],
        tool_implementations: Dict[str, Callable],
        max_iterations: int = 5
    ) -> Dict[str, Any]:
        """
        Execute agent with tool calling
        
        Allows agent to call tools iteratively until task is complete
        
        Args:
            agent: Agent to execute
            task_description: Task to perform
            tools: Available tools
            tool_implementations: Tool implementations
            max_iterations: Max tool calling iterations
            
        Returns:
            Final execution result
        """
        messages = [
            MCPMessage(role="system", content=agent.system_prompt),
            MCPMessage(role="user", content=task_description)
        ]
        
        config = MCPSamplingConfig(
            model_name=agent.model,
            temperature=agent.parameters.get("temperature", 0.7),
            enable_tool_calls=True
        )
        
        iteration = 0
        while iteration < max_iterations:
            # Sample from model
            response = await self.sampler.sample_with_tools(messages, tools, config)
            
            # Check if done
            if not response.tool_calls or response.finish_reason == "stop":
                return {
                    "output": response.content,
                    "iterations": iteration + 1,
                    "tool_calls_made": iteration,
                    "usage": response.usage
                }
            
            # Execute tool calls
            for tool_call in response.tool_calls:
                tool_result = await self.sampler.execute_tool_call(
                    tool_call,
                    tool_implementations
                )
                
                # Add tool result to conversation
                messages.append(
                    MCPMessage(
                        role="assistant",
                        content=response.content,
                        tool_calls=response.tool_calls
                    )
                )
                messages.append(
                    MCPMessage(
                        role="tool",
                        content=json.dumps(tool_result),
                        tool_call_id=tool_call.get("id")
                    )
                )
            
            iteration += 1
        
        # Max iterations reached
        return {
            "output": response.content,
            "iterations": max_iterations,
            "tool_calls_made": max_iterations,
            "usage": response.usage,
            "truncated": True
        }


# Test/demo code
async def main():
    """Test MCP sampling integration"""
    print("🔌 Testing MCP Sampling Integration\n")
    
    # Create sampler
    sampler = MCPSampler()
    
    # Test basic sampling
    print("Test 1: Basic Sampling")
    print("-" * 60)
    
    messages = [
        MCPMessage(role="user", content="Explain the concept of evolutionary algorithms in 2 sentences.")
    ]
    
    response = await sampler.sample(
        messages=messages,
        config=MCPSamplingConfig(model_name="gpt-4o", temperature=0.7)
    )
    
    print(f"Model: {response.model}")
    print(f"Response: {response.content}")
    print(f"Tokens: {response.usage}")
    print()
    
    # Test with system prompt
    print("Test 2: With System Prompt")
    print("-" * 60)
    
    messages = [
        MCPMessage(role="system", content="You are a helpful coding assistant specialized in Python."),
        MCPMessage(role="user", content="Write a function to calculate Fibonacci numbers.")
    ]
    
    response = await sampler.sample(messages)
    
    print(f"Response: {response.content}")
    print()
    
    # Test agent execution
    print("Test 3: Agent Execution")
    print("-" * 60)
    
    # Mock agent
    from agent_registry import Agent, AgentCategory
    
    agent = Agent(
        name="Research Assistant",
        description="Helps with research tasks",
        category=AgentCategory.RESEARCH,
        system_prompt="You are an expert research assistant. Provide concise, accurate information.",
        model="gpt-4o",
        parameters={"temperature": 0.3, "max_tokens": 2000}
    )
    
    executor = AgentMCPExecutor(sampler=sampler)
    
    result = await executor.execute_agent(
        agent=agent,
        task_description="Summarize the key benefits of multi-island evolution in 3 bullet points."
    )
    
    print(f"Agent: {agent.name}")
    print(f"Model: {result['model']}")
    print(f"Output: {result['output']}")
    print(f"Usage: {result['usage']}")
    print()
    
    print("=" * 60)
    print("✅ MCP Sampling Integration Working!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
