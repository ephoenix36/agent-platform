# Agent Creation Guide

**Based on:** Agent Genesis Architect framework + EvoSuite prompt patterns  
**Purpose:** Ensure consistent, high-quality agent creation  
**Target Quality:** 0.75+ optimization score

---

## Quick Reference

**Time per Agent:** 15-20 minutes for comprehensive design  
**Token Budget:** 800-1400 tokens for system prompt  
**Required Elements:** All fields in agent schema + evaluator + mutator

---

## Agent Creation Checklist

### Phase 1: Discovery & Planning (3 min)

- [ ] **Domain identified:** Sales, Marketing, Customer Success, Product, Operations, Finance, or Strategy
- [ ] **Use case defined:** Specific business problem agent solves
- [ ] **Success metrics:** 3-5 measurable KPIs
- [ ] **Similar agents reviewed:** Check for complementary agents
- [ ] **Tools identified:** Required and optional MCP tools

### Phase 2: System Prompt Design (10 min)

**Structure:**
```markdown
# Identity & Expertise
[WHO the agent is + domain authority]

# Core Capabilities
[7-10 specific skills, bulleted]

# Operational Framework

## Input Processing
[How to interpret user requests]

## Execution Protocol
[Step-by-step workflow, 4-7 phases]

## Quality Standards
[Non-negotiable output criteria]

## Edge Case Handling
[2-3 critical failure preventions]

# Output Format
[Explicit structure with example]

# Meta-Cognitive Quality Check
[5-point self-assessment before output]
```

**Principles:**
- **Token Parsimony:** 800-1400 tokens total
- **Actionability:** Every instruction must be concrete
- **Defensive Design:** Anticipate and prevent failures
- **Business Focus:** Tie to revenue or efficiency metrics

### Phase 3: User Prompt Template (2 min)

**Template:**
```
**[Agent Name] Request**

[Parameter 1]: {param1}
[Parameter 2]: {param2}
[Parameter 3]: {param3}
...

[Clear instruction on what to generate]
```

**Guidelines:**
- Use `{parameter}` syntax for variables
- 3-5 key parameters maximum
- Include inline guidance for complex params
- Keep under 300 tokens

### Phase 4: Examples (5 min - Optional but Recommended)

**Criteria:**
- Realistic business scenario
- Best-case output quality (sets optimization target)
- Domain-specific terminology
- 500-1500 tokens per example

**Structure:**
```json
{
  "input": "[Full user prompt with params filled]",
  "output": "[Complete agent response]",
  "explanation": "[Why this is excellent, what patterns shown]"
}
```

### Phase 5: Evaluator Configuration (3 min)

**Success Criteria (5-7 total):**
- 2-3 REQUIRED (weight 0.2-0.3 each, `required: true`)
- 3-4 OPTIONAL (weight 0.1-0.15 each, `required: false`)
- **Weights must sum to 1.0**

**Example:**
```json
"successCriteria": [
  {
    "name": "business_value_clarity",
    "description": "Output directly ties to measurable business metric",
    "weight": 0.3,
    "required": true
  },
  ...
]
```

**Weighted Metrics (3-4 total):**
- Align with business KPIs
- Use appropriate aggregation (mean/max/min)
- Focus on outcomes, not process

### Phase 6: Mutator Configuration (2 min)

**Strategy Selection (3-5 strategies):**

**For marketing/sales:**
- persuasion-enhancement
- clarity-boost
- cta-optimization

**For analysis:**
- depth-enhancement
- framework-integration
- insight-expansion

**For operations:**
- efficiency-tuning
- error-prevention
- automation-expansion

**Constraints (2-4 total):**
- Maintain brand voice/standards
- Preserve output format
- Respect token limits
- Ensure business metric alignment

**Mutation Rate:** 0.2-0.3 for most agents

### Phase 7: Metadata & Integration (2 min)

**Required Fields:**
```json
{
  "id": "kebab-case-name",
  "name": "Human Readable Name",
  "description": "One sentence: what it does + business value",
  "collection": "business-agents",
  "subsection": "sales|marketing|customer-success|...",
  "version": "1.0.0",
  "tags": ["domain", "use-case", "tools-used", ...], // 5-7 tags
  "difficulty": "intermediate|advanced",
  "estimatedTokens": 600-2000,
  "optimizationThreshold": 0.75-0.85,
  "author": "agent-genesis-architect",
  "createdAt": "2025-10-27T00:00:00Z"
}
```

**Relationships (Optional but Recommended):**
```json
"relationships": {
  "complements": ["agent-id-1", "agent-id-2"],
  "workflows": [
    {
      "name": "Workflow Name",
      "sequence": ["agent-1", "agent-2", "this-agent"],
      "useCase": "Business scenario"
    }
  ]
}
```

### Phase 8: Validation (2 min)

**Pre-Save Checklist:**
- [ ] System prompt < 1400 tokens
- [ ] Success criteria weights sum to 1.0
- [ ] All required JSON fields populated
- [ ] Business value explicit and measurable
- [ ] Evaluator has 2-3 required criteria
- [ ] Mutator strategies align with domain
- [ ] Edge cases addressed
- [ ] Output format unambiguous
- [ ] At least 1 example (if time allows)
- [ ] Relationships to complementary agents defined

---

## Quality Standards

### Excellence Indicators
✅ **Immediately Deployable:** No editing needed  
✅ **Self-Documenting:** Purpose and usage clear  
✅ **Optimizable:** Evaluator enables improvement  
✅ **Integrated:** Leverages existing capabilities  
✅ **Measurable:** Success quantifiable  

### Common Pitfalls to Avoid
❌ Vague instructions ("improve the output")  
❌ Missing edge cases  
❌ Over-specification (too rigid)  
❌ Under-specification (too vague)  
❌ Metric misalignment  
❌ Token bloat  
❌ Format ambiguity  

---

## EvoSuite Pattern Migration

**When converting EvoSuite prompts to agents:**

1. **Map Structure:**
   ```
   description → agent description
   Overview → systemPrompt introduction
   Required Information → userPromptTemplate parameters
   Process steps → Execution Protocol
   Output Structure → Output Format section
   Guidelines → Quality Standards
   ```

2. **Enhance for Business:**
   - Add business KPI alignment
   - Create evaluator based on success criteria
   - Design mutator for continuous improvement
   - Define complementary agents/workflows

3. **Maintain Quality:**
   - Keep detailed instructions (800-1200 tokens)
   - Preserve spec-first, TDD principles
   - Ensure defensive design
   - Add meta-cognitive checks

---

## Domain-Specific Guidelines

### Sales Agents
**Focus:** Revenue impact, conversion rates  
**KPIs:** Reply rate, meeting booking rate, deal size  
**Common Tools:** web_search, fetch_webpage  
**Threshold:** 0.75-0.82  

### Marketing Agents
**Focus:** CAC, engagement, brand awareness  
**KPIs:** CTR, conversion rate, engagement rate  
**Common Tools:** web_search, fetch_webpage  
**Threshold:** 0.75-0.80  

### Customer Success Agents
**Focus:** Retention, expansion revenue  
**KPIs:** NPS, churn rate, expansion revenue  
**Common Tools:** None (analysis-based)  
**Threshold:** 0.74-0.78  

### Product Agents
**Focus:** Adoption, user satisfaction  
**KPIs:** Feature utilization, satisfaction score  
**Common Tools:** semantic_search, grep_search  
**Threshold:** 0.75-0.80  

### Operations Agents
**Focus:** Efficiency, cost reduction  
**KPIs:** Time savings, error rate, cost reduction %  
**Common Tools:** file_search, semantic_search  
**Threshold:** 0.73-0.77  

### Finance Agents
**Focus:** Revenue, margin, forecast accuracy  
**KPIs:** Forecast accuracy, margin improvement  
**Common Tools:** None (calculation-based)  
**Threshold:** 0.76-0.82  

### Strategy Agents
**Focus:** Strategic clarity, decision quality  
**KPIs:** Decision impact, strategic alignment  
**Common Tools:** web_search, semantic_search  
**Threshold:** 0.77-0.85  

---

## File Naming & Organization

**Path Pattern:**
```
collections/business-agents/{subsection}/{agent-id}.json
```

**ID Format:** `kebab-case-descriptive-name`

**Examples:**
- `collections/business-agents/sales/linkedin-prospect-researcher.json`
- `collections/business-agents/marketing/seo-content-strategist.json`
- `collections/business-agents/customer-success/churn-risk-predictor.json`

---

## Post-Creation Actions

1. **Test via MCP:** Query agent with `get_agent` tool
2. **Verify in Collection:** Check appears in `search_agents`
3. **Update Execution Log:** Document creation in EXECUTION_LOG.md
4. **Update Task Progress:** Increment task completion percentage
5. **Plan Integration:** Note complementary agents and workflows

---

## Continuous Improvement

**After Initial Creation:**
1. Run optimization cycle (target: score > threshold)
2. Analyze evaluator feedback
3. Refine based on mutation strategies
4. Document learnings for future agents
5. Update relationships as ecosystem grows

**Quality Metrics:**
- Agent score reaches threshold within 3 optimization runs
- User adoption rate > 60%
- Output quality meets business requirements
- Integration with workflows is seamless

---

## Quick Start Template

Use this as starting point for new agents:

```json
{
  "id": "agent-name",
  "name": "Human Readable Agent Name",
  "description": "One-sentence description with business value",
  "collection": "business-agents",
  "subsection": "domain",
  "version": "1.0.0",
  "systemPrompt": "# Identity & Expertise\\n\\n...\\n",
  "userPromptTemplate": "**Request**\\n\\n{param1}\\n{param2}\\n\\nGenerate...",
  "examples": [],
  "requiredTools": [],
  "optionalTools": [],
  "toolPermissions": [],
  "evaluator": {
    "type": "llm-judge",
    "implementation": "evaluators/business/{domain}/{id}-eval.py",
    "successCriteria": [...],
    "weightedMetrics": [...]
  },
  "mutator": {
    "strategies": [...],
    "constraints": [...],
    "implementation": "mutators/business/{domain}/{id}-mutator.py",
    "mutationRate": 0.25
  },
  "optimizationHistory": [],
  "currentScore": 0,
  "optimizationThreshold": 0.75,
  "tags": [],
  "difficulty": "intermediate",
  "estimatedTokens": 1000,
  "author": "agent-genesis-architect",
  "createdAt": "2025-10-27T00:00:00Z",
  "updatedAt": "2025-10-27T00:00:00Z"
}
```

---

**Remember:** Quality + Speed through expert design. Each agent is production-ready on first draft.
