import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import axios from "axios";
import { Logger } from "../utils/logging.js";

/**
 * Generic API call
 */
const apiCallSchema = z.object({
  url: z.string().url().describe("API endpoint URL"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).describe("HTTP method"),
  headers: z.record(z.string()).optional().describe("HTTP headers"),
  body: z.any().optional().describe("Request body"),
  auth: z.object({
    type: z.enum(["bearer", "basic", "apikey"]),
    token: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    headerName: z.string().optional()
  }).optional().describe("Authentication configuration")
});

/**
 * Stripe integration
 */
const stripeSchema = z.object({
  action: z.enum([
    "create_customer",
    "create_payment_intent",
    "create_subscription",
    "list_charges",
    "refund_payment"
  ]),
  params: z.record(z.any()).describe("Action-specific parameters")
});

/**
 * GitHub integration
 */
const githubSchema = z.object({
  action: z.enum([
    "create_issue",
    "create_pr",
    "list_repos",
    "get_file",
    "create_commit"
  ]),
  repo: z.string().optional().describe("Repository (owner/repo)"),
  params: z.record(z.any()).describe("Action-specific parameters")
});

/**
 * Slack integration
 */
const slackSchema = z.object({
  action: z.enum([
    "send_message",
    "create_channel",
    "list_channels",
    "upload_file"
  ]),
  params: z.record(z.any()).describe("Action-specific parameters")
});

/**
 * Register API integration tools
 */
export async function registerAPITools(server: McpServer, logger: Logger) {
  
  // ===== GENERIC API CALL =====
  server.tool(
    "api_call",
    "Make a generic HTTP API call to any endpoint. Supports all HTTP methods and authentication types.",
    apiCallSchema.shape,
    async (input) => {
      try {
        logger.info(`API call: ${input.method} ${input.url}`);
        
        const config: any = {
          method: input.method,
          url: input.url,
          headers: input.headers || {},
          data: input.body
        };

        // Add authentication
        if (input.auth) {
          if (input.auth.type === "bearer" && input.auth.token) {
            config.headers.Authorization = `Bearer ${input.auth.token}`;
          } else if (input.auth.type === "basic" && input.auth.username && input.auth.password) {
            const encoded = Buffer.from(`${input.auth.username}:${input.auth.password}`).toString('base64');
            config.headers.Authorization = `Basic ${encoded}`;
          } else if (input.auth.type === "apikey" && input.auth.headerName && input.auth.token) {
            config.headers[input.auth.headerName] = input.auth.token;
          }
        }

        const response = await axios(config);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
              data: response.data
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("API call failed:", error);
        return {
          content: [{
            type: "text",
            text: `API call failed: ${error.response?.data?.message || error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== STRIPE INTEGRATION =====
  server.tool(
    "stripe_action",
    "Execute Stripe payment operations: create customers, process payments, manage subscriptions",
    stripeSchema.shape,
    async (input) => {
      try {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
          throw new Error("STRIPE_SECRET_KEY not configured");
        }

        logger.info(`Stripe action: ${input.action}`);
        
        let endpoint = "";
        let method = "POST";
        let data = input.params;

        switch (input.action) {
          case "create_customer":
            endpoint = "https://api.stripe.com/v1/customers";
            break;
          case "create_payment_intent":
            endpoint = "https://api.stripe.com/v1/payment_intents";
            break;
          case "create_subscription":
            endpoint = "https://api.stripe.com/v1/subscriptions";
            break;
          case "list_charges":
            endpoint = "https://api.stripe.com/v1/charges";
            method = "GET";
            break;
          case "refund_payment":
            endpoint = "https://api.stripe.com/v1/refunds";
            break;
        }

        const response = await axios({
          method,
          url: endpoint,
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: new URLSearchParams(data as any).toString(),
          params: method === "GET" ? data : undefined
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              action: input.action,
              success: true,
              result: response.data
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Stripe action failed:", error);
        return {
          content: [{
            type: "text",
            text: `Stripe error: ${error.response?.data?.error?.message || error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== GITHUB INTEGRATION =====
  server.tool(
    "github_action",
    "Interact with GitHub: create issues, PRs, manage repositories, read/write files",
    githubSchema.shape,
    async (input) => {
      try {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
          throw new Error("GITHUB_TOKEN not configured");
        }

        logger.info(`GitHub action: ${input.action}`);
        
        let endpoint = "";
        let method = "GET";
        let data = input.params;

        switch (input.action) {
          case "create_issue":
            if (!input.repo) throw new Error("repo parameter required");
            endpoint = `https://api.github.com/repos/${input.repo}/issues`;
            method = "POST";
            break;
          case "create_pr":
            if (!input.repo) throw new Error("repo parameter required");
            endpoint = `https://api.github.com/repos/${input.repo}/pulls`;
            method = "POST";
            break;
          case "list_repos":
            endpoint = "https://api.github.com/user/repos";
            break;
          case "get_file":
            if (!input.repo) throw new Error("repo parameter required");
            const path = (input.params as any).path || "README.md";
            endpoint = `https://api.github.com/repos/${input.repo}/contents/${path}`;
            break;
          case "create_commit":
            if (!input.repo) throw new Error("repo parameter required");
            endpoint = `https://api.github.com/repos/${input.repo}/git/commits`;
            method = "POST";
            break;
        }

        const response = await axios({
          method,
          url: endpoint,
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
          },
          data: method !== "GET" ? data : undefined,
          params: method === "GET" ? data : undefined
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              action: input.action,
              success: true,
              result: response.data
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("GitHub action failed:", error);
        return {
          content: [{
            type: "text",
            text: `GitHub error: ${error.response?.data?.message || error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== SLACK INTEGRATION =====
  server.tool(
    "slack_action",
    "Interact with Slack: send messages, create channels, upload files",
    slackSchema.shape,
    async (input) => {
      try {
        const token = process.env.SLACK_BOT_TOKEN;
        if (!token) {
          throw new Error("SLACK_BOT_TOKEN not configured");
        }

        logger.info(`Slack action: ${input.action}`);
        
        let endpoint = "";
        let data = input.params;

        switch (input.action) {
          case "send_message":
            endpoint = "https://slack.com/api/chat.postMessage";
            break;
          case "create_channel":
            endpoint = "https://slack.com/api/conversations.create";
            break;
          case "list_channels":
            endpoint = "https://slack.com/api/conversations.list";
            break;
          case "upload_file":
            endpoint = "https://slack.com/api/files.upload";
            break;
        }

        const response = await axios.post(
          endpoint,
          data,
          {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );

        if (!response.data.ok) {
          throw new Error(response.data.error || "Slack API error");
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              action: input.action,
              success: true,
              result: response.data
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Slack action failed:", error);
        return {
          content: [{
            type: "text",
            text: `Slack error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  // ===== WEBHOOK TRIGGER =====
  server.tool(
    "trigger_webhook",
    "Trigger a webhook with custom payload (useful for Zapier, Make, n8n integrations)",
    z.object({
      url: z.string().url(),
      payload: z.any(),
      headers: z.record(z.string()).optional()
    }).shape,
    async (input) => {
      try {
        logger.info(`Triggering webhook: ${input.url}`);
        
        const response = await axios.post(
          input.url,
          input.payload,
          {
            headers: input.headers || { "Content-Type": "application/json" }
          }
        );

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              status: response.status,
              response: response.data
            }, null, 2)
          }]
        };

      } catch (error: any) {
        logger.error("Webhook trigger failed:", error);
        return {
          content: [{
            type: "text",
            text: `Webhook error: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );

  logger.info("API integration tools registered successfully");
}
