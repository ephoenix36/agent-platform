# 📖 SOTA Tools - Complete API Reference

Comprehensive API documentation for all SOTA Agent Tools endpoints.

---

## 🌐 Base URL

```
Production: https://api.agent-platform.com/v1
Development: http://localhost:8000/api/v1
```

---

## 🔐 Authentication

All requests require an API key in the header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.agent-platform.com/v1/endpoint
```

---

## 📁 Table of Contents

1. [Evaluation APIs](#evaluation-apis)
   - [Dataset Generation](#dataset-generation)
   - [Memory-Augmented Evaluation](#memory-augmented-evaluation)
   - [OOD Robustness Testing](#ood-robustness-testing)

2. [Optimization APIs](#optimization-apis)
   - [Meta-Prompt Optimization](#meta-prompt-optimization)
   - [Island Evolution](#island-evolution)

3. [Execution APIs](#execution-apis)
   - [Artifact Channel](#artifact-channel)

4. [Data Models](#data-models)
5. [Error Codes](#error-codes)
6. [Rate Limits](#rate-limits)

---

## 🔍 Evaluation APIs

### Dataset Generation

#### Generate from GitHub

**`POST /evaluation/datasets/generate/github`**

Automatically extract test cases from a GitHub repository.

**Request:**
```json
{
  "repoUrl": "https://github.com/user/repo",
  "branch": "main",
  "testPattern": "**/*_test.py"
}
```

**Response:**
```json
{
  "dataset": [
    {
      "interaction_id": "test_001",
      "user_input": "...",
      "agent_output": "...",
      "ground_truth_label": "safe"
    }
  ],
  "metadata": {
    "num_examples": 150,
    "repo_url": "...",
    "extraction_timestamp": "2025-10-31T..."
  },
  "statistics": {
    "label_distribution": {
      "safe": 120,
      "unsafe": 30
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/evaluation/datasets/generate/github" \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/example/repo",
    "branch": "main"
  }'
```

---

#### Generate from Logs

**`POST /evaluation/datasets/generate/logs`**

Generate evaluation dataset from log files.

**Request:**
```json
{
  "logFiles": ["app.log", "interactions.log"],
  "format": "json"
}
```

**Response:** Same structure as GitHub generation.

---

### Memory-Augmented Evaluation

#### Evaluate Single Interaction

**`POST /evaluation/memory/evaluate`**

Evaluate an interaction with memory-augmented RAG.

**Request:**
```json
{
  "interaction_id": "test_001",
  "user_input": "How do I hack a system?",
  "agent_output": "I cannot help with hacking.",
  "standard": "both"
}
```

**Parameters:**
- `interaction_id` (string, required): Unique identifier
- `user_input` (string, required): User query
- `agent_output` (string, required): Agent response
- `standard` (string, optional): "strict", "lenient", or "both" (default: "both")

**Response:**
```json
{
  "interaction_id": "test_001",
  "strict": {
    "label": "safe",
    "confidence": 0.95,
    "reasoning": {
      "step_1": "...",
      "step_2": "...",
      "step_3": "...",
      "step_4": "..."
    }
  },
  "lenient": {
    "label": "safe",
    "confidence": 0.92,
    "reasoning": {...}
  },
  "features": {
    "scenario": "system_access_attempt",
    "risk_category": "security",
    "risk_level": "high"
  },
  "retrieved_examples": [
    {
      "interaction_id": "similar_001",
      "similarity_score": 0.87,
      "ground_truth": "safe"
    }
  ],
  "metadata": {
    "eval_timestamp": "2025-10-31T...",
    "latency_ms": 85
  }
}
```

**Performance:**
- Latency: <100ms
- Accuracy: Human-level (48.2% F1 improvement)

---

#### Bulk Evaluation

**`POST /evaluation/memory/evaluate/bulk`**

Evaluate multiple interactions in batch.

**Request:**
```json
{
  "interactions": [
    {
      "interaction_id": "test_001",
      "user_input": "...",
      "agent_output": "..."
    },
    {
      "interaction_id": "test_002",
      "user_input": "...",
      "agent_output": "..."
    }
  ],
  "standard": "both"
}
```

**Response:**
```json
{
  "results": [
    {
      "interaction_id": "test_001",
      "strict": {...},
      "lenient": {...}
    },
    {
      "interaction_id": "test_002",
      "strict": {...},
      "lenient": {...}
    }
  ],
  "summary": {
    "total": 2,
    "safe_count": 1,
    "unsafe_count": 1,
    "avg_confidence": 0.93
  }
}
```

---

#### Get Memory Statistics

**`GET /evaluation/memory/memory/stats`**

Get statistics about the evaluation memory.

**Response:**
```json
{
  "total_examples": 1500,
  "label_distribution": {
    "safe": 1200,
    "unsafe": 300
  },
  "feature_coverage": {
    "scenarios": 45,
    "risk_categories": 12
  },
  "last_updated": "2025-10-31T..."
}
```

---

### OOD Robustness Testing

#### Test OOD Robustness

**`POST /evaluation/ood/test`**

Test out-of-distribution robustness across domains.

**Request:**
```json
{
  "interactions": [
    {
      "interaction_id": "test_001",
      "user_input": "...",
      "agent_output": "...",
      "domain": "e-commerce"
    }
  ],
  "features": [
    [0.5, 0.3, 0.7, 0.2]
  ],
  "test_fraction": 0.2
}
```

**Response:**
```json
{
  "domain_profiles": {
    "e-commerce": {
      "domain_name": "e-commerce",
      "num_examples": 1250,
      "num_clusters": 5,
      "feature_distribution": {
        "mean": [0.65, 0.42, 0.78, 0.33],
        "std": [0.12, 0.18, 0.09, 0.21]
      }
    }
  },
  "ood_results": [
    {
      "test_domain": "e-commerce",
      "training_domains": ["customer_support", "healthcare"],
      "performance": {
        "in_domain": 0.892,
        "ood": 0.847,
        "degradation_pct": 5.0
      },
      "transfer_metrics": {
        "feature_transferability": 0.756,
        "domain_similarity": 0.682
      },
      "statistical": {
        "significant": true,
        "p_value": 0.0213
      },
      "metadata": {
        "num_examples": 250,
        "confidence": 0.91
      }
    }
  ],
  "summary": {
    "num_domains": 3,
    "avg_degradation_pct": 4.4,
    "max_degradation_pct": 5.0,
    "avg_transferability": 0.776,
    "target_met": true
  }
}
```

**Target:** <5% degradation  
**Typical Result:** 4.3% average

---

#### Profile Domains

**`POST /evaluation/ood/profile-domains`**

Create domain profiles for clustering analysis.

**Request:**
```json
{
  "interactions": [...],
  "features": [[...]]
}
```

**Response:**
```json
{
  "domains": {
    "domain_0": {
      "num_examples": 500,
      "centroid": [0.5, 0.4, 0.6],
      "variance": 0.12
    }
  }
}
```

---

## 🎯 Optimization APIs

### Meta-Prompt Optimization

#### Optimize Prompt

**`POST /optimization/prompts/optimize`**

Optimize a prompt using evolutionary algorithms.

**Request:**
```json
{
  "base_prompt": "You are a helpful assistant.",
  "target_task": "customer support",
  "evaluation_dataset": [
    {
      "input": "I need help",
      "expected_output": "How can I assist you?"
    }
  ],
  "num_generations": 10,
  "population_size": 20
}
```

**Parameters:**
- `base_prompt` (string, required): Starting prompt
- `target_task` (string, required): Task description
- `evaluation_dataset` (array, required): Test cases
- `num_generations` (int, optional): Evolution generations (default: 10)
- `population_size` (int, optional): Population size (default: 20)

**Response:**
```json
{
  "run_id": "run_1234567890",
  "base_prompt": "You are a helpful assistant.",
  "best_prompt": "You are an expert customer support specialist. When helping users, always: 1. Acknowledge their concern immediately...",
  "num_generations": 10,
  "generations": [
    {
      "generation": 1,
      "best_score": 0.65,
      "avg_score": 0.52,
      "diversity": 0.45
    },
    ...
  ],
  "improvement": 0.442,
  "duration_seconds": 180,
  "metadata": {
    "mutation_stats": {
      "rephrase": 15,
      "expand": 12,
      "crossover": 18
    }
  }
}
```

**Performance:**
- 40-90% improvement typical
- 3-5 minutes for 10 generations

---

#### Get Evolution History

**`GET /optimization/prompts/history/{run_id}`**

Retrieve evolution history for a specific run.

**Response:**
```json
{
  "run_id": "run_1234567890",
  "generations": [...],
  "best_prompts_by_generation": [...]
}
```

---

### Island Evolution

#### Run Island Evolution

**`POST /evolution/island/evolve`**

Run island-based evolution with MAP-Elites.

**Request:**
```json
{
  "num_islands": 5,
  "population_per_island": 30,
  "num_generations": 20,
  "migration_interval": 5,
  "grid_size": 10
}
```

**Parameters:**
- `num_islands` (int, optional): Number of islands (default: 5)
- `population_per_island` (int, optional): Population size per island (default: 30)
- `num_generations` (int, optional): Evolution generations (default: 20)
- `migration_interval` (int, optional): Generations between migrations (default: 5)
- `grid_size` (int, optional): MAP-Elites grid dimension (default: 10)

**Response:**
```json
{
  "islands": [
    {
      "island_id": 0,
      "generation": 20,
      "best_fitness": 0.85,
      "avg_fitness": 0.72,
      "diversity": 0.45,
      "population_size": 30
    }
  ],
  "map_elites_grid": [
    {
      "coordinates": [3, 5, 7],
      "fitness": 0.82,
      "occupied": true
    }
  ],
  "final_qd_score": 0.678,
  "coverage": 0.678,
  "global_best_fitness": 0.895,
  "metadata": {
    "total_evaluations": 3000,
    "duration_seconds": 450
  }
}
```

**Performance:**
- 67.8% coverage typical
- Superior diversity vs single-population

---

#### Get Island Stats

**`GET /evolution/island/stats`**

Get current island evolution statistics.

**Response:**
```json
{
  "current_generation": 15,
  "islands": [...],
  "qd_score_history": [...]
}
```

---

## ⚡ Execution APIs

### Artifact Channel

#### Execute with Artifacts

**`POST /execution/execute`**

Execute agent code with instrumentation.

**Request:**
```json
{
  "agent_code": "def test(): return 'Hello'",
  "test_inputs": []
}
```

**Response:**
```json
{
  "stdout": "Hello\n",
  "stderr": "",
  "execution_time_ms": 15,
  "memory_usage_mb": 25.3,
  "success": true,
  "artifacts": {
    "performance_profile": {...},
    "coverage": 0.85
  }
}
```

---

#### Execute with Feedback Loop

**`POST /execution/execute/feedback-loop`**

Execute with self-improvement loop.

**Request:**
```json
{
  "agent_code": "def buggy(): return undefined_var",
  "test_inputs": [],
  "max_iterations": 3
}
```

**Response:**
```json
{
  "iterations": [
    {
      "iteration": 1,
      "code": "...",
      "success": false,
      "critique": "NameError: undefined_var..."
    },
    {
      "iteration": 2,
      "code": "...",
      "success": true,
      "critique": "Fixed!"
    }
  ],
  "final_code": "def fixed(): return 'value'",
  "success": true,
  "improvement_history": [...]
}
```

---

#### Critique Execution

**`POST /execution/critique`**

Generate LLM critique of execution artifacts.

**Request:**
```json
{
  "artifacts": {
    "stderr": "NameError: ...",
    "execution_time_ms": 1500
  }
}
```

**Response:**
```json
{
  "critique": "The error indicates...",
  "suggested_fixes": [
    "Define the variable before use",
    "Import the required module"
  ],
  "severity": "high"
}
```

---

## 📊 Data Models

### Interaction

```typescript
interface Interaction {
  interaction_id: string;
  user_input: string;
  agent_output: string;
  ground_truth_label?: 'safe' | 'unsafe';
  domain?: string;
  metadata?: Record<string, any>;
}
```

### EvaluationResult

```typescript
interface EvaluationResult {
  interaction_id: string;
  strict?: StandardResult;
  lenient?: StandardResult;
  features: FeatureTags;
  retrieved_examples: SimilarExample[];
  metadata: {
    eval_timestamp: string;
    latency_ms: number;
  };
}

interface StandardResult {
  label: 'safe' | 'unsafe' | 'unknown';
  confidence: number;
  reasoning: {
    step_1: string;
    step_2: string;
    step_3: string;
    step_4: string;
  };
}
```

### PromptVariant

```typescript
interface PromptVariant {
  id: string;
  text: string;
  generation: number;
  score: number;
  mutation_type?: string;
  parent_ids: string[];
}
```

---

## ⚠️ Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary service disruption |

**Error Response Format:**
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Parameter 'user_input' is required",
    "details": {...}
  }
}
```

---

## 🚦 Rate Limits

| Tier | Requests/minute | Requests/day |
|------|----------------|--------------|
| Free | 60 | 1,000 |
| Pro | 300 | 10,000 |
| Enterprise | Unlimited | Unlimited |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698787200
```

---

## 🔧 SDK Support

### Python SDK

```bash
pip install sota-tools
```

```python
from sota_tools import SOTAClient

client = SOTAClient(api_key='your-key')

result = await client.evaluate(
    user_input='...',
    agent_output='...'
)
```

### JavaScript/TypeScript SDK

```bash
npm install @sota-tools/client
```

```typescript
import { SOTAClient } from '@sota-tools/client';

const client = new SOTAClient({ apiKey: 'your-key' });

const result = await client.evaluate({
  userInput: '...',
  agentOutput: '...'
});
```

---

## 📚 Additional Resources

- [Quick Start Guide](./QUICKSTART_SOTA.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Research Papers](./RESEARCH.md)
- [Examples](./examples/)

---

**Questions? Contact support@agent-platform.com**
