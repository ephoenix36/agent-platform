"""
Artifact Side-Channel - Rich Debugging Feedback System
Based on AlphaEvolve research

Purpose: Provide LLMs with explicit, actionable feedback to guide evolution
Components:
- Execution instrumentation (stderr, stdout, profiling)
- LLM-generated critiques
- Performance metrics
- Resource usage tracking
- Execution traces

Impact: Accelerates evolutionary refinement, prevents stagnation
"""

import sys
import io
import time
import traceback
import asyncio
import psutil
import cProfile
import pstats
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from contextlib import redirect_stdout, redirect_stderr
from enum import Enum
import anthropic
import json

class ExecutionStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    RESOURCE_LIMIT = "resource_limit"

@dataclass
class ExecutionResult:
    """
    Complete execution result with rich artifacts
    
    Based on AlphaEvolve's EvaluationResult structure
    Provides both metrics and detailed feedback
    """
    # Metrics (machine-gradeable)
    metrics: Dict[str, float] = field(default_factory=dict)
    
    # Artifacts (rich debugging context)
    artifacts: Dict[str, Any] = field(default_factory=dict)
    
    # Status
    status: ExecutionStatus = ExecutionStatus.SUCCESS
    
    # Timing
    execution_time: float = 0.0
    
    # Output
    result: Any = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'metrics': self.metrics,
            'artifacts': {
                k: str(v) if not isinstance(v, (dict, list, str, int, float, bool)) else v
                for k, v in self.artifacts.items()
            },
            'status': self.status.value,
            'execution_time': self.execution_time,
            'result': str(self.result) if self.result is not None else None
        }

class ArtifactSideChannel:
    """
    Execute code and capture comprehensive artifacts
    
    Key Insight from Research:
    "Artifact Side-Channel provides rich, explicit feedback such as stderr messages,
    profiling data, or LLM-generated critiques. This debug information is vital for
    accelerating the evolutionary refinement of code."
    
    Artifacts Captured:
    1. stderr - Error messages and warnings
    2. stdout - Standard output
    3. profiling - Performance bottlenecks
    4. llm_feedback - AI-generated critiques
    5. resource_usage - Memory/CPU consumption
    6. execution_trace - Step-by-step execution
    """
    
    def __init__(
        self,
        llm_client: Optional[anthropic.Anthropic] = None,
        enable_profiling: bool = True,
        timeout: int = 30
    ):
        self.llm_client = llm_client
        self.enable_profiling = enable_profiling
        self.timeout = timeout
        self.process = psutil.Process()
        
    async def execute_and_capture(
        self,
        code: str,
        test_cases: Optional[List[Dict]] = None,
        context: Optional[Dict] = None
    ) -> ExecutionResult:
        """
        Execute code and capture all artifacts
        
        Args:
            code: Python code to execute
            test_cases: Optional test cases to run
            context: Additional context for execution
            
        Returns:
            ExecutionResult with metrics and rich artifacts
        """
        result = ExecutionResult()
        
        # Initialize artifacts
        result.artifacts = {
            "stderr": [],
            "stdout": [],
            "profiling": {},
            "llm_feedback": "",
            "resource_usage": {},
            "execution_trace": [],
            "warnings": [],
            "suggestions": []
        }
        
        # Track resource usage before
        mem_before = self.process.memory_info().rss / 1024 / 1024  # MB
        
        start_time = time.time()
        
        try:
            # Execute with instrumentation
            exec_result = await self._execute_instrumented(
                code,
                test_cases,
                result.artifacts
            )
            
            result.result = exec_result
            result.status = ExecutionStatus.SUCCESS
            
            # Calculate metrics
            result.metrics['correctness'] = 1.0 if exec_result else 0.0
            
        except TimeoutError:
            result.status = ExecutionStatus.TIMEOUT
            result.artifacts['stderr'].append("Execution timed out")
            result.metrics['correctness'] = 0.0
            
        except MemoryError:
            result.status = ExecutionStatus.RESOURCE_LIMIT
            result.artifacts['stderr'].append("Memory limit exceeded")
            result.metrics['correctness'] = 0.0
            
        except Exception as e:
            result.status = ExecutionStatus.ERROR
            result.artifacts['stderr'].append(str(e))
            result.artifacts['stderr'].append(traceback.format_exc())
            result.metrics['correctness'] = 0.0
        
        # Execution time
        result.execution_time = time.time() - start_time
        result.metrics['execution_time'] = result.execution_time
        
        # Resource usage after
        mem_after = self.process.memory_info().rss / 1024 / 1024  # MB
        
        result.artifacts['resource_usage'] = {
            'memory_peak_mb': mem_after,
            'memory_delta_mb': mem_after - mem_before,
            'cpu_percent': self.process.cpu_percent(),
            'execution_time_sec': result.execution_time
        }
        
        # Performance metrics
        if result.execution_time > 0:
            result.metrics['performance'] = min(1.0, 1.0 / result.execution_time)
        
        # Generate LLM critique
        if self.llm_client and result.status in [ExecutionStatus.SUCCESS, ExecutionStatus.ERROR]:
            result.artifacts['llm_feedback'] = await self._generate_critique(
                code,
                result
            )
            
            # Extract actionable suggestions
            result.artifacts['suggestions'] = self._extract_suggestions(
                result.artifacts['llm_feedback']
            )
        
        return result
    
    async def _execute_instrumented(
        self,
        code: str,
        test_cases: Optional[List[Dict]],
        artifacts: Dict
    ) -> Any:
        """
        Execute code with full instrumentation
        
        Captures:
        - stdout/stderr
        - Profiling data (if enabled)
        - Execution trace
        - Test results
        """
        # Capture stdout/stderr
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        # Create execution namespace
        exec_namespace = {
            '__builtins__': __builtins__,
            'print': lambda *args, **kwargs: print(*args, file=stdout_capture, **kwargs)
        }
        
        try:
            # Profile execution if enabled
            if self.enable_profiling:
                profiler = cProfile.Profile()
                profiler.enable()
            
            # Execute with timeout
            async def execute_with_timeout():
                with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                    exec(code, exec_namespace)
                    
                    # Run test cases if provided
                    if test_cases:
                        results = []
                        for test in test_cases:
                            test_result = self._run_test_case(
                                test,
                                exec_namespace
                            )
                            results.append(test_result)
                        return results
                    
                    return exec_namespace.get('result', None)
            
            result = await asyncio.wait_for(
                execute_with_timeout(),
                timeout=self.timeout
            )
            
            # Stop profiling
            if self.enable_profiling:
                profiler.disable()
                artifacts['profiling'] = self._extract_profiling_data(profiler)
            
            # Capture output
            artifacts['stdout'].append(stdout_capture.getvalue())
            artifacts['stderr'].append(stderr_capture.getvalue())
            
            return result
            
        except asyncio.TimeoutError:
            raise TimeoutError(f"Execution exceeded {self.timeout} seconds")
    
    def _run_test_case(
        self,
        test: Dict,
        namespace: Dict
    ) -> Dict:
        """Run a single test case"""
        try:
            # Get the function to test
            func_name = test.get('function_name')
            func = namespace.get(func_name)
            
            if not func:
                return {
                    'test': test,
                    'status': 'error',
                    'message': f"Function {func_name} not found"
                }
            
            # Call with test inputs
            inputs = test.get('inputs', [])
            expected = test.get('expected')
            
            actual = func(*inputs)
            
            passed = actual == expected
            
            return {
                'test': test,
                'status': 'passed' if passed else 'failed',
                'expected': expected,
                'actual': actual
            }
            
        except Exception as e:
            return {
                'test': test,
                'status': 'error',
                'message': str(e),
                'traceback': traceback.format_exc()
            }
    
    def _extract_profiling_data(
        self,
        profiler: cProfile.Profile
    ) -> Dict:
        """Extract actionable profiling information"""
        # Get stats
        stats = pstats.Stats(profiler)
        stats.sort_stats('cumulative')
        
        # Extract top time consumers
        top_functions = []
        for func, (cc, nc, tt, ct, callers) in list(stats.stats.items())[:10]:
            top_functions.append({
                'function': f"{func[0]}:{func[1]}:{func[2]}",
                'calls': nc,
                'cumulative_time': ct,
                'time_per_call': ct / nc if nc > 0 else 0
            })
        
        return {
            'total_calls': stats.total_calls,
            'primitive_calls': stats.prim_calls,
            'top_functions': top_functions,
            'bottlenecks': [
                f for f in top_functions
                if f['cumulative_time'] > 0.1  # More than 100ms
            ]
        }
    
    async def _generate_critique(
        self,
        code: str,
        result: ExecutionResult
    ) -> str:
        """
        Generate LLM critique of code execution
        
        Key Insight from Research:
        "LLM-generated critiques (e.g., 'Code is correct but could use better
        variable names') guide the LLM away from errors and suboptimal patterns"
        
        Returns actionable, specific feedback
        """
        if not self.llm_client:
            return ""
        
        # Build critique prompt
        critique_prompt = self._build_critique_prompt(code, result)
        
        try:
            # Generate critique using Claude
            message = self.llm_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": critique_prompt
                }]
            )
            
            return message.content[0].text
            
        except Exception as e:
            return f"Error generating critique: {str(e)}"
    
    def _build_critique_prompt(
        self,
        code: str,
        result: ExecutionResult
    ) -> str:
        """Build prompt for LLM critique"""
        prompt = f"""You are an expert code reviewer analyzing a code execution.

**Code:**
```python
{code}
```

**Execution Results:**
- Status: {result.status.value}
- Execution Time: {result.execution_time:.3f}s
- Correctness: {result.metrics.get('correctness', 0.0)}

**Artifacts:**
"""
        
        # Add stderr if present
        if result.artifacts.get('stderr') and any(result.artifacts['stderr']):
            prompt += f"\n**Errors:**\n{chr(10).join(result.artifacts['stderr'])}\n"
        
        # Add profiling if present
        if result.artifacts.get('profiling', {}).get('bottlenecks'):
            bottlenecks = result.artifacts['profiling']['bottlenecks']
            prompt += f"\n**Performance Bottlenecks:**\n"
            for b in bottlenecks:
                prompt += f"- {b['function']}: {b['cumulative_time']:.3f}s\n"
        
        # Add resource usage
        if result.artifacts.get('resource_usage'):
            usage = result.artifacts['resource_usage']
            prompt += f"\n**Resource Usage:**\n"
            prompt += f"- Memory: {usage.get('memory_peak_mb', 0):.1f} MB\n"
            prompt += f"- CPU: {usage.get('cpu_percent', 0):.1f}%\n"
        
        prompt += """
**Your Task:**
Provide 2-3 specific, actionable suggestions for improving this code.
Focus on:
1. Correctness (if errors present)
2. Performance optimization
3. Code quality and readability
4. Best practices

Format each suggestion as:
- [Category] Specific suggestion with explanation

Be concise but actionable. Example:
- [Performance] Replace list comprehension in line 5 with generator expression to reduce memory usage
"""
        
        return prompt
    
    def _extract_suggestions(self, llm_feedback: str) -> List[str]:
        """Extract actionable suggestions from LLM feedback"""
        suggestions = []
        
        for line in llm_feedback.split('\n'):
            line = line.strip()
            # Look for lines starting with - or * (bullet points)
            if line.startswith('-') or line.startswith('*'):
                suggestion = line.lstrip('-*').strip()
                if suggestion:
                    suggestions.append(suggestion)
        
        return suggestions
    
    async def execute_with_feedback_loop(
        self,
        initial_code: str,
        test_cases: List[Dict],
        max_iterations: int = 5
    ) -> ExecutionResult:
        """
        Execute code with feedback loop for self-improvement
        
        Process:
        1. Execute code
        2. Generate critique
        3. Ask LLM to fix based on critique
        4. Re-execute
        5. Repeat until success or max iterations
        
        This demonstrates the power of artifact side-channel!
        """
        code = initial_code
        
        for iteration in range(max_iterations):
            # Execute and capture artifacts
            result = await self.execute_and_capture(code, test_cases)
            
            # If successful, return
            if result.status == ExecutionStatus.SUCCESS and result.metrics.get('correctness', 0) >= 1.0:
                result.artifacts['iterations_to_success'] = iteration + 1
                return result
            
            # Generate improvement suggestion
            if self.llm_client:
                improvement = await self._suggest_improvement(
                    code,
                    result
                )
                
                if improvement:
                    code = improvement
                    result.artifacts['execution_trace'].append({
                        'iteration': iteration + 1,
                        'status': result.status.value,
                        'feedback': result.artifacts.get('llm_feedback', ''),
                        'code_updated': True
                    })
                else:
                    # Can't improve further
                    break
            else:
                # No LLM available
                break
        
        result.artifacts['total_iterations'] = max_iterations
        result.artifacts['converged'] = False
        return result
    
    async def _suggest_improvement(
        self,
        code: str,
        result: ExecutionResult
    ) -> Optional[str]:
        """
        Ask LLM to improve code based on execution artifacts
        
        This is the core of LLM-directed evolution!
        """
        if not self.llm_client:
            return None
        
        improvement_prompt = f"""You are improving code based on execution feedback.

**Current Code:**
```python
{code}
```

**Execution Feedback:**
- Status: {result.status.value}
- Errors: {result.artifacts.get('stderr', [])}
- Suggestions: {result.artifacts.get('suggestions', [])}

**Task:**
Provide improved code that fixes the issues. Return ONLY the improved code, no explanation.

Improved code:
```python"""
        
        try:
            message = self.llm_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                messages=[{
                    "role": "user",
                    "content": improvement_prompt
                }]
            )
            
            improved_code = message.content[0].text
            
            # Extract code from markdown if present
            if '```python' in improved_code:
                improved_code = improved_code.split('```python')[1].split('```')[0]
            elif '```' in improved_code:
                improved_code = improved_code.split('```')[1].split('```')[0]
            
            return improved_code.strip()
            
        except Exception as e:
            print(f"Error generating improvement: {e}")
            return None


# FastAPI Endpoints
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/api/v1/execution", tags=["execution"])

# Initialize artifact side-channel
artifact_channel = ArtifactSideChannel()

class CodeExecutionRequest(BaseModel):
    code: str
    test_cases: Optional[List[Dict]] = None
    context: Optional[Dict] = None
    enable_profiling: bool = True
    timeout: int = 30

class FeedbackLoopRequest(BaseModel):
    code: str
    test_cases: List[Dict]
    max_iterations: int = 5

@router.post("/execute")
async def execute_code(request: CodeExecutionRequest) -> Dict[str, Any]:
    """
    Execute code and capture rich artifacts
    
    This is the Artifact Side-Channel in action!
    Returns comprehensive debugging information.
    """
    try:
        # Create temporary artifact channel with custom settings
        channel = ArtifactSideChannel(
            enable_profiling=request.enable_profiling,
            timeout=request.timeout
        )
        
        result = await channel.execute_and_capture(
            request.code,
            request.test_cases,
            request.context
        )
        
        return result.to_dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute/feedback-loop")
async def execute_with_feedback_loop(request: FeedbackLoopRequest) -> Dict[str, Any]:
    """
    Execute code with self-improvement feedback loop
    
    Demonstrates LLM-directed evolution:
    1. Execute -> 2. Critique -> 3. Improve -> 4. Re-execute
    """
    try:
        result = await artifact_channel.execute_with_feedback_loop(
            request.code,
            request.test_cases,
            request.max_iterations
        )
        
        return result.to_dict()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/critique")
async def generate_code_critique(
    code: str,
    execution_result: Optional[Dict] = None
) -> Dict[str, str]:
    """
    Generate LLM critique for code
    
    Can be used standalone or with execution results
    """
    try:
        if execution_result:
            # Convert dict back to ExecutionResult
            result = ExecutionResult(
                metrics=execution_result.get('metrics', {}),
                artifacts=execution_result.get('artifacts', {}),
                status=ExecutionStatus(execution_result.get('status', 'success'))
            )
        else:
            # Execute first to get artifacts
            result = await artifact_channel.execute_and_capture(code)
        
        critique = await artifact_channel._generate_critique(code, result)
        suggestions = artifact_channel._extract_suggestions(critique)
        
        return {
            'critique': critique,
            'suggestions': suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
