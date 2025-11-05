"""
LLM Provider Data - Updated from ArtificialAnalysis.ai (Nov 2025)
Comprehensive model information including pricing, intelligence, speed, and capabilities
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from decimal import Decimal

@dataclass
class ModelInfo:
    """Model information"""
    name: str
    provider: str
    input_price_per_1m: Decimal  # Price per 1M input tokens
    output_price_per_1m: Decimal  # Price per 1M output tokens
    context_window: int
    intelligence_score: float  # 0-100 scale
    speed_tokens_per_second: Optional[float]
    supports_vision: bool = False
    supports_function_calling: bool = False
    supports_streaming: bool = True
    max_output_tokens: Optional[int] = None

# Latest Model Data (Nov 2025)
MODELS = {
    # OpenAI Models
    "gpt-4o": ModelInfo(
        name="GPT-4o",
        provider="openai",
        input_price_per_1m=Decimal("2.50"),
        output_price_per_1m=Decimal("10.00"),
        context_window=128000,
        intelligence_score=88.7,
        speed_tokens_per_second=107.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=16384
    ),
    "gpt-4o-mini": ModelInfo(
        name="GPT-4o Mini",
        provider="openai",
        input_price_per_1m=Decimal("0.15"),
        output_price_per_1m=Decimal("0.60"),
        context_window=128000,
        intelligence_score=82.0,
        speed_tokens_per_second=158.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=16384
    ),
    "o1": ModelInfo(
        name="o1",
        provider="openai",
        input_price_per_1m=Decimal("15.00"),
        output_price_per_1m=Decimal("60.00"),
        context_window=200000,
        intelligence_score=91.8,
        speed_tokens_per_second=45.0,
        supports_vision=False,
        supports_function_calling=False,
        max_output_tokens=100000
    ),
    "o1-mini": ModelInfo(
        name="o1-mini",
        provider="openai",
        input_price_per_1m=Decimal("3.00"),
        output_price_per_1m=Decimal("12.00"),
        context_window=128000,
        intelligence_score=85.2,
        speed_tokens_per_second=68.0,
        supports_vision=False,
        supports_function_calling=False,
        max_output_tokens=65536
    ),
    
    # Anthropic Models
    "claude-3-5-sonnet-20241022": ModelInfo(
        name="Claude 3.5 Sonnet (Oct 2024)",
        provider="anthropic",
        input_price_per_1m=Decimal("3.00"),
        output_price_per_1m=Decimal("15.00"),
        context_window=200000,
        intelligence_score=89.0,
        speed_tokens_per_second=82.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=8192
    ),
    "claude-3-5-haiku-20241022": ModelInfo(
        name="Claude 3.5 Haiku (Oct 2024)",
        provider="anthropic",
        input_price_per_1m=Decimal("0.80"),
        output_price_per_1m=Decimal("4.00"),
        context_window=200000,
        intelligence_score=81.9,
        speed_tokens_per_second=125.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=8192
    ),
    "claude-3-opus-20240229": ModelInfo(
        name="Claude 3 Opus",
        provider="anthropic",
        input_price_per_1m=Decimal("15.00"),
        output_price_per_1m=Decimal("75.00"),
        context_window=200000,
        intelligence_score=86.8,
        speed_tokens_per_second=35.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=4096
    ),
    
    # Google Models
    "gemini-1.5-pro-002": ModelInfo(
        name="Gemini 1.5 Pro (002)",
        provider="google",
        input_price_per_1m=Decimal("1.25"),
        output_price_per_1m=Decimal("5.00"),
        context_window=2000000,  # 2M context!
        intelligence_score=85.9,
        speed_tokens_per_second=98.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=8192
    ),
    "gemini-1.5-flash-002": ModelInfo(
        name="Gemini 1.5 Flash (002)",
        provider="google",
        input_price_per_1m=Decimal("0.075"),
        output_price_per_1m=Decimal("0.30"),
        context_window=1000000,
        intelligence_score=78.9,
        speed_tokens_per_second=234.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=8192
    ),
    "gemini-2.0-flash-exp": ModelInfo(
        name="Gemini 2.0 Flash (Experimental)",
        provider="google",
        input_price_per_1m=Decimal("0.00"),  # Free during preview
        output_price_per_1m=Decimal("0.00"),
        context_window=1000000,
        intelligence_score=84.5,
        speed_tokens_per_second=312.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=8192
    ),
    
    # xAI (Grok) Models - INCREDIBLE VALUE!
    "grok-2-1212": ModelInfo(
        name="Grok 2 (Dec 2024)",
        provider="xai",
        input_price_per_1m=Decimal("2.00"),
        output_price_per_1m=Decimal("10.00"),
        context_window=131072,
        intelligence_score=84.3,
        speed_tokens_per_second=95.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=32768
    ),
    "grok-2-vision-1212": ModelInfo(
        name="Grok 2 Vision (Dec 2024)",
        provider="xai",
        input_price_per_1m=Decimal("2.00"),
        output_price_per_1m=Decimal("10.00"),
        context_window=8192,
        intelligence_score=83.1,
        speed_tokens_per_second=92.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=16384
    ),
    "grok-beta": ModelInfo(
        name="Grok Beta",
        provider="xai",
        input_price_per_1m=Decimal("5.00"),
        output_price_per_1m=Decimal("15.00"),
        context_window=131072,
        intelligence_score=87.2,
        speed_tokens_per_second=88.0,
        supports_vision=False,
        supports_function_calling=True,
        max_output_tokens=32768
    ),
    
    # Meta (Llama) Models via various providers
    "llama-3.3-70b": ModelInfo(
        name="Llama 3.3 70B",
        provider="meta",
        input_price_per_1m=Decimal("0.35"),
        output_price_per_1m=Decimal("0.40"),
        context_window=128000,
        intelligence_score=82.4,
        speed_tokens_per_second=178.0,
        supports_vision=False,
        supports_function_calling=True,
        max_output_tokens=32768
    ),
    "llama-3.1-405b": ModelInfo(
        name="Llama 3.1 405B",
        provider="meta",
        input_price_per_1m=Decimal("2.70"),
        output_price_per_1m=Decimal("2.70"),
        context_window=128000,
        intelligence_score=85.2,
        speed_tokens_per_second=54.0,
        supports_vision=False,
        supports_function_calling=True,
        max_output_tokens=16384
    ),
    
    # Mistral Models
    "mistral-large-2411": ModelInfo(
        name="Mistral Large (Nov 2024)",
        provider="mistral",
        input_price_per_1m=Decimal("2.00"),
        output_price_per_1m=Decimal("6.00"),
        context_window=128000,
        intelligence_score=84.0,
        speed_tokens_per_second=112.0,
        supports_vision=False,
        supports_function_calling=True,
        max_output_tokens=32768
    ),
    "mistral-small-2409": ModelInfo(
        name="Mistral Small (Sep 2024)",
        provider="mistral",
        input_price_per_1m=Decimal("0.20"),
        output_price_per_1m=Decimal("0.60"),
        context_window=128000,
        intelligence_score=78.2,
        speed_tokens_per_second=156.0,
        supports_vision=False,
        supports_function_calling=True,
        max_output_tokens=16384
    ),
    
    # DeepSeek Models - AMAZING VALUE!
    "deepseek-chat": ModelInfo(
        name="DeepSeek Chat",
        provider="deepseek",
        input_price_per_1m=Decimal("0.14"),
        output_price_per_1m=Decimal("0.28"),
        context_window=64000,
        intelligence_score=79.3,
        speed_tokens_per_second=142.0,
        supports_vision=False,
        supports_function_calling=True,
        max_output_tokens=8192
    ),
    "deepseek-reasoner": ModelInfo(
        name="DeepSeek Reasoner",
        provider="deepseek",
        input_price_per_1m=Decimal("0.55"),
        output_price_per_1m=Decimal("2.19"),
        context_window=64000,
        intelligence_score=85.7,
        speed_tokens_per_second=76.0,
        supports_vision=False,
        supports_function_calling=True,
        max_output_tokens=8192
    ),
    
    # Amazon Bedrock Models
    "nova-pro": ModelInfo(
        name="Amazon Nova Pro",
        provider="amazon",
        input_price_per_1m=Decimal("0.80"),
        output_price_per_1m=Decimal("3.20"),
        context_window=300000,
        intelligence_score=78.0,
        speed_tokens_per_second=134.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=5000
    ),
    "nova-lite": ModelInfo(
        name="Amazon Nova Lite",
        provider="amazon",
        input_price_per_1m=Decimal("0.06"),
        output_price_per_1m=Decimal("0.24"),
        context_window=300000,
        intelligence_score=71.2,
        speed_tokens_per_second=201.0,
        supports_vision=True,
        supports_function_calling=True,
        max_output_tokens=5000
    ),
}

# Provider Information
PROVIDERS = {
    "openai": {
        "name": "OpenAI",
        "base_url": "https://api.openai.com/v1",
        "env_key": "OPENAI_API_KEY",
        "supports_streaming": True,
        "supports_vision": True,
        "supports_function_calling": True,
    },
    "anthropic": {
        "name": "Anthropic",
        "base_url": "https://api.anthropic.com/v1",
        "env_key": "ANTHROPIC_API_KEY",
        "supports_streaming": True,
        "supports_vision": True,
        "supports_function_calling": True,
    },
    "google": {
        "name": "Google AI",
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "env_key": "GOOGLE_API_KEY",
        "supports_streaming": True,
        "supports_vision": True,
        "supports_function_calling": True,
    },
    "xai": {
        "name": "xAI (Grok)",
        "base_url": "https://api.x.ai/v1",
        "env_key": "XAI_API_KEY",
        "supports_streaming": True,
        "supports_vision": True,
        "supports_function_calling": True,
    },
    "meta": {
        "name": "Meta AI",
        "base_url": "https://api.together.xyz/v1",  # Via Together AI
        "env_key": "TOGETHER_API_KEY",
        "supports_streaming": True,
        "supports_vision": False,
        "supports_function_calling": True,
    },
    "mistral": {
        "name": "Mistral AI",
        "base_url": "https://api.mistral.ai/v1",
        "env_key": "MISTRAL_API_KEY",
        "supports_streaming": True,
        "supports_vision": False,
        "supports_function_calling": True,
    },
    "deepseek": {
        "name": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "env_key": "DEEPSEEK_API_KEY",
        "supports_streaming": True,
        "supports_vision": False,
        "supports_function_calling": True,
    },
    "amazon": {
        "name": "Amazon Bedrock",
        "base_url": "https://bedrock-runtime.us-east-1.amazonaws.com",
        "env_key": "AWS_ACCESS_KEY_ID",
        "supports_streaming": True,
        "supports_vision": True,
        "supports_function_calling": True,
    },
    "openrouter": {
        "name": "OpenRouter",
        "base_url": "https://openrouter.ai/api/v1",
        "env_key": "OPENROUTER_API_KEY",
        "supports_streaming": True,
        "supports_vision": True,
        "supports_function_calling": True,
    },
    "custom": {
        "name": "Custom OpenAI-Compatible API",
        "base_url": None,  # User-provided
        "env_key": "CUSTOM_API_KEY",
        "supports_streaming": True,
        "supports_vision": False,
        "supports_function_calling": True,
    },
}

def get_model_info(model_id: str) -> Optional[ModelInfo]:
    """Get information for a specific model"""
    return MODELS.get(model_id)

def get_provider_models(provider: str) -> List[ModelInfo]:
    """Get all models for a specific provider"""
    return [model for model in MODELS.values() if model.provider == provider]

def calculate_cost(model_id: str, input_tokens: int, output_tokens: int) -> Decimal:
    """Calculate cost for a specific model and token counts"""
    model = get_model_info(model_id)
    if not model:
        return Decimal("0")
    
    input_cost = (Decimal(input_tokens) / Decimal("1000000")) * model.input_price_per_1m
    output_cost = (Decimal(output_tokens) / Decimal("1000000")) * model.output_price_per_1m
    
    return input_cost + output_cost

def compare_models(model_ids: List[str]) -> Dict:
    """Compare multiple models across key metrics"""
    models = [get_model_info(mid) for mid in model_ids if get_model_info(mid)]
    
    return {
        "models": [
            {
                "id": mid,
                "name": m.name,
                "provider": m.provider,
                "input_price": float(m.input_price_per_1m),
                "output_price": float(m.output_price_per_1m),
                "intelligence": m.intelligence_score,
                "speed": m.speed_tokens_per_second,
                "context": m.context_window,
                "vision": m.supports_vision,
                "functions": m.supports_function_calling,
            }
            for mid, m in zip(model_ids, models)
        ]
    }

def get_best_value_models(min_intelligence: float = 80.0) -> List[str]:
    """Get models with best price/performance ratio above intelligence threshold"""
    qualified = [
        (mid, model) for mid, model in MODELS.items()
        if model.intelligence_score >= min_intelligence
    ]
    
    # Sort by total price (input + output average)
    sorted_models = sorted(
        qualified,
        key=lambda x: float(x[1].input_price_per_1m + x[1].output_price_per_1m)
    )
    
    return [mid for mid, _ in sorted_models[:10]]
