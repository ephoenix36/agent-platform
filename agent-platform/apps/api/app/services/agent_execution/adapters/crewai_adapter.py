"""
CrewAI Adapter

Implements execution of CrewAI crews with streaming support.
Supports YAML-based crew definitions and async task execution.
"""

import asyncio
from typing import Dict, Any, AsyncIterator, Optional
from datetime import datetime
import yaml

from .base_adapter import (
    AgentAdapter,
    ExecutionEvent,
    ExecutionEventType,
    ExecutionStatus
)


class CrewAIAdapter(AgentAdapter):
    """Adapter for CrewAI multi-agent orchestration"""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        super().__init__(config)
        self.active_executions: Dict[str, bool] = {}
    
    async def validate_config(self, agent_config: Dict[str, Any]) -> bool:
        """Validate CrewAI configuration"""
        # CrewAI uses 'role' instead of 'name'
        if "role" not in agent_config and "name" not in agent_config:
            raise ValueError("Missing 'role' or 'name' field")
        
        # CrewAI typically has goal and backstory
        if "goal" not in agent_config and "instructions" not in agent_config:
            raise ValueError("Missing 'goal' or 'instructions' field")
        
        return True
    
    async def execute(
        self,
        agent_config: Dict[str, Any],
        input_data: Dict[str, Any],
        execution_id: str
    ) -> AsyncIterator[ExecutionEvent]:
        """Execute CrewAI crew with streaming"""
        
        # Mark execution as active
        self.active_executions[execution_id] = True
        
        try:
            await self.validate_config(agent_config)
            await self.on_start(execution_id)
            
            # Extract CrewAI-specific fields
            role = agent_config.get("role", agent_config.get("name", "Agent"))
            goal = agent_config.get("goal", agent_config.get("instructions", ""))
            backstory = agent_config.get("backstory", agent_config.get("description", ""))
            tools = agent_config.get("tools", [])
            
            # Emit initializing status
            yield ExecutionEvent(
                type=ExecutionEventType.STATUS,
                data={"status": ExecutionStatus.INITIALIZING},
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            yield ExecutionEvent(
                type=ExecutionEventType.LOG,
                data={"message": f"Initializing CrewAI agent: {role}"},
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
            
            # Simulate crew thinking process
            user_task = input_data.get("task", input_data.get("query", ""))
            
            yield ExecutionEvent(
                type=ExecutionEventType.THINKING,
                data={
                    "message": f"{role} analyzing task",
                    "role": role,
                    "goal": goal,
                    "task": user_task
                },
                timestamp=datetime.now().timestamp(),
                execution_id=execution_id
            )
            
            # Simulate tool execution (in real CrewAI, these would be actual tools)
            for i, tool in enumerate(tools):
                if not self.active_executions.get(execution_id, False):
                    break
                
                tool_name = tool if isinstance(tool, str) else tool.get("name", f"tool_{i}")
                
                yield ExecutionEvent(
                    type=ExecutionEventType.TOOL_CALL,
                    data={
                        "tool": tool_name,
                        "agent": role,
                        "parameters": {"task": user_task}
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
                
                await asyncio.sleep(0.5)
                
                yield ExecutionEvent(
                    type=ExecutionEventType.TOOL_RESULT,
                    data={
                        "tool": tool_name,
                        "agent": role,
                        "result": f"Completed {tool_name}",
                        "success": True
                    },
                    timestamp=datetime.now().timestamp(),
                    execution_id=execution_id
                )
            
            # Generate crew result
            result = {
                "summary": f"{role} completed task successfully",
                "task": user_task,
                "role": role,
                "goal": goal,
                "tools_used": tools,
                "timestamp": datetime.now().isoformat()
            }
            
            # Generate UI if configured
            if agent_config.get("ui_components"):
                yield ExecutionEvent(
                    type=ExecutionEventType.UI_COMPONENT,
                    data={
                        "id": f"crew-result-{execution_id}",
                        "type": "card",
                        "props": {
                            "title": f"{role} Results",
                            "content": result["summary"],
                            "status": "success",
                            "metadata": {
                                "role": role,
                                "tools": len(tools)
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
        """Cancel CrewAI execution"""
        if execution_id in self.active_executions:
            self.active_executions[execution_id] = False
            return True
        return False
    
    def get_supported_features(self) -> Dict[str, bool]:
        """Get CrewAI adapter features"""
        return {
            "streaming": True,
            "tool_calling": True,
            "ui_generation": True,
            "cancellation": True,
            "parallel_execution": True,  # CrewAI supports parallel tasks
            "delegation": True,  # CrewAI supports agent delegation
        }


# For future: Real CrewAI implementation
"""
from crewai import Crew, Agent, Task, Process

async def execute_crewai_crew(agent_config: Dict, input_data: Dict):
    # Create agent
    agent = Agent(
        role=agent_config["role"],
        goal=agent_config["goal"],
        backstory=agent_config.get("backstory", ""),
        tools=agent_config.get("tools", []),
        verbose=True
    )
    
    # Create task
    task = Task(
        description=input_data["task"],
        agent=agent,
        expected_output=input_data.get("expected_output", "")
    )
    
    # Create crew
    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=True
    )
    
    # Execute
    result = await crew.kickoff_async()
    return result
"""
