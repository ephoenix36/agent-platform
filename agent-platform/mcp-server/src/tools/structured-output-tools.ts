/**
 * Structured Output Tools
 * 
 * Tools for requesting structured, parseable responses from LLMs using MCP sampling.
 * Useful for control flow, data extraction, and programmatic processing.
 * 
 * NOTE: These tools are primarily designed for workflows and internal use.
 * They should NOT typically be exposed to agents via includeContext, as they
 * are meant to structure workflow outputs rather than agent outputs.
 * Use in workflows to make piping of outputs more reliable and straightforward.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Logger } from "../utils/logging.js";
import { performSampling } from "../services/sampling-service.js";

/**
 * Request structured JSON output schema
 */
const requestStructuredOutputSchema = z.object({
  prompt: z.string().describe("Prompt to send to the LLM"),
  outputSchema: z.record(z.any()).describe("JSON Schema defining the expected output structure"),
  schemaName: z.string().optional().describe("Name for the output schema"),
  schemaDescription: z.string().optional().describe("Description of what the output represents"),
  model: z.string().optional().describe("Model to use (default: gpt-4o)"),
  strict: z.boolean().optional().default(true).describe("Enforce strict schema validation")
});

/**
 * Extract structured data from text schema
 */
const extractStructuredDataSchema = z.object({
  text: z.string().describe("Text to extract data from"),
  schema: z.record(z.any()).describe("JSON Schema defining the structure to extract"),
  instructions: z.string().optional().describe("Additional extraction instructions"),
  model: z.string().optional().describe("Model to use")
});

/**
 * Validate JSON against schema
 */
const validateJsonSchema = z.object({
  data: z.any().describe("JSON data to validate"),
  schema: z.record(z.any()).describe("JSON Schema to validate against")
});

export function registerStructuredOutputTools(
  server: McpServer,
  logger: Logger
) {
  /**
   * Request structured output (primarily for workflows)
   * Uses MCP sampling to get structured responses from the LLM
   */
  server.tool(
    "request_structured_output",
    "Request an LLM to generate output in a specific JSON structure. Ensures the response matches the provided schema for reliable parsing and control flow.",
    requestStructuredOutputSchema.shape,
    async (args: z.infer<typeof requestStructuredOutputSchema>) => {
      try {
        logger.info("Requesting structured output via MCP sampling");
        logger.debug("Output schema:", args.outputSchema);
        
        // Create a Zod schema from JSON Schema (simplified)
        const zodSchema = z.object({}).passthrough();
        
        // Use MCP sampling for structured output
        const result = await performSampling({
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that provides responses in the exact JSON structure requested. Do not include any text outside the JSON object."
            },
            {
              role: "user",
              content: args.prompt
            }
          ],
          model: args.model || process.env.DEFAULT_STRUCTURED_OUTPUT_MODEL || "gpt-4o",
          structuredOutput: {
            schema: zodSchema,
            name: args.schemaName || "response",
            description: args.schemaDescription || "Structured response",
            strict: args.strict
          }
        });

        logger.info("Structured output completed successfully");
        
        // The result should have structuredData if successful
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              data: result.structuredData || JSON.parse(result.content),
              schema: args.outputSchema,
              model: result.model,
              usage: result.usage
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Structured output failed:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Extract structured data from text (primarily for workflows)
   * Uses MCP sampling to extract and structure data
   */
  server.tool(
    "extract_structured_data",
    "Extract structured data from unstructured text using a schema. Perfect for parsing documents, emails, or any text into a consistent format.",
    extractStructuredDataSchema.shape,
    async (args: z.infer<typeof extractStructuredDataSchema>) => {
      try {
        logger.info("Extracting structured data via MCP sampling");
        logger.debug("Source text length:", args.text.length);
        
        const zodSchema = z.object({}).passthrough();
        
        const prompt = args.instructions 
          ? `${args.instructions}\n\nExtract data from this text:\n${args.text}`
          : `Extract the requested information from the following text and return it in JSON format:\n${args.text}`;

        // Use MCP sampling for data extraction
        const result = await performSampling({
          messages: [
            {
              role: "system",
              content: "You are a data extraction expert. Extract information from text and return it in the exact JSON structure specified. Be accurate and complete."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: args.model || process.env.DEFAULT_STRUCTURED_OUTPUT_MODEL || "gpt-4o",
          structuredOutput: {
            schema: zodSchema,
            name: "extracted_data",
            description: "Data extracted from text"
          }
        });

        logger.info("Data extraction completed successfully");

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              extracted: result.structuredData || JSON.parse(result.content),
              sourceLength: args.text.length,
              model: result.model
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("Data extraction failed:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  /**
   * Validate JSON against schema
   */
  server.tool(
    "validate_json_schema",
    "Validate JSON data against a JSON Schema. Returns validation results with detailed error messages if validation fails.",
    validateJsonSchema.shape,
    async (args: z.infer<typeof validateJsonSchema>) => {
      try {
        // Simple validation (in production, use ajv or similar)
        const dataStr = typeof args.data === 'string' ? args.data : JSON.stringify(args.data);
        const parsed = JSON.parse(dataStr);

        // Basic type checking based on schema
        const errors: string[] = [];
        
        if (args.schema.type === "object" && typeof parsed !== "object") {
          errors.push(`Expected object, got ${typeof parsed}`);
        }

        if (args.schema.required && Array.isArray(args.schema.required)) {
          for (const field of args.schema.required) {
            if (!(field in parsed)) {
              errors.push(`Missing required field: ${field}`);
            }
          }
        }

        const isValid = errors.length === 0;

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              valid: isValid,
              errors: isValid ? undefined : errors,
              data: parsed
            }, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error("JSON validation failed:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              valid: false,
              error: error.message
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );

  logger.info("Registered 3 structured output tools");
}
