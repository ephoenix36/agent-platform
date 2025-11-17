/**
 * Voice Agent - Main orchestration class
 * Coordinates LiveKit, Gemini, MCP, and multi-agent collaboration
 */

import type {
  VoiceAgentConfig,
  VoiceSession,
  AudioChunk,
  TranscriptionResult,
  SessionMetadata,
} from '../types.js';
import { LiveKitManager } from './livekit-manager.js';
import { GeminiManager } from './gemini-manager.js';
import { MCPManager } from './mcp-manager.js';
import { BufferManager } from './buffer-manager.js';
import { CollaborationManager } from './collaboration-manager.js';
import { log, PerfTimer } from '../utils/logger.js';
import { EventEmitter } from 'events';

export class VoiceAgent extends EventEmitter {
  private config: VoiceAgentConfig;
  private livekitManager: LiveKitManager;
  private geminiManager: GeminiManager;
  private mcpManager: MCPManager | null = null;
  private bufferManager: BufferManager;
  private collaborationManager: CollaborationManager | null = null;
  private isInitialized = false;
  
  constructor(config: VoiceAgentConfig) {
    super();
    this.config = config;
    
    // Initialize managers
    this.livekitManager = new LiveKitManager(config);
    this.geminiManager = new GeminiManager(config);
    this.bufferManager = new BufferManager(config.performance);
    
    if (config.mcp) {
      this.mcpManager = new MCPManager(config.mcp);
    }
    
    if (config.collaboration) {
      this.collaborationManager = new CollaborationManager(config.collaboration);
    }
    
    // Forward events
    this.setupEventForwarding();
  }
  
  /**
   * Initialize all subsystems
   */
  async initialize(): Promise<void> {
    const timer = new PerfTimer('voice_agent.initialize');
    
    try {
      log.info('Initializing Voice Agent', {
        name: this.config.name,
      });
      
      // Initialize buffer manager
      await this.bufferManager.initialize();
      
      // Initialize MCP if configured
      if (this.mcpManager) {
        await this.mcpManager.initialize();
        const tools = this.mcpManager.getTools();
        this.geminiManager.registerTools(tools);
      }
      
      // Initialize collaboration if configured
      if (this.collaborationManager) {
        await this.collaborationManager.initialize();
      }
      
      this.isInitialized = true;
      
      timer.end({
        mcpServers: this.mcpManager ? 'enabled' : 'disabled',
        collaboration: this.collaborationManager ? 'enabled' : 'disabled',
      });
      
      log.info('Voice Agent initialized successfully');
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Voice Agent initialization failed', error as Error);
      throw error;
    }
  }
  
  /**
   * Start voice session in a LiveKit room
   */
  async startSession(roomName: string, metadata?: SessionMetadata): Promise<VoiceSession> {
    if (!this.isInitialized) {
      throw new Error('Voice Agent not initialized. Call initialize() first.');
    }
    
    const timer = new PerfTimer('voice_agent.start_session');
    
    try {
      log.info('Starting voice session', { roomName });
      
      const session = await this.livekitManager.connect(roomName, metadata);
      
      // Set up audio processing
      this.setupAudioProcessing(session);
      
      timer.end({ sessionId: session.id, roomName });
      
      this.emit('session.started', session);
      
      return session;
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Failed to start session', error as Error);
      throw error;
    }
  }
  
  /**
   * End the current voice session
   */
  async endSession(): Promise<void> {
    const session = this.livekitManager.getSession();
    
    if (!session) {
      log.warn('No active session to end');
      return;
    }
    
    log.info('Ending voice session', { sessionId: session.id });
    
    await this.livekitManager.disconnect();
    
    this.emit('session.ended', {
      sessionId: session.id,
      duration: Date.now() - session.startedAt.getTime(),
    });
  }
  
  /**
   * Process text input (for testing or text-based interaction)
   */
  async processText(input: string): Promise<string> {
    const timer = new PerfTimer('voice_agent.process_text');
    
    try {
      // Check pre-buffered responses first
      const preBuffered = this.bufferManager.getPreBufferedResponse(input);
      if (preBuffered) {
        timer.end({ cached: true });
        return preBuffered;
      }
      
      // Check cache
      const cached = this.bufferManager.getCachedResponse(input);
      if (cached) {
        timer.end({ cached: true });
        return cached;
      }
      
      // Determine if we need expert consultation
      const needsExpert = await this.assessComplexity(input);
      
      let response: string;
      
      if (needsExpert && this.collaborationManager) {
        // Consult expert advisor
        const recommendation = await this.collaborationManager.getExpertRecommendation(input);
        
        if (recommendation.recommendedExperts.length > 0) {
          log.info('Consulting expert for complex query', {
            experts: recommendation.recommendedExperts,
          });
          
          const expertResponse = await this.collaborationManager.consultExpert({
            domain: recommendation.recommendedExperts[0],
            query: input,
          });
          
          // Synthesize with Gemini
          const synthesized = await this.geminiManager.generateResponse(
            `Based on expert input: "${expertResponse}", provide a helpful response to: "${input}"`
          );
          
          response = synthesized;
        } else {
          response = await this.generateResponse(input);
        }
      } else {
        response = await this.generateResponse(input);
      }
      
      // Cache the response
      this.bufferManager.cacheResponse(input, response);
      
      timer.end({ responseLength: response.length });
      
      return response;
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Failed to process text', error as Error);
      throw error;
    }
  }
  
  /**
   * Get current session
   */
  getSession(): VoiceSession | null {
    return this.livekitManager.getSession();
  }
  
  /**
   * Get agent statistics
   */
  getStats(): {
    session: VoiceSession | null;
    cache: ReturnType<BufferManager['getStats']>;
    collaboration?: ReturnType<CollaborationManager['getStats']>;
    tools: number;
  } {
    return {
      session: this.getSession(),
      cache: this.bufferManager.getStats(),
      collaboration: this.collaborationManager?.getStats(),
      tools: this.mcpManager?.getTools().length || 0,
    };
  }
  
  /**
   * Shutdown agent and cleanup resources
   */
  async shutdown(): Promise<void> {
    log.info('Shutting down Voice Agent');
    
    try {
      await this.endSession();
      
      if (this.mcpManager) {
        await this.mcpManager.disconnect();
      }
      
      this.bufferManager.clear();
      
      log.info('Voice Agent shutdown complete');
      
    } catch (error) {
      log.error('Error during shutdown', error as Error);
      throw error;
    }
  }
  
  /**
   * Generate response using appropriate method
   */
  private async generateResponse(input: string): Promise<string> {
    // Check if we need tools
    const needsTools = this.detectToolRequirement(input);
    
    if (needsTools && this.mcpManager) {
      const result = await this.geminiManager.generateWithTools(input);
      
      // Execute any tool calls
      if (result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          try {
            toolCall.status = 'running';
            const toolResult = await this.mcpManager.executeTool(toolCall);
            toolCall.status = 'completed';
            toolCall.result = toolResult;
            toolCall.endedAt = new Date();
          } catch (error) {
            toolCall.status = 'failed';
            toolCall.error = error as Error;
            toolCall.endedAt = new Date();
          }
        }
        
        // Generate final response with tool results
        const toolResultsText = result.toolCalls
          .map(tc => `Tool ${tc.name}: ${JSON.stringify(tc.result)}`)
          .join('\n');
        
        const finalResponse = await this.geminiManager.generateResponse(
          `Given these tool results:\n${toolResultsText}\n\nProvide a natural response to: "${input}"`
        );
        
        return finalResponse;
      }
      
      return result.text;
    }
    
    // Standard response generation
    if (this.config.performance.enableStreaming) {
      const streamingResponse = await this.geminiManager.generateStreamingResponse(input);
      
      // Consume stream and build full text
      for await (const chunk of streamingResponse.textStream) {
        streamingResponse.fullText += chunk;
      }
      
      return streamingResponse.fullText;
    }
    
    return await this.geminiManager.generateResponse(input);
  }
  
  /**
   * Set up audio processing pipeline
   */
  private setupAudioProcessing(session: VoiceSession): void {
    // Subscribe to all participants' audio
    session.remoteParticipants.forEach((participant) => {
      this.livekitManager.subscribeToParticipantAudio(
        participant.identity,
        async (audioChunk: AudioChunk) => {
          await this.processAudioChunk(audioChunk);
        }
      );
    });
    
    // Listen for new participants
    this.livekitManager.on('participant.joined', (event: any) => {
      this.livekitManager.subscribeToParticipantAudio(
        event.participantId,
        async (audioChunk: AudioChunk) => {
          await this.processAudioChunk(audioChunk);
        }
      );
    });
  }
  
  /**
   * Process incoming audio chunk
   */
  private async processAudioChunk(chunk: AudioChunk): Promise<void> {
    try {
      // Here you would:
      // 1. Buffer audio chunks
      // 2. Perform STT (Speech-to-Text) using Gemini or another service
      // 3. Process the transcribed text
      // 4. Generate response
      // 5. Convert response to audio (TTS)
      // 6. Publish audio to LiveKit
      
      // For now, just log
      log.debug('Received audio chunk', {
        id: chunk.id,
        duration: chunk.duration,
        sampleRate: chunk.sampleRate,
      });
      
      this.emit('audio.received', chunk);
      
    } catch (error) {
      log.error('Error processing audio chunk', error as Error);
    }
  }
  
  /**
   * Assess query complexity to determine if expert help is needed
   */
  private async assessComplexity(input: string): Promise<boolean> {
    // Simple heuristics for complexity
    const complexityIndicators = [
      input.length > 200,
      input.includes('?') && input.split('?').length > 2,
      /\b(analyze|investigate|research|complex|detailed|comprehensive)\b/i.test(input),
    ];
    
    return complexityIndicators.filter(Boolean).length >= 2;
  }
  
  /**
   * Detect if input requires tool usage
   */
  private detectToolRequirement(input: string): boolean {
    const toolKeywords = [
      'create', 'build', 'generate', 'make', 'execute',
      'run', 'deploy', 'publish', 'save', 'load',
      'search', 'find', 'lookup', 'query', 'calculate',
    ];
    
    return toolKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
  }
  
  /**
   * Set up event forwarding from managers
   */
  private setupEventForwarding(): void {
    // Forward LiveKit events
    this.livekitManager.on('session.started', (event) => this.emit('session.started', event));
    this.livekitManager.on('session.ended', (event) => this.emit('session.ended', event));
    this.livekitManager.on('participant.joined', (event) => this.emit('participant.joined', event));
    this.livekitManager.on('participant.left', (event) => this.emit('participant.left', event));
    
    // Forward Gemini events
    this.geminiManager.on('tool.call.started', (event) => this.emit('tool.call.started', event));
    
    // Forward MCP events
    if (this.mcpManager) {
      this.mcpManager.on('tool.executed', (event) => this.emit('tool.executed', event));
    }
    
    // Forward collaboration events
    if (this.collaborationManager) {
      this.collaborationManager.on('consultation.completed', (event) => 
        this.emit('consultation.completed', event)
      );
    }
  }
}
