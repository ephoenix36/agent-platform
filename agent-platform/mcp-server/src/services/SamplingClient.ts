import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { SamplingMessage, CreateMessageResult } from "@modelcontextprotocol/sdk/types.js";

export class SamplingClient {
  private server: Server;

  constructor(server: Server) {
    this.server = server;
  }

  async sample(options: {
    messages: SamplingMessage[];
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    includeContext?: "none" | "thisServer" | "allServers";
  }): Promise<CreateMessageResult> {
    const result = await this.server.createMessage({
      messages: options.messages,
      maxTokens: options.maxTokens || 4000,
      ...(options.systemPrompt && { systemPrompt: options.systemPrompt }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.topP !== undefined && { topP: options.topP }),
      ...(options.includeContext && { includeContext: options.includeContext })
    });

    if (!result || !result.content) {
      throw new Error('Invalid sampling response');
    }

    return result;
  }
}
