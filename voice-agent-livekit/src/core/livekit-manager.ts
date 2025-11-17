/**
 * LiveKit Room Manager
 * Handles LiveKit room connections, participant tracking, and audio streams
 */

import { Room, RoomEvent, ParticipantEvent, Track, AudioFrame } from '@livekit/rtc-node';
import type {
  VoiceAgentConfig,
  VoiceSession,
  ConversationContext,
  AudioChunk,
  SessionMetadata,
} from '../types.js';
import { log, PerfTimer } from '../utils/logger.js';
import { EventEmitter } from 'events';

export class LiveKitManager extends EventEmitter {
  private config: VoiceAgentConfig;
  private room: Room | null = null;
  private session: VoiceSession | null = null;
  
  constructor(config: VoiceAgentConfig) {
    super();
    this.config = config;
  }
  
  /**
   * Connect to LiveKit room and initialize session
   */
  async connect(roomName: string, metadata?: SessionMetadata): Promise<VoiceSession> {
    const timer = new PerfTimer('livekit.connect');
    
    try {
      log.info(`Connecting to LiveKit room: ${roomName}`, { roomName });
      
      // Create room instance
      this.room = new Room();
      
      // Set up event listeners
      this.setupRoomListeners();
      
      // Generate access token
      const token = await this.generateToken(roomName);
      
      // Connect to room
      await this.room.connect(this.config.livekit.url, token);
      
      log.info('Successfully connected to LiveKit room', {
        roomName,
        participantId: this.room.localParticipant?.identity,
      });
      
      // Initialize session
      this.session = {
        id: this.generateSessionId(),
        room: this.room,
        localParticipant: this.room.localParticipant!,
        remoteParticipants: new Map(),
        startedAt: new Date(),
        metadata: metadata || {},
        context: this.initializeContext(),
      };
      
      timer.end({ roomName, sessionId: this.session.id });
      
      this.emit('session.started', {
        type: 'session.started',
        timestamp: new Date(),
        sessionId: this.session.id,
        roomName,
        participantCount: 0,
      });
      
      return this.session;
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Failed to connect to LiveKit room', error as Error, { roomName });
      throw error;
    }
  }
  
  /**
   * Disconnect from LiveKit room and clean up
   */
  async disconnect(): Promise<void> {
    if (!this.room) {
      log.warn('Attempted to disconnect but no active room');
      return;
    }
    
    log.info('Disconnecting from LiveKit room', {
      sessionId: this.session?.id,
    });
    
    try {
      await this.room.disconnect();
      
      if (this.session) {
        const duration = Date.now() - this.session.startedAt.getTime();
        
        this.emit('session.ended', {
          type: 'session.ended',
          timestamp: new Date(),
          sessionId: this.session.id,
          duration,
          messageCount: this.session.context.messages.length,
        });
      }
      
      this.room = null;
      this.session = null;
      
      log.info('Successfully disconnected from LiveKit room');
      
    } catch (error) {
      log.error('Error disconnecting from LiveKit room', error as Error);
      throw error;
    }
  }
  
  /**
   * Publish audio track to the room
   */
  async publishAudio(audioData: Buffer, sampleRate: number = 48000): Promise<void> {
    if (!this.room || !this.session) {
      throw new Error('Not connected to a room');
    }
    
    const timer = new PerfTimer('livekit.publish_audio');
    
    try {
      // Create audio source
      const source = await this.room.localParticipant!.publishData(audioData);
      
      timer.end({ size: audioData.length });
      
    } catch (error) {
      timer.end({ success: false });
      log.error('Failed to publish audio', error as Error);
      throw error;
    }
  }
  
  /**
   * Subscribe to audio from a specific participant
   */
  subscribeToParticipantAudio(participantId: string, callback: (audio: AudioChunk) => void): void {
    if (!this.room || !this.session) {
      throw new Error('Not connected to a room');
    }
    
    const participant = this.session.remoteParticipants.get(participantId);
    if (!participant) {
      throw new Error(`Participant ${participantId} not found`);
    }
    
    // Subscribe to audio tracks
    participant.on(ParticipantEvent.TrackSubscribed, (track, publication) => {
      if (track.kind === Track.Kind.AUDIO) {
        log.info('Subscribed to audio track', {
          participantId,
          trackId: track.sid,
        });
        
        // Handle audio frames
        track.on('audioFrameReceived', (frame: AudioFrame) => {
          const audioChunk: AudioChunk = {
            id: this.generateAudioChunkId(),
            data: Buffer.from(frame.data),
            timestamp: Date.now(),
            sampleRate: frame.sampleRate,
            channels: frame.numChannels,
            duration: frame.samplesPerChannel / frame.sampleRate,
          };
          
          callback(audioChunk);
        });
      }
    });
  }
  
  /**
   * Get current session
   */
  getSession(): VoiceSession | null {
    return this.session;
  }
  
  /**
   * Update session metadata
   */
  updateMetadata(metadata: Partial<SessionMetadata>): void {
    if (!this.session) {
      throw new Error('No active session');
    }
    
    this.session.metadata = {
      ...this.session.metadata,
      ...metadata,
    };
  }
  
  /**
   * Set up room event listeners
   */
  private setupRoomListeners(): void {
    if (!this.room) return;
    
    // Participant joined
    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      log.info('Participant joined', {
        participantId: participant.identity,
        name: participant.name,
      });
      
      if (this.session) {
        this.session.remoteParticipants.set(participant.identity, participant);
        
        this.emit('participant.joined', {
          type: 'participant.joined',
          timestamp: new Date(),
          sessionId: this.session.id,
          participantId: participant.identity,
          participantName: participant.name || 'Unknown',
        });
      }
    });
    
    // Participant left
    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      log.info('Participant left', {
        participantId: participant.identity,
        name: participant.name,
      });
      
      if (this.session) {
        this.session.remoteParticipants.delete(participant.identity);
        
        this.emit('participant.left', {
          type: 'participant.left',
          timestamp: new Date(),
          sessionId: this.session.id,
          participantId: participant.identity,
          participantName: participant.name || 'Unknown',
        });
      }
    });
    
    // Connection state changed
    this.room.on(RoomEvent.ConnectionStateChanged, (state) => {
      log.info('Connection state changed', { state });
    });
    
    // Disconnected
    this.room.on(RoomEvent.Disconnected, () => {
      log.info('Disconnected from room');
      this.emit('disconnected');
    });
    
    // Error handling
    this.room.on(RoomEvent.Reconnecting, () => {
      log.warn('Reconnecting to room');
    });
    
    this.room.on(RoomEvent.Reconnected, () => {
      log.info('Reconnected to room');
    });
  }
  
  /**
   * Generate access token for LiveKit
   */
  private async generateToken(roomName: string): Promise<string> {
    const { AccessToken } = await import('@livekit/rtc-node');
    
    const token = new AccessToken(
      this.config.livekit.apiKey,
      this.config.livekit.apiSecret,
      {
        identity: this.config.livekit.identity || this.config.name,
        name: this.config.name,
      }
    );
    
    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    
    return token.toJwt();
  }
  
  /**
   * Initialize conversation context
   */
  private initializeContext(): ConversationContext {
    return {
      messages: [],
      activeToolCalls: [],
      state: 'active',
      language: process.env.DEFAULT_LANGUAGE || 'en-US',
    };
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generate unique audio chunk ID
   */
  private generateAudioChunkId(): string {
    return `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
