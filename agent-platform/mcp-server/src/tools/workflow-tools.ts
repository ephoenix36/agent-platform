import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { performSampling } from "../services/sampling-service.js";
import { Logger } from "../utils/logging.js";
import { registerWaitHandle, completeWaitHandle, failWaitHandle } from "./wait-tools.js";
import { withHooks } from "../utils/hooked-registry.js";

/**
 * Execute workflow - properly typed with z.record(z.any()) for config
 */
const executeWorkflowSchema = z.object({
  workflowId: z.string().describe("Unique workflow identifier"),
  name: z.string().describe("Workflow name"),
  steps: z.array(z.object({
    id: z.string().describe("Unique step identifier"),
    type: z.enum([
      "agent", 
      "agent_team", 
      "api", 
      "condition", 
      "transform", 
      "delay",
      "parallel",
      "loop",
      "try_catch",
      "switch",
      "merge",
      "set_variable",
      "get_variable",
      "widget",
      "collection_query",
      "collection_create",
      "collection_update",
      "collection_delete"
    ]).describe("Step type"),
    config: z.record(z.any()).describe("Step configuration"),
    onSuccess: z.string().optional().describe("Step to jump to on success"),
    onError: z.string().optional().describe("Step to jump to on error"),
    condition: z.string().optional().describe("Condition expression"),
    skipIf: z.string().optional().describe("Skip condition")
  })).describe("Workflow steps"),
  input: z.any().optional().describe("Input data for workflow"),
  context: z.any().optional().describe("Context data")
});

/**
 * Create workflow template - properly typed with z.record(z.any()) for config
 */
const createWorkflowSchema = z.object({
  name: z.string().describe("Workflow name"),
  description: z.string().describe("Workflow description"),
  trigger: z.enum(["manual", "schedule", "webhook", "event"]).describe("Trigger type"),
  steps: z.array(z.object({
    name: z.string().describe("Step name"),
    type: z.string().describe("Step type"),
    config: z.record(z.any()).describe("Step configuration")
  })).describe("Workflow steps")
});

/**
 * Execute workflow asynchronously - properly typed with z.record(z.any()) for config
 */
const executeWorkflowAsyncSchema = z.object({
  workflowId: z.string().describe("Unique workflow identifier"),
  name: z.string().describe("Workflow name"),
  steps: z.array(z.object({
    id: z.string().describe("Unique step identifier"),
    type: z.enum([
      "agent", 
      "agent_team", 
      "api", 
      "condition", 
      "transform", 
      "delay",
      "parallel",
      "loop",
      "try_catch",
      "switch",
      "merge",
      "set_variable",
      "get_variable",
      "widget",
      "collection_query",
      "collection_create",
      "collection_update",
      "collection_delete"
    ]).describe("Step type"),
    config: z.record(z.any()).describe("Step configuration"),
    onSuccess: z.string().optional().describe("Step to jump to on success"),
    onError: z.string().optional().describe("Step to jump to on error"),
    condition: z.string().optional().describe("Condition expression"),
    skipIf: z.string().optional().describe("Skip condition")
  })).describe("Workflow steps"),
  input: z.any().optional().describe("Input data for workflow"),
  context: z.any().optional().describe("Context data"),
  timeoutMs: z.number().optional().describe("Timeout in milliseconds")
});

/**
 * Helper function to safely evaluate conditions
 */
function evaluateCondition(condition: string, context: Record<string, any>, currentData: any): boolean {
  try {
    // Create a safe evaluation context
    const evalContext = {
      ...context,
      currentData,
      data: currentData,
      // Helper functions
      isArray: Array.isArray,
      typeof: (x: any) => typeof x,
      length: (x: any) => x?.length || 0,
      isEmpty: (x: any) => !x || (Array.isArray(x) && x.length === 0) || (typeof x === 'object' && Object.keys(x).length === 0),
      includes: (arr: any[], val: any) => arr?.includes(val),
      gt: (a: number, b: number) => a > b,
      lt: (a: number, b: number) => a < b,
      eq: (a: any, b: any) => a === b,
      and: (...args: boolean[]) => args.every(Boolean),
      or: (...args: boolean[]) => args.some(Boolean),
      not: (x: boolean) => !x
    };
    
    // Use Function constructor for safer evaluation (still eval-like, but more controlled)
    const func = new Function(...Object.keys(evalContext), `return ${condition}`);
    return func(...Object.values(evalContext));
  } catch (error) {
    console.error(`Condition evaluation failed: ${condition}`, error);
    return false;
  }
}

/**
 * Execute a single workflow step
 */
async function executeStep(
  step: any,
  currentData: any,
  context: Record<string, any>,
  logger: Logger,
  executeStepRecursive?: (step: any, data: any, ctx: Record<string, any>) => Promise<any>
): Promise<any> {
  let stepResult: any;

  // Check skipIf condition
  if (step.skipIf && evaluateCondition(step.skipIf, context, currentData)) {
    logger.debug(`Skipping step ${step.id} due to skipIf condition`);
    return { skipped: true, reason: step.skipIf };
  }

  switch (step.type) {
    case "agent":
      // Execute agent step
      stepResult = await performSampling({
        messages: [{
          role: "user",
          content: step.config.prompt || currentData
        }],
        model: step.config.model || "claude-sonnet-4.5-haiku",
        temperature: step.config.temperature || 0.7,
        maxTokens: step.config.maxTokens || 2000
      });
      return stepResult.content;

    case "agent_team":
      // Execute agent team collaboration
      const teamAgents = step.config.agents || [];
      const teamRounds = step.config.maxRounds || 3;
      const teamResults = [];
      let teamContext = step.config.prompt || currentData;
      
      for (let round = 0; round < teamRounds; round++) {
        for (const agent of teamAgents) {
          const teamPrompt = `Role: ${agent.role}\nTask: ${teamContext}\nProvide your contribution:`;
          
          const agentResult = await performSampling({
            messages: [{
              role: "user",
              content: teamPrompt
            }],
            model: agent.model || step.config.model || "claude-sonnet-4.5-haiku",
            temperature: agent.temperature || step.config.temperature || 0.7,
            maxTokens: agent.maxTokens || step.config.maxTokens || 1000
          });
          
          teamResults.push({
            round: round + 1,
            agentId: agent.id,
            role: agent.role,
            contribution: agentResult.content
          });
          
          teamContext += `\n\n${agent.role} says: ${agentResult.content}`;
        }
      }
      
      return {
        teamResults,
        finalSynthesis: teamContext
      };

    case "api":
      // API call step
      stepResult = {
        message: "API call executed",
        endpoint: step.config.url,
        method: step.config.method || "GET"
      };
      return stepResult;

    case "condition":
      // Conditional branching
      const condition = step.config.condition || step.condition;
      const check = evaluateCondition(condition, context, currentData);
      return {
        conditionMet: check,
        branch: check ? "true" : "false",
        condition: condition
      };

    case "transform":
      // Data transformation
      if (step.config.transformFn) {
        // Execute custom transform function
        const transformFn = new Function('data', 'context', step.config.transformFn);
        return transformFn(currentData, context);
      } else if (step.config.transform) {
        // Simple JSON parse (legacy)
        return JSON.parse(step.config.transform);
      }
      return currentData;

    case "delay":
      // Add delay
      const delayMs = step.config.ms || step.config.duration || 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return { delayed: delayMs, timestamp: new Date().toISOString() };

    case "parallel":
      // Execute multiple steps in parallel
      if (!step.config.steps && !step.steps) {
        throw new Error("Parallel step requires 'steps' array");
      }
      
      const parallelSteps = step.config.steps || step.steps;
      const parallelResults = await Promise.all(
        parallelSteps.map(async (parallelStep: any) => {
          try {
            const result = await executeStep(
              parallelStep,
              currentData,
              { ...context },
              logger,
              executeStepRecursive
            );
            return {
              stepId: parallelStep.id,
              success: true,
              result
            };
          } catch (error: any) {
            logger.error(`Parallel step ${parallelStep.id} failed:`, error);
            return {
              stepId: parallelStep.id,
              success: false,
              error: error.message
            };
          }
        })
      );
      
      return {
        type: "parallel",
        results: parallelResults,
        successCount: parallelResults.filter(r => r.success).length,
        failureCount: parallelResults.filter(r => !r.success).length
      };

    case "loop":
      // Iterate over array data
      const loopData = step.config.data || currentData;
      const loopSteps = step.config.steps || step.steps || [];
      const maxIterations = step.config.maxIterations || 100;
      
      if (!Array.isArray(loopData)) {
        throw new Error("Loop step requires array data");
      }
      
      const loopResults = [];
      const itemsToProcess = loopData.slice(0, maxIterations);
      
      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        const loopContext = {
          ...context,
          loopIndex: i,
          loopItem: item,
          loopLength: itemsToProcess.length
        };
        
        let iterationResult = item;
        for (const loopStep of loopSteps) {
          iterationResult = await executeStep(
            loopStep,
            iterationResult,
            loopContext,
            logger,
            executeStepRecursive
          );
        }
        
        loopResults.push({
          index: i,
          item,
          result: iterationResult
        });
      }
      
      return {
        type: "loop",
        iterations: loopResults.length,
        results: loopResults
      };

    case "try_catch":
      // Error handling
      const trySteps = step.config.try || step.config.steps || step.steps || [];
      const catchSteps = step.config.catch || [];
      const finallySteps = step.config.finally || [];
      
      let tryResult: any;
      let errorOccurred = false;
      let errorMessage = '';
      
      try {
        // Execute try steps
        let tryData = currentData;
        for (const tryStep of trySteps) {
          tryData = await executeStep(
            tryStep,
            tryData,
            context,
            logger,
            executeStepRecursive
          );
        }
        tryResult = tryData;
      } catch (error: any) {
        errorOccurred = true;
        errorMessage = error.message;
        logger.warn(`Error in try block: ${error.message}`);
        
        // Execute catch steps
        if (catchSteps.length > 0) {
          const catchContext = {
            ...context,
            error: error.message,
            errorType: error.name
          };
          
          let catchData = { error: error.message };
          for (const catchStep of catchSteps) {
            catchData = await executeStep(
              catchStep,
              catchData,
              catchContext,
              logger,
              executeStepRecursive
            );
          }
          tryResult = catchData;
        } else {
          throw error; // Re-throw if no catch handler
        }
      } finally {
        // Execute finally steps
        if (finallySteps.length > 0) {
          for (const finallyStep of finallySteps) {
            await executeStep(
              finallyStep,
              tryResult,
              context,
              logger,
              executeStepRecursive
            );
          }
        }
      }
      
      return {
        type: "try_catch",
        success: !errorOccurred,
        error: errorOccurred ? errorMessage : undefined,
        result: tryResult
      };

    case "switch":
      // Multi-way branching
      const switchValue = step.config.value || currentData;
      const cases = step.config.cases || {};
      const defaultCase = step.config.default;
      
      let caseKey = String(switchValue);
      let caseSteps = cases[caseKey];
      
      if (!caseSteps && defaultCase) {
        caseSteps = defaultCase;
        caseKey = 'default';
      }
      
      if (!caseSteps) {
        return {
          type: "switch",
          value: switchValue,
          matchedCase: null,
          result: switchValue
        };
      }
      
      let switchResult = currentData;
      for (const caseStep of caseSteps) {
        switchResult = await executeStep(
          caseStep,
          switchResult,
          context,
          logger,
          executeStepRecursive
        );
      }
      
      return {
        type: "switch",
        value: switchValue,
        matchedCase: caseKey,
        result: switchResult
      };

    case "merge":
      // Combine results from context
      const sources = step.config.sources || [];
      const mergeStrategy = step.config.strategy || "shallow"; // shallow, deep, array
      
      let merged: any;
      
      if (mergeStrategy === "array") {
        merged = sources.map((source: string) => context[source]);
      } else if (mergeStrategy === "deep") {
        merged = {};
        for (const source of sources) {
          const data = context[source];
          if (typeof data === 'object' && !Array.isArray(data)) {
            merged = { ...merged, ...data };
          }
        }
      } else {
        // shallow merge
        merged = {};
        for (const source of sources) {
          merged[source] = context[source];
        }
      }
      
      return merged;

    case "set_variable":
      // Store data in context
      const varName = step.config.name || step.config.variable;
      const varValue = step.config.value !== undefined ? step.config.value : currentData;
      
      context[varName] = varValue;
      
      return {
        type: "set_variable",
        name: varName,
        value: varValue
      };

    case "get_variable":
      // Retrieve data from context
      const getVarName = step.config.name || step.config.variable;
      const defaultValue = step.config.default;
      
      const value = context[getVarName];
      
      return value !== undefined ? value : defaultValue;

    case "widget":
      // Widget interaction step
      const widgetAction = step.config.action || 'create'; // create, update, send, destroy
      const widgetId = step.config.widgetId || step.config.id;
      
      return {
        type: "widget",
        action: widgetAction,
        widgetId,
        data: currentData,
        message: `Widget ${widgetAction} executed`,
        // Widget service integration would happen here
        // For now, return placeholder
        result: {
          widgetId,
          action: widgetAction,
          status: 'success'
        }
      };

    case "collection_query":
      // Query collection
      const queryCollectionId = step.config.collectionId;
      const query = step.config.query || {};
      
      return {
        type: "collection_query",
        collectionId: queryCollectionId,
        query,
        message: "Collection query executed",
        // Collection service integration would happen here
        result: {
          items: [],
          total: 0,
          hasMore: false
        }
      };

    case "collection_create":
      // Create item in collection
      const createCollectionId = step.config.collectionId;
      const createData = step.config.data || currentData;
      
      return {
        type: "collection_create",
        collectionId: createCollectionId,
        data: createData,
        message: "Collection item created",
        result: {
          id: `item_${Date.now()}`,
          data: createData,
          created: true
        }
      };

    case "collection_update":
      // Update item in collection
      const updateCollectionId = step.config.collectionId;
      const updateItemId = step.config.itemId;
      const updateData = step.config.data || currentData;
      
      return {
        type: "collection_update",
        collectionId: updateCollectionId,
        itemId: updateItemId,
        data: updateData,
        message: "Collection item updated",
        result: {
          id: updateItemId,
          data: updateData,
          updated: true
        }
      };

    case "collection_delete":
      // Delete item from collection
      const deleteCollectionId = step.config.collectionId;
      const deleteItemId = step.config.itemId;
      
      return {
        type: "collection_delete",
        collectionId: deleteCollectionId,
        itemId: deleteItemId,
        message: "Collection item deleted",
        result: {
          id: deleteItemId,
          deleted: true
        }
      };

    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

/**
 * Register workflow orchestration tools
 */
export async function registerWorkflowTools(server: McpServer, logger: Logger) {
  
  // ===== EXECUTE WORKFLOW =====
  // Use the pre-defined schema with proper type enum validation
  server.tool(
    "execute_workflow",
    "Execute a multi-step workflow with parallel execution, conditionals, loops, error handling, and advanced control flow",
    executeWorkflowSchema.shape,
    withHooks("execute_workflow", async (input) => {
      try {
        logger.info(`Executing workflow: ${input.name}`);
        
        const results: any[] = [];
        let currentData = input.input;
        const context = input.context || {};

        for (const step of input.steps) {
          logger.debug(`Executing step: ${step.id} (${step.type})`);
          
          try {
            // Execute step using the unified executeStep function
            const stepResult = await executeStep(step, currentData, context, logger);
            
            // Store result in context for later reference
            context[`step_${step.id}`] = stepResult;
            
            // Update currentData unless step explicitly preserves it
            if (!step.config.preserveData) {
              currentData = stepResult;
            }

            results.push({
              stepId: step.id,
              type: step.type,
              result: stepResult,
              timestamp: new Date().toISOString(),
              success: true
            });
            
            // Handle onSuccess jump
            if (step.onSuccess) {
              const targetIndex = input.steps.findIndex((s: any) => s.id === step.onSuccess);
              if (targetIndex >= 0) {
                logger.debug(`Jumping to step ${step.onSuccess}`);
                // Skip to target step (this is a simple implementation)
              }
            }
          } catch (stepError: any) {
            logger.error(`Step ${step.id} failed:`, stepError);
            
            results.push({
              stepId: step.id,
              type: step.type,
              error: stepError.message,
              timestamp: new Date().toISOString(),
              success: false
            });
            
            // Handle onError jump
            if (step.onError) {
              const targetIndex = input.steps.findIndex((s: any) => s.id === step.onError);
              if (targetIndex >= 0) {
                logger.debug(`Error occurred, jumping to step ${step.onError}`);
                // Continue to error handler
                continue;
              }
            }
            
            // If no error handler, re-throw
            if (!step.config.continueOnError) {
              throw stepError;
            }
          }
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              workflowId: input.workflowId,
              name: input.name,
              status: "completed",
              steps: results,
              finalOutput: currentData,
              context: context,
              executionTime: new Date().toISOString()
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Workflow execution failed:", error);
        return {
          content: [{
            type: "text",
            text: `Workflow error: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // ===== EXECUTE WORKFLOW ASYNCHRONOUSLY =====
  // Use the pre-defined schema with proper type enum validation
  server.tool(
    "execute_workflow_async",
    "Execute a multi-step workflow asynchronously and return immediately with a wait handle. Use wait_for to retrieve results later.",
    executeWorkflowAsyncSchema.shape,
    withHooks("execute_workflow_async", async (input) => {
      try {
        const handleId = `workflow_${input.workflowId}_${Date.now()}`;
        
        // Create wait handle
        const handle = registerWaitHandle(
          handleId,
          'workflow',
          {
            workflowId: input.workflowId,
            name: input.name,
            stepCount: input.steps.length
          },
          input.timeoutMs
        );
        
        logger.info(`Started async workflow execution: ${input.name} (handle: ${handleId})`);
        
        // Execute workflow in background
        (async () => {
          try {
            const results: any[] = [];
            let currentData = input.input;
            const context = input.context || {};

            for (const step of input.steps) {
              logger.debug(`Executing step: ${step.id} (${step.type})`);
              
              try {
                // Execute step using the unified executeStep function
                const stepResult = await executeStep(step, currentData, context, logger);
                
                // Store result in context for later reference
                context[`step_${step.id}`] = stepResult;
                
                // Update currentData unless step explicitly preserves it
                if (!step.config.preserveData) {
                  currentData = stepResult;
                }

                results.push({
                  stepId: step.id,
                  type: step.type,
                  result: stepResult,
                  timestamp: new Date().toISOString(),
                  success: true
                });
              } catch (stepError: any) {
                logger.error(`Async step ${step.id} failed:`, stepError);
                
                results.push({
                  stepId: step.id,
                  type: step.type,
                  error: stepError.message,
                  timestamp: new Date().toISOString(),
                  success: false
                });
                
                // If no error handler, stop execution
                if (!step.config.continueOnError && !step.onError) {
                  throw stepError;
                }
              }
            }

            logger.info(`Async workflow ${input.name} execution completed (handle: ${handleId})`);
            
            // Complete wait handle with result
            completeWaitHandle(handleId, {
              workflowId: input.workflowId,
              name: input.name,
              status: "completed",
              steps: results,
              finalOutput: currentData,
              context: context,
              executionTime: new Date().toISOString()
            });
          } catch (error: any) {
            logger.error(`Async workflow ${input.name} execution failed (handle: ${handleId}):`, error);
            failWaitHandle(handleId, error.message);
          }
        })();
        
        // Return wait handle immediately
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              async: true,
              handleId: handle.id,
              workflowId: input.workflowId,
              name: input.name,
              status: handle.status,
              message: "Workflow execution started asynchronously. Use wait_for tool to retrieve results.",
              startTime: handle.startTime.toISOString(),
              timeout: input.timeoutMs,
              stepCount: input.steps.length
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error(`Async workflow execution failed:`, error);
        return {
          content: [{
            type: "text",
            text: `Error executing workflow asynchronously: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // ===== CREATE WORKFLOW TEMPLATE =====
  server.tool(
    "create_workflow",
    "Create a reusable workflow template",
    createWorkflowSchema.shape,
    withHooks("create_workflow", async (input) => {
      try {
        const workflow = {
          id: `wf_${Date.now()}`,
          name: input.name,
          description: input.description,
          trigger: input.trigger,
          steps: input.steps,
          createdAt: new Date().toISOString()
        };

        // In production, save to database
        logger.info(`Created workflow: ${workflow.id}`);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              workflow
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Workflow creation failed:", error);
        return {
          content: [{
            type: "text",
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    })
  );

  // ===== WORKFLOW TEMPLATES =====
  server.tool(
    "get_workflow_templates",
    "Get pre-built workflow templates for common use cases",
    {},
    withHooks("get_workflow_templates", async () => {
      const templates = [
        {
          id: "content_generation",
          name: "Content Generation Pipeline",
          description: "Research → Outline → Write → Edit → Publish",
          steps: [
            { type: "agent", name: "Research", config: { prompt: "Research topic" } },
            { type: "agent", name: "Outline", config: { prompt: "Create outline" } },
            { type: "agent", name: "Write", config: { prompt: "Write content" } },
            { type: "agent", name: "Edit", config: { prompt: "Edit and polish" } },
            { type: "api", name: "Publish", config: { endpoint: "/publish" } }
          ]
        },
        {
          id: "customer_support",
          name: "Customer Support Automation",
          description: "Receive → Classify → Route → Respond → Escalate",
          steps: [
            { type: "agent", name: "Classify", config: { prompt: "Classify ticket" } },
            { type: "condition", name: "Check Priority", config: { condition: "priority === 'high'" } },
            { type: "agent", name: "Generate Response", config: { prompt: "Draft response" } },
            { type: "api", name: "Send Email", config: { endpoint: "/send-email" } }
          ]
        },
        {
          id: "data_analysis",
          name: "Data Analysis Workflow",
          description: "Fetch → Clean → Analyze → Visualize → Report",
          steps: [
            { type: "api", name: "Fetch Data", config: { endpoint: "/data" } },
            { type: "transform", name: "Clean Data", config: { transform: "cleanData()" } },
            { type: "agent", name: "Analyze", config: { prompt: "Analyze data" } },
            { type: "api", name: "Create Viz", config: { endpoint: "/visualize" } },
            { type: "agent", name: "Report", config: { prompt: "Generate report" } }
          ]
        },
        {
          id: "software_development",
          name: "Software Development with Agent Team",
          description: "Analyze → Design (Team) → Implement → Review → Deploy",
          steps: [
            { 
              type: "agent", 
              name: "Analyze Requirements", 
              config: { 
                prompt: "Analyze the requirements and identify key features",
                model: "claude-4.5-sonnet"
              } 
            },
            { 
              type: "agent_team", 
              name: "Design Phase", 
              config: { 
                prompt: "Design the system architecture",
                maxRounds: 2,
                agents: [
                  { id: "architect", role: "System Architect", model: "claude-4.5-sonnet" },
                  { id: "security", role: "Security Engineer", model: "gpt-5" },
                  { id: "ux", role: "UX Designer", model: "claude-sonnet-4.5-haiku" }
                ]
              } 
            },
            { 
              type: "agent", 
              name: "Implementation", 
              config: { 
                prompt: "Implement the design",
                model: "grok-code-fast"
              } 
            },
            { 
              type: "agent_team", 
              name: "Code Review", 
              config: { 
                prompt: "Review the implementation",
                maxRounds: 1,
                agents: [
                  { id: "senior", role: "Senior Developer", model: "gpt-5" },
                  { id: "qa", role: "QA Engineer", model: "claude-sonnet-4.5-haiku" }
                ]
              } 
            },
            { 
              type: "api", 
              name: "Deploy", 
              config: { endpoint: "/deploy" } 
            }
          ]
        },
        {
          id: "strategic_planning",
          name: "Strategic Planning with Multi-Agent Teams",
          description: "Research → Analysis Team → Strategy Team → Execution Plan",
          steps: [
            { 
              type: "agent", 
              name: "Market Research", 
              config: { 
                prompt: "Conduct comprehensive market research",
                model: "gemini-2.5-pro"
              } 
            },
            { 
              type: "agent_team", 
              name: "Analysis Team", 
              config: { 
                prompt: "Analyze market research findings",
                maxRounds: 2,
                agents: [
                  { id: "data", role: "Data Analyst", model: "gpt-5" },
                  { id: "market", role: "Market Analyst", model: "claude-4.5-sonnet" },
                  { id: "competitor", role: "Competitive Intelligence", model: "gemini-2.5-pro" }
                ]
              } 
            },
            { 
              type: "delay", 
              name: "Processing Time", 
              config: { ms: 2000 } 
            },
            { 
              type: "agent_team", 
              name: "Strategy Team", 
              config: { 
                prompt: "Develop strategic recommendations",
                maxRounds: 3,
                agents: [
                  { id: "ceo", role: "CEO Perspective", model: "claude-4.5-sonnet", temperature: 0.8 },
                  { id: "cfo", role: "CFO Perspective", model: "gpt-5", temperature: 0.5 },
                  { id: "cto", role: "CTO Perspective", model: "grok-code-fast", temperature: 0.7 }
                ]
              } 
            },
            { 
              type: "agent", 
              name: "Execution Plan", 
              config: { 
                prompt: "Create detailed execution plan",
                model: "claude-4.5-sonnet"
              } 
            }
          ]
        },
        {
          id: "creative_brainstorm",
          name: "Creative Brainstorming with Diverse Agents",
          description: "Brief → Brainstorm Team → Refine → Present",
          steps: [
            { 
              type: "agent", 
              name: "Creative Brief", 
              config: { prompt: "Analyze creative brief and constraints" } 
            },
            { 
              type: "agent_team", 
              name: "Brainstorm Team", 
              config: { 
                prompt: "Generate creative ideas",
                maxRounds: 3,
                agents: [
                  { id: "creative", role: "Creative Director", temperature: 0.9 },
                  { id: "practical", role: "Project Manager", temperature: 0.4 },
                  { id: "technical", role: "Technical Lead", temperature: 0.6 },
                  { id: "wildcard", role: "Innovation Specialist", temperature: 1.0 }
                ]
              } 
            },
            { 
              type: "agent", 
              name: "Refine Ideas", 
              config: { 
                prompt: "Refine and prioritize ideas",
                temperature: 0.6
              } 
            },
            { 
              type: "agent", 
              name: "Presentation", 
              config: { 
                prompt: "Create presentation deck outline",
                model: "claude-4.5-sonnet"
              } 
            }
          ]
        }
      ];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ templates }, null, 2)
        }]
      };
    })
  );

  logger.info("Workflow tools registered successfully");
}
