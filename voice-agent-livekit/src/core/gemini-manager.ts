/**
 * Gemini AI Manager
 * Handles Gemini 2.0 Flash integration with streaming responses and function calling
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type {
  VoiceAgentConfig,
  StreamingResponse,
  ConversationMessage,
  MCPTool,
  ToolCall,
} from '../types.js';
import { log, PerfTimer } from '../utils/logger.js';
import { EventEmitter } from 'events';

export class GeminiManager extends EventEmitter {
  private config: VoiceAgentConfig;
  private ai: GoogleGenerativeAI;
  private model: GenerativeModel;
  private conversationHistory: ConversationMessage[] = [];
  private availableTools: MCPTool[] = [];
  
  constructor(config: VoiceAgentConfig) {
    super();
    this.config = config;
    
    // Initialize Gemini AI
    this.ai = new GoogleGenerativeAI(config.gemini.apiKey);
    
    // Create model with configuration
    this.model = this.ai.getGenerativeModel({
      model: config.gemini.model,
      systemInstruction: config.gemini.systemInstruction,
      generationConfig: {
        temperature: config.gemini.temperature,
        topP: config.gemini.topP,
        topK: config.gemini.topK,
        maxOutputTokens: config.gemini.maxOutputTokens,
      },
    });
    
    log.info('Gemini manager initialized', {
      model: config.gemini.model,
    });
  }
  
  /**
   * Generate streaming response for user input
   */
  async generateStreamingResponse(userInput: string): Promise<StreamingResponse> {
    const timer = new PerfTimer('gemini.generate_streaming');
    const responseId = this.generateResponseId();
    
    log.info('Generating streaming response', {
      responseId,
      inputLength: userInput.length,
    });
    
    // Add user message to history
    this.addMessage('user', userInput);
    
    // Prepare conversation history for Gemini
    const history = this.conversationHistory.map(msg => ({
      role: msg.role === 'agent' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
    
    // Start chat session
    const chat = this.model.startChat({
      history: history.slice(0, -1), // Exclude the current message
    });
    
    // Generate streaming response
    const result = await chat.sendMessageStream(userInput);
    
    let fullText = '';
    let firstChunkTime: Date | undefined;
    let totalChunks = 0;
    const latencies: number[] = [];
    
    // Create async generator for text chunks
    const textStream = async function* () {
      const chunkStartTime = Date.now();
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        
        if (!firstChunkTime) {
          firstChunkTime = new Date();
          const latency = Date.now() - chunkStartTime;
          latencies.push(latency);
          log.perf('first_chunk_latency', latency, { responseId });
        }
        
        fullText += chunkText;
        totalChunks++;
        
        yield chunkText;
      }
    }();
    
    timer.end({ responseId, inputLength: userInput.length });
    
    const streamingResponse: StreamingResponse = {
      id: responseId,
      textStream,
      fullText: '',
      metadata: {
        firstChunkAt: firstChunkTime,
        lastChunkAt: new Date(),
        totalChunks: 0,
        avgLatencyMs: 0,
        model: this.config.gemini.model,
      },
    };
    
    // Update metadata asynchronously as stream completes
    this.updateStreamMetadata(streamingResponse, () => ({
      fullText,
      firstChunkTime,
      totalChunks,
      latencies,
    }));
    
    return streamingResponse;
  }
  
  /**
   * Generate non-streaming response (for quick replies)
   */
  async generateResponse(userInput: string): Promise<string> {
    const timer = new PerfTimer('gemini.generate_response');
    
    try {
      this.addMessage('user', userInput);
      
      const history = this.conversationHistory.map(msg => ({
        role: msg.role === 'agent' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
      
      const chat = this.model.startChat({
        history: history.slice(0, -1),
      });
      
      const result = await chat.sendMessage(userInput);
      const response = result.response.text();
      
      this.addMessage('agent', response);
      
      timer.end({ inputLength: userInput.length, responseLength: response.length });
      
      return response;
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Failed to generate response', error as Error);
      throw error;
    }
  }
  
  /**
   * Generate response with function calling support
   */
  async generateWithTools(userInput: string): Promise<{
    text: string;
    toolCalls: ToolCall[];
  }> {
    const timer = new PerfTimer('gemini.generate_with_tools');
    
    try {
      this.addMessage('user', userInput);
      
      // Convert MCP tools to Gemini function declarations
      const tools = this.availableTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      }));
      
      // Create model with tools
      const modelWithTools = this.ai.getGenerativeModel({
        model: this.config.gemini.model,
        systemInstruction: this.config.gemini.systemInstruction,
        tools: [{ functionDeclarations: tools }],
      });
      
      const history = this.conversationHistory.map(msg => ({
        role: msg.role === 'agent' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
      
      const chat = modelWithTools.startChat({
        history: history.slice(0, -1),
      });
      
      const result = await chat.sendMessage(userInput);
      const response = result.response;
      
      // Extract function calls
      const toolCalls: ToolCall[] = [];
      const functionCalls = response.functionCalls();
      
      if (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
          const toolCall: ToolCall = {
            id: this.generateToolCallId(),
            name: fc.name,
            args: fc.args,
            status: 'pending',
            startedAt: new Date(),
          };
          
          toolCalls.push(toolCall);
          
          this.emit('tool.call.started', {
            type: 'tool.call.started',
            timestamp: new Date(),
            sessionId: '', // Will be set by session manager
            toolCallId: toolCall.id,
            toolName: toolCall.name,
          });
        }
      }
      
      const text = response.text() || '';
      this.addMessage('agent', text);
      
      timer.end({
        inputLength: userInput.length,
        responseLength: text.length,
        toolCalls: toolCalls.length,
      });
      
      return { text, toolCalls };
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Failed to generate response with tools', error as Error);
      throw error;
    }
  }
  
  /**
   * Register MCP tools for function calling
   */
  registerTools(tools: MCPTool[]): void {
    this.availableTools = tools;
    log.info('Registered MCP tools', { count: tools.length });
  }
  
  /**
   * Add message to conversation history
   */
  private addMessage(role: 'user' | 'agent', content: string): void {
    const message: ConversationMessage = {
      id: this.generateMessageId(),
      role,
      content,
      timestamp: new Date(),
    };
    
    this.conversationHistory.push(message);
    
    // Keep history bounded (last 20 messages)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }
  
  /**
   * Get conversation history
   */
  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }
  
  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    log.info('Conversation history cleared');
  }
  
  /**
   * Update stream metadata after completion
   */
  private async updateStreamMetadata(
    response: StreamingResponse,
    getter: () => {
      fullText: string;
      firstChunkTime?: Date;
      totalChunks: number;
      latencies: number[];
    }
  ): Promise<void> {
    // Wait for stream to complete
    for await (const _ of response.textStream) {
      // Consume stream
    }
    
    const { fullText, firstChunkTime, totalChunks, latencies } = getter();
    
    response.fullText = fullText;
    response.metadata.firstChunkAt = firstChunkTime;
    response.metadata.lastChunkAt = new Date();
    response.metadata.totalChunks = totalChunks;
    response.metadata.avgLatencyMs = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    
    this.addMessage('agent', fullText);
  }
  
  /**
   * Generate unique response ID
   */
  private generateResponseId(): string {
    return `response_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generate unique tool call ID
   */
  private generateToolCallId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
