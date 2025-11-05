#!/usr/bin/env node

/**
 * Advisors MCP Server
 * 
 * Provides AI advisor agents for quality assurance and strategic guidance
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { getAdvisor, getAllAdvisors } from './advisors.js';
import type { AdvisorContext, AdvisorFeedback, QualityGateResult } from './types.js';

// Create server instance
const server = new Server(
  {
    name: 'advisors-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Simulate advisor consultation
 * (In production, this would call an actual LLM)
 */
function consultAdvisor(advisorType: string, context: AdvisorContext): AdvisorFeedback {
  const advisor = getAdvisor(advisorType);
  if (!advisor) {
    throw new Error(`Unknown advisor: ${advisorType}`);
  }

  // Generate prompt
  const systemPrompt = advisor.promptTemplate.systemPrompt;
  const userPrompt = advisor.promptTemplate.userPromptTemplate(context);

  // In production: call LLM with these prompts
  // For now: return structured feedback based on advisor type
  
  return generateAdvisorFeedback(advisor.type, context);
}

/**
 * Generate advisor feedback
 * (Placeholder - would be LLM-generated in production)
 */
function generateAdvisorFeedback(advisorType: string, context: AdvisorContext): AdvisorFeedback {
  const baseInsights = {
    skeptic: [
      `Assumption check: ${context.assumptions?.[0] || 'What unstated assumptions exist?'}`,
      'Edge case: What happens under extreme load or failure conditions?',
      'Dependency analysis: What external services could fail?',
    ],
    'pattern-hunter': [
      'Pattern identified: Similar solutions exist in other domains',
      'Abstraction opportunity: Could extract reusable component',
      'Anti-pattern warning: Check for premature optimization',
    ],
    mirror: [
      'Intention vs. implementation: Verify alignment with stated goals',
      context.intention && context.implementation 
        ? 'Gap detected: Implementation may drift from original intention'
        : 'Recommendation: Clearly document both intention and implementation',
      'Scope check: Ensure we\'re solving the right problem',
    ],
    oracle: [
      '2nd order effect: Success creates scaling challenges',
      'Strategic trade-off: Speed vs. quality vs. cost',
      '10x solution: Consider fundamentally different approach',
    ],
    interrogator: [
      'Unasked question: What are we optimizing for?',
      'Uncomfortable truth: Are we solving symptoms or root causes?',
      'Alternative framing: Could this be approached differently?',
    ],
    validator: [
      'Quality check: Code follows best practices',
      'Completeness: All requirements addressed',
      'Customer readiness: UX tested and validated',
    ],
    outsider: [
      'Complexity check: Is this as simple as it could be?',
      'Jargon alert: Terminology may confuse non-experts',
      'Cross-domain insight: Similar problems solved in other fields',
    ],
  };

  const baseConcerns = {
    skeptic: [
      'Missing error handling for edge cases',
      'Untested assumptions about user behavior',
    ],
    'pattern-hunter': [
      'Code duplication detected in multiple locations',
    ],
    mirror: [
      'Feature creep: Added functionality not in original spec',
    ],
    oracle: [
      'Long-term maintainability: Technical debt accumulating',
    ],
    interrogator: [
      'Success metrics undefined: How do we know if this works?',
    ],
    validator: [
      'Missing tests for critical paths',
      'Documentation incomplete',
    ],
    outsider: [
      'User confusion: Interface assumes expert knowledge',
    ],
  };

  const baseQuestions = {
    skeptic: [
      'What happens if this assumption is wrong?',
      'Have we tested failure modes?',
    ],
    'pattern-hunter': [
      'Where else do we solve this problem?',
      'Can this be abstracted?',
    ],
    mirror: [
      'Is this what we said we\'d build?',
      'Are we solving the right problem?',
    ],
    oracle: [
      'What does success look like in 6 months?',
      'What strategic options does this enable/close?',
    ],
    interrogator: [
      'Why this approach and not others?',
      'What aren\'t we considering?',
    ],
    validator: [
      'Is this ready for customers?',
      'What could go wrong in production?',
    ],
    outsider: [
      'Would a beginner understand this?',
      'Is all this complexity necessary?',
    ],
  };

  const baseRecommendations = {
    skeptic: [
      'Add error handling for API failures',
      'Test edge cases systematically',
      'Document assumptions explicitly',
    ],
    'pattern-hunter': [
      'Extract common logic into shared utility',
      'Create abstraction layer for similar operations',
    ],
    mirror: [
      'Review original requirements',
      'Align implementation with stated goals',
    ],
    oracle: [
      'Create long-term roadmap',
      'Plan for scalability from day 1',
    ],
    interrogator: [
      'Define clear success metrics',
      'Explore alternative approaches',
    ],
    validator: [
      'Complete test coverage for critical paths',
      'Conduct usability testing',
      'Update documentation',
    ],
    outsider: [
      'Simplify user interface',
      'Reduce jargon in documentation',
      'Test with non-expert users',
    ],
  };

  const severity = advisorType === 'validator' || advisorType === 'skeptic' 
    ? 'warning' 
    : 'info';

  return {
    advisor: advisorType as any,
    insights: baseInsights[advisorType as keyof typeof baseInsights] || [],
    concerns: baseConcerns[advisorType as keyof typeof baseConcerns] || [],
    questions: baseQuestions[advisorType as keyof typeof baseQuestions] || [],
    recommendations: baseRecommendations[advisorType as keyof typeof baseRecommendations] || [],
    severity,
    confidence: 0.75,
  };
}

/**
 * Run quality gate workflow
 */
function runQualityGate(context: AdvisorContext): QualityGateResult {
  const advisors = getAllAdvisors();
  const feedback: AdvisorFeedback[] = [];
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  // Consult each advisor
  for (const advisor of advisors) {
    const advisorFeedback = consultAdvisor(advisor.type, context);
    feedback.push(advisorFeedback);

    // Collect critical issues
    if (advisorFeedback.severity === 'critical') {
      criticalIssues.push(...advisorFeedback.concerns);
    } else if (advisorFeedback.severity === 'warning') {
      warnings.push(...advisorFeedback.concerns);
    }
  }

  // Calculate quality score
  const totalConcerns = feedback.reduce((sum, f) => sum + f.concerns.length, 0);
  const qualityScore = Math.max(0, 100 - (totalConcerns * 5));

  const passed = criticalIssues.length === 0 && qualityScore >= 70;

  const summary = passed
    ? `Quality gate PASSED. Score: ${qualityScore}/100. ${warnings.length} warnings to address.`
    : `Quality gate FAILED. ${criticalIssues.length} critical issues. Score: ${qualityScore}/100.`;

  return {
    passed,
    advisorFeedback: feedback,
    criticalIssues,
    warnings,
    qualityScore,
    summary,
  };
}

/**
 * Define available tools
 */
const tools: Tool[] = [
  {
    name: 'consult_advisor',
    description: 'Consult a specific AI advisor for guidance and feedback',
    inputSchema: {
      type: 'object',
      properties: {
        advisor: {
          type: 'string',
          enum: ['skeptic', 'pattern-hunter', 'mirror', 'oracle', 'interrogator', 'validator', 'outsider'],
          description: 'Which advisor to consult',
        },
        task: {
          type: 'string',
          description: 'The task or problem being worked on',
        },
        intention: {
          type: 'string',
          description: 'What you intend to accomplish (optional)',
        },
        implementation: {
          type: 'string',
          description: 'What you have actually implemented (optional)',
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key assumptions being made (optional)',
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Constraints being worked within (optional)',
        },
        stage: {
          type: 'string',
          enum: ['planning', 'executing', 'reviewing', 'delivering'],
          description: 'Current stage of work (optional)',
        },
      },
      required: ['advisor', 'task'],
    },
  },
  {
    name: 'run_quality_gate',
    description: 'Run comprehensive quality gate with all advisors before customer delivery',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'What has been built and needs validation',
        },
        intention: {
          type: 'string',
          description: 'Original goals and requirements',
        },
        implementation: {
          type: 'string',
          description: 'What was actually implemented',
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key assumptions made during development',
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Constraints that were worked within',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'list_advisors',
    description: 'Get information about all available advisors and when to use them',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_advisor_guide',
    description: 'Get detailed guidance on which advisor to use for specific situations',
    inputSchema: {
      type: 'object',
      properties: {
        situation: {
          type: 'string',
          description: 'Description of the situation or problem',
        },
      },
      required: ['situation'],
    },
  },
];

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Missing arguments');
  }

  try {
    if (name === 'consult_advisor') {
      const context: AdvisorContext = {
        task: args.task as string,
        intention: args.intention as string | undefined,
        implementation: args.implementation as string | undefined,
        assumptions: args.assumptions as string[] | undefined,
        constraints: args.constraints as string[] | undefined,
        stage: args.stage as any,
      };

      const feedback = consultAdvisor(args.advisor as string, context);
      const advisor = getAdvisor(args.advisor as string);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              advisor: advisor?.name,
              role: advisor?.role,
              feedback,
              prompt_used: {
                system: advisor?.promptTemplate.systemPrompt,
                user: advisor?.promptTemplate.userPromptTemplate(context),
              },
            }, null, 2),
          },
        ],
      };
    }

    if (name === 'run_quality_gate') {
      const context: AdvisorContext = {
        task: args.task as string,
        intention: args.intention as string | undefined,
        implementation: args.implementation as string | undefined,
        assumptions: args.assumptions as string[] | undefined,
        constraints: args.constraints as string[] | undefined,
        stage: 'delivering',
      };

      const result = runQualityGate(context);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'list_advisors') {
      const advisors = getAllAdvisors();
      const advisorList = advisors.map(a => ({
        type: a.type,
        name: a.name,
        role: a.role,
        capabilities: a.capabilities,
        when_to_invoke: a.whenToInvoke,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(advisorList, null, 2),
          },
        ],
      };
    }

    if (name === 'get_advisor_guide') {
      const situation = (args.situation as string).toLowerCase();
      const recommendations: string[] = [];

      if (situation.includes('assume') || situation.includes('decision')) {
        recommendations.push('skeptic - Challenge assumptions before deciding');
      }
      if (situation.includes('pattern') || situation.includes('repeat') || situation.includes('similar')) {
        recommendations.push('pattern-hunter - Find patterns and abstractions');
      }
      if (situation.includes('stuck') || situation.includes('intention') || situation.includes('gap')) {
        recommendations.push('mirror - Reflect back reality vs. perception');
      }
      if (situation.includes('strategy') || situation.includes('long-term') || situation.includes('trade-off')) {
        recommendations.push('oracle - Get strategic guidance');
      }
      if (situation.includes('question') || situation.includes('missing') || situation.includes('unknown')) {
        recommendations.push('interrogator - Ask unasked questions');
      }
      if (situation.includes('ready') || situation.includes('quality') || situation.includes('delivery') || situation.includes('customer')) {
        recommendations.push('validator - Validate quality and readiness');
      }
      if (situation.includes('complex') || situation.includes('confus') || situation.includes('explain')) {
        recommendations.push('outsider - Get fresh perspective');
      }

      if (recommendations.length === 0) {
        recommendations.push('Consider consulting multiple advisors for comprehensive guidance');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              situation: args.situation,
              recommended_advisors: recommendations,
              tip: 'For major decisions or deliveries, run the quality_gate to consult all advisors',
            }, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Advisors MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
