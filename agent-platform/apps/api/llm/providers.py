"""
Universal LLM Provider Integration
Supports OpenAI, Anthropic, Google, xAI (Grok), and OpenRouter
"""

import os
from typing import Dict, List, Optional, Any, AsyncIterator
from abc import ABC, abstractmethod
from dataclasses import dataclass
import aiohttp
from datetime import datetime

@dataclass
class LLMResponse:
    """Standardized LLM response"""
    content: str
    model: str
    provider: str
    usage: Dict[str, int]
    cost: float
    latency_ms: float
    metadata: Dict[str, Any]

@dataclass
class LLMRequest:
    """Standardized LLM request"""
    messages: List[Dict[str, str]]
    model: str
    temperature: float = 0.7
    max_tokens: int = 2000
    stream: bool = False
    tools: Optional[List[Dict]] = None
    response_format: Optional[Dict] = None

class LLMProvider(ABC):
    """Base class for LLM providers"""
    
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Generate completion"""
        pass
    
    @abstractmethod
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Generate streaming completion"""
        pass
    
    @abstractmethod
    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """Calculate cost based on usage"""
        pass

class XAIProvider(LLMProvider):
    """xAI (Grok) provider"""
    
    PRICING = {
        "grok-2-1212": {"input": 2.00, "output": 10.00},  # Latest Grok 2 model
        "grok-2": {"input": 2.00, "output": 10.00},
        "grok-1.5": {"input": 5.00, "output": 15.00},
        "grok-1.5-vision": {"input": 5.00, "output": 15.00},
        "grok-beta": {"input": 5.00, "output": 15.00},
    }
    
    def __init__(self, api_key: str, base_url: str = "https://api.x.ai/v1"):
        super().__init__(api_key, base_url)
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Generate completion using xAI"""
        start_time = datetime.utcnow()
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        
        if request.stream:
            payload["stream"] = True
        
        async with self.session.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            data = await response.json()
        
        end_time = datetime.utcnow()
        latency_ms = (end_time - start_time).total_seconds() * 1000
        
        usage = data.get("usage", {})
        cost = self.calculate_cost(usage, request.model)
        
        return LLMResponse(
            content=data["choices"][0]["message"]["content"],
            model=request.model,
            provider="xai",
            usage=usage,
            cost=cost,
            latency_ms=latency_ms,
            metadata={"response": data}
        )
    
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Stream completion from xAI"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": True,
        }
        
        async with self.session.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.content:
                if line:
                    yield line.decode('utf-8')
    
    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """Calculate cost for xAI"""
        pricing = self.PRICING.get(model, self.PRICING["grok-4-fast"])
        input_cost = (usage.get("prompt_tokens", 0) / 1_000_000) * pricing["input"]
        output_cost = (usage.get("completion_tokens", 0) / 1_000_000) * pricing["output"]
        return input_cost + output_cost

class OpenRouterProvider(LLMProvider):
    """OpenRouter provider - unified access to many models"""
    
    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1"):
        super().__init__(api_key, base_url)
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Generate completion using OpenRouter"""
        start_time = datetime.utcnow()
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agent-platform.ai",  # Optional
            "X-Title": "AI Agent Platform",  # Optional
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        
        async with self.session.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            data = await response.json()
        
        end_time = datetime.utcnow()
        latency_ms = (end_time - start_time).total_seconds() * 1000
        
        usage = data.get("usage", {})
        # OpenRouter provides actual cost in response
        cost = data.get("usage", {}).get("total_cost", 0.0)
        
        return LLMResponse(
            content=data["choices"][0]["message"]["content"],
            model=request.model,
            provider="openrouter",
            usage=usage,
            cost=cost,
            latency_ms=latency_ms,
            metadata={"response": data}
        )
    
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Stream completion from OpenRouter"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": True,
        }
        
        async with self.session.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.content:
                if line:
                    yield line.decode('utf-8')
    
    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """OpenRouter provides cost in response, so this is fallback"""
        # Approximate costs - OpenRouter provides actual cost
        return 0.0

class OpenAIProvider(LLMProvider):
    """OpenAI provider"""
    
    PRICING = {
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gpt-4-turbo": {"input": 10.00, "output": 30.00},
        "gpt-4": {"input": 30.00, "output": 60.00},
        "gpt-3.5-turbo": {"input": 0.50, "output": 1.50},
        "o1-preview": {"input": 15.00, "output": 60.00},  # New o1 models
        "o1-mini": {"input": 3.00, "output": 12.00},
    }
    
    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1"):
        super().__init__(api_key, base_url)
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Generate completion using OpenAI"""
        start_time = datetime.utcnow()
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        
        if request.tools:
            payload["tools"] = request.tools
        if request.response_format:
            payload["response_format"] = request.response_format
        
        async with self.session.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            data = await response.json()
        
        end_time = datetime.utcnow()
        latency_ms = (end_time - start_time).total_seconds() * 1000
        
        usage = data.get("usage", {})
        cost = self.calculate_cost(usage, request.model)
        
        return LLMResponse(
            content=data["choices"][0]["message"]["content"],
            model=request.model,
            provider="openai",
            usage=usage,
            cost=cost,
            latency_ms=latency_ms,
            metadata={"response": data}
        )
    
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Stream completion from OpenAI"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": True,
        }
        
        async with self.session.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.content:
                if line:
                    yield line.decode('utf-8')
    
    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """Calculate cost for OpenAI"""
        pricing = self.PRICING.get(model, self.PRICING["gpt-4o-mini"])
        input_cost = (usage.get("prompt_tokens", 0) / 1_000_000) * pricing["input"]
        output_cost = (usage.get("completion_tokens", 0) / 1_000_000) * pricing["output"]
        return input_cost + output_cost

class AnthropicProvider(LLMProvider):
    """Anthropic provider"""
    
    PRICING = {
        "claude-3-5-sonnet-20241022": {"input": 3.00, "output": 15.00},
        "claude-3-5-haiku-20241022": {"input": 0.80, "output": 4.00},
        "claude-3-opus-20240229": {"input": 15.00, "output": 75.00},
        "claude-3-sonnet-20240229": {"input": 3.00, "output": 15.00},
        "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
    }
    
    def __init__(self, api_key: str, base_url: str = "https://api.anthropic.com"):
        super().__init__(api_key, base_url)
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Generate completion using Anthropic"""
        start_time = datetime.utcnow()
        
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
        }
        
        async with self.session.post(
            f"{self.base_url}/v1/messages",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            data = await response.json()
        
        end_time = datetime.utcnow()
        latency_ms = (end_time - start_time).total_seconds() * 1000
        
        # Anthropic usage format is different
        usage = {
            "input_tokens": data.get("usage", {}).get("input_tokens", 0),
            "output_tokens": data.get("usage", {}).get("output_tokens", 0),
        }
        cost = self.calculate_cost(usage, request.model)
        
        return LLMResponse(
            content=data["content"][0]["text"],
            model=request.model,
            provider="anthropic",
            usage=usage,
            cost=cost,
            latency_ms=latency_ms,
            metadata={"response": data}
        )
    
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Stream completion from Anthropic"""
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        
        payload = {
            "model": request.model,
            "messages": request.messages,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "stream": True,
        }
        
        async with self.session.post(
            f"{self.base_url}/v1/messages",
            headers=headers,
            json=payload
        ) as response:
            response.raise_for_status()
            async for line in response.content:
                if line:
                    yield line.decode('utf-8')
    
    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """Calculate cost for Anthropic"""
        pricing = self.PRICING.get(model, self.PRICING["claude-3-haiku-20240307"])
        input_cost = (usage.get("input_tokens", 0) / 1_000_000) * pricing["input"]
        output_cost = (usage.get("output_tokens", 0) / 1_000_000) * pricing["output"]
        return input_cost + output_cost

class GoogleProvider(LLMProvider):
    """Google (Gemini) provider"""
    
    PRICING = {
        "gemini-2.0-flash-exp": {"input": 0.00, "output": 0.00},  # Free tier
        "gemini-1.5-pro": {"input": 1.25, "output": 5.00},
        "gemini-1.5-flash": {"input": 0.075, "output": 0.30},
        "gemini-1.0-pro": {"input": 0.50, "output": 1.50},
    }
    
    def __init__(self, api_key: str, base_url: str = "https://generativelanguage.googleapis.com"):
        super().__init__(api_key, base_url)
    
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Generate completion using Google"""
        start_time = datetime.utcnow()
        
        # Convert OpenAI format to Gemini format
        gemini_messages = []
        for msg in request.messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_messages.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
        
        payload = {
            "contents": gemini_messages,
            "generationConfig": {
                "temperature": request.temperature,
                "maxOutputTokens": request.max_tokens,
            }
        }
        
        url = f"{self.base_url}/v1beta/models/{request.model}:generateContent?key={self.api_key}"
        
        async with self.session.post(url, json=payload) as response:
            response.raise_for_status()
            data = await response.json()
        
        end_time = datetime.utcnow()
        latency_ms = (end_time - start_time).total_seconds() * 1000
        
        # Estimate usage (Google doesn't provide exact token counts)
        content = data["candidates"][0]["content"]["parts"][0]["text"]
        estimated_input_tokens = len(str(request.messages)) // 4  # Rough estimate
        estimated_output_tokens = len(content) // 4
        
        usage = {
            "prompt_tokens": estimated_input_tokens,
            "completion_tokens": estimated_output_tokens,
        }
        cost = self.calculate_cost(usage, request.model)
        
        return LLMResponse(
            content=content,
            model=request.model,
            provider="google",
            usage=usage,
            cost=cost,
            latency_ms=latency_ms,
            metadata={"response": data}
        )
    
    async def stream(self, request: LLMRequest) -> AsyncIterator[str]:
        """Stream completion from Google (not fully implemented)"""
        # Google streaming is more complex, return empty for now
        return
        yield  # pragma: no cover
    
    def calculate_cost(self, usage: Dict[str, int], model: str) -> float:
        """Calculate cost for Google"""
        pricing = self.PRICING.get(model, self.PRICING["gemini-1.5-flash"])
        input_cost = (usage.get("prompt_tokens", 0) / 1_000_000) * pricing["input"]
        output_cost = (usage.get("completion_tokens", 0) / 1_000_000) * pricing["output"]
        return input_cost + output_cost

class CustomOpenAIProvider(OpenAIProvider):
    """Custom OpenAI-compatible provider (e.g., LMStudio, Ollama, OpenRouter)"""
    
    def __init__(self, api_key: str, base_url: str):
        # Don't call super().__init__ to avoid default base_url
        self.api_key = api_key
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

class LLMProviderFactory:
    """Factory for creating LLM providers"""
    
    @staticmethod
    def create(provider_type: str, api_key: Optional[str] = None, base_url: Optional[str] = None) -> LLMProvider:
        """Create provider instance"""
        if api_key is None:
            # Try to get from environment
            env_key_map = {
                "xai": "XAI_API_KEY",
                "openrouter": "OPENROUTER_API_KEY",
                "openai": "OPENAI_API_KEY",
                "anthropic": "ANTHROPIC_API_KEY",
                "google": "GOOGLE_API_KEY",
                "custom": "CUSTOM_API_KEY",
            }
            api_key = os.getenv(env_key_map.get(provider_type, ""))
        
        if not api_key:
            raise ValueError(f"API key required for provider: {provider_type}")
        
        providers = {
            "xai": XAIProvider,
            "openrouter": OpenRouterProvider,
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
            "google": GoogleProvider,
            "custom": CustomOpenAIProvider,
        }
        
        provider_class = providers.get(provider_type)
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_type}")
        
        if base_url:
            return provider_class(api_key, base_url)
        return provider_class(api_key)

# Convenience function
async def generate_completion(
    provider: str,
    model: str,
    messages: List[Dict[str, str]],
    **kwargs
) -> LLMResponse:
    """Generate completion using specified provider"""
    async with LLMProviderFactory.create(provider) as llm:
        request = LLMRequest(
            messages=messages,
            model=model,
            **kwargs
        )
        return await llm.complete(request)
