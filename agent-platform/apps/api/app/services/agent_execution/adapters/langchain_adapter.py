"""
LangChain Adapter

Implements execution of LangChain agents and chains with streaming support.
Supports LangGraph workflows and traditional chains.
"""

import asyncio
from typing import Dict, Any, AsyncIterator, Optional
from datetime import datetime

from .base_adapter import (
    AgentAdapter,
    ExecutionEvent,
    ExecutionEventType,
    ExecutionStatus
)


class LangChainAdapter(AgentAdapter):
    """Adapter for LangChain agents and chains"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.active_executions: Dict[str, bool] = {}
    
    async def validate_config(self, agent_config: Dict[str, Any]) -> bool:
        """Validate LangChain configuration"""
        # LangChain can have various structures
        if "name" not in agent_config and "type" not in agent_config:
            raise ValueError("Missing 'name' or 'type' field")
        
        # Check for either instructions or system_message
        if "instructions" not in agent_config and "system_message" not in agent_config:
            raise ValueError("Missing 'instructions' or 'system_message' field")
        
        return True
    
    async def execute(
        self,
        agent_config: Dict[str, Any],
        input_data: Dict[str, Any],
        execution_id: str
    ) -> AsyncIterator[ExecutionEvent]:
        """Execute LangChain agent/chain with streaming"""
        
        # Mark execution as active
        self.active_executions[execution_id] = True
        
        try:
            await self.validate_config(agent_config)
            await self.on_start(execution_id)
            
            # Extract LangChain-specific fields
            agent_name = agent_config.get("name", agent_config.get("type", "LangChain Agent"))
            system_message = agent_config.get("system_message", agent_config.get("instructions", ""))
            tools = agent_config.get("tools", [])
            chain_type = agent_config.get("chain_type", agent_config.get("type", "agent"))
            
            # Emit initializing status
            yield ExecutionEvent(
                type=ExecutionEventType.STATUS,
                data={"status": ExecutionStatus.INITIALIZING},
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            yield ExecutionEvent(
                type=ExecutionEventType.LOG,
                data={"message": f"Initializing LangChain {chain_type}: {agent_name}"},
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
            
            # Get user input
            user_input = input_data.get("input", input_data.get("query", ""))
            
            # Simulate chain thinking
            yield ExecutionEvent(
                type=ExecutionEventType.THINKING,
                data={
                    "message": f"Processing with {chain_type}",
                    "agent": agent_name,
                    "system_message": system_message[:100] + "..." if len(system_message) > 100 else system_message,
                    "input": user_input
                },
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Simulate LangChain steps
            steps = agent_config.get("steps", [])
            if not steps and tools:
                # If no steps defined but tools exist, create steps from tools
                steps = [{"action": f"use_{tool if isinstance(tool, str) else tool.get('name', 'tool')}"} 
                        for tool in tools[:3]]  # Limit to 3 for demo
            
            # Execute steps/tools
            for i, step in enumerate(steps):
                if not self.active_executions.get(execution_id, False):
                    break
                
                action = step if isinstance(step, str) else step.get("action", f"step_{i}")
                
                yield ExecutionEvent(
                    type=ExecutionEventType.TOOL_CALL,
                    data={
                        "tool": action,
                        "agent": agent_name,
                        "chain_type": chain_type,
                        "parameters": {"input": user_input}
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
                
                await asyncio.sleep(0.5)
                
                yield ExecutionEvent(
                    type=ExecutionEventType.TOOL_RESULT,
                    data={
                        "tool": action,
                        "agent": agent_name,
                        "result": f"Completed {action}",
                        "success": True
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
            
            # Generate final result
            result = {
                "output": f"Processed '{user_input}' using {chain_type}",
                "agent": agent_name,
                "chain_type": chain_type,
                "steps_executed": len(steps),
                "tools_available": len(tools),
                "timestamp": datetime.now().isoformat()
            }
            
            # Generate UI if LangGraph or configured
            if chain_type == "langgraph" or agent_config.get("ui_components"):
                yield ExecutionEvent(
                    type=ExecutionEventType.UI_COMPONENT,
                    data={
                        "id": f"langchain-result-{execution_id}",
                        "type": "card",
                        "props": {
                            "title": f"{agent_name} Output",
                            "content": result["output"],
                            "status": "success",
                            "metadata": {
                                "chain_type": chain_type,
                                "steps": len(steps)
                            }
                        }
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
            
            yield ExecutionEvent(
                type=ExecutionEventType.RESULT,
                data=result,
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
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
            self.active_executions.pop(execution_id, None)
    
    async def cancel(self, execution_id: str) -> bool:
        """Cancel LangChain execution"""
        if execution_id in self.active_executions:
            self.active_executions[execution_id] = False
            return True
        return False
    
    def get_supported_features(self) -> Dict[str, bool]:
        """Get LangChain adapter features"""
        return {
            "streaming": True,
            "tool_calling": True,
            "ui_generation": True,
            "cancellation": True,
            "parallel_execution": False,
            "memory": True,  # LangChain supports conversation memory
            "callbacks": True,  # LangChain has callback system
        }


# For future: Real LangChain implementation
"""
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

async def execute_langchain_agent(agent_config: Dict, input_data: Dict):
    # Create LLM
    llm = ChatOpenAI(
        model=agent_config.get("model", "gpt-4"),
        temperature=agent_config.get("temperature", 0.7)
    )
    
    # Create prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", agent_config["system_message"]),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    # Create agent
    tools = agent_config.get("tools", [])
    agent = create_openai_functions_agent(llm, tools, prompt)
    
    # Create executor
    executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        return_intermediate_steps=True,
        stream_run_manager=True
    )
    
    # Execute with streaming
    async for chunk in executor.astream({"input": input_data["input"]}):
        yield chunk

async def execute_langgraph(agent_config: Dict, input_data: Dict):
    # Create LangGraph agent
    llm = ChatOpenAI(model=agent_config.get("model", "gpt-4"))
    tools = agent_config.get("tools", [])
    
    agent = create_react_agent(llm, tools)
    
    # Execute
    async for event in agent.astream_events(
        {"messages": [("human", input_data["input"])]},
        version="v1"
    ):
        yield event
"""
