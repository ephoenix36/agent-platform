/**
 * Conversation Manager for Multi-Agent Collaboration
 * 
 * Manages conversations between multiple agents, tracking message history,
 * participant roles, and conversation state.
 */

import { randomUUID } from 'crypto';

export interface AgentReference {
  collection: string;
  subsection: string;
  agentName: string;
  role?: string;
}

export interface ConversationMessage {
  id: string;
  agentRef: AgentReference;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  topic: string;
  agents: AgentReference[];
  messages: ConversationMessage[];
  status: 'active' | 'completed' | 'paused';
  maxRounds: number;
  currentRound: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface CreateConversationParams {
  agents: AgentReference[];
  topic: string;
  maxRounds?: number;
  metadata?: Record<string, any>;
}

export class ConversationManager {
  private conversations: Map<string, Conversation> = new Map();

  /**
   * Create a new multi-agent conversation
   */
  async createConversation(params: CreateConversationParams): Promise<Conversation> {
    const conversation: Conversation = {
      id: randomUUID(),
      topic: params.topic,
      agents: params.agents,
      messages: [],
      status: 'active',
      maxRounds: params.maxRounds || 5,
      currentRound: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: params.metadata
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    agentRef: AgentReference,
    content: string,
    metadata?: Record<string, any>
  ): Promise<ConversationMessage> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    if (conversation.status !== 'active') {
      throw new Error(`Conversation ${conversationId} is not active`);
    }

    // Verify agent is participant
    const isParticipant = conversation.agents.some(
      a => a.collection === agentRef.collection &&
           a.subsection === agentRef.subsection &&
           a.agentName === agentRef.agentName
    );

    if (!isParticipant) {
      throw new Error(`Agent is not a participant in this conversation`);
    }

    const message: ConversationMessage = {
      id: randomUUID(),
      agentRef,
      content,
      timestamp: new Date().toISOString(),
      metadata
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date().toISOString();

    // Check if max rounds reached
    const roundsCompleted = Math.floor(conversation.messages.length / conversation.agents.length);
    conversation.currentRound = roundsCompleted;

    if (roundsCompleted >= conversation.maxRounds) {
      conversation.status = 'completed';
    }

    return message;
  }

  /**
   * Get conversation details
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    return conversation;
  }

  /**
   * List conversations with optional status filter
   */
  async listConversations(
    status?: 'active' | 'completed' | 'paused',
    limit: number = 20
  ): Promise<Conversation[]> {
    let conversations = Array.from(this.conversations.values());

    if (status) {
      conversations = conversations.filter(c => c.status === status);
    }

    // Sort by updated time (most recent first)
    conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return conversations.slice(0, limit);
  }

  /**
   * Update conversation status
   */
  async updateStatus(
    conversationId: string,
    status: 'active' | 'completed' | 'paused'
  ): Promise<Conversation> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    conversation.status = status;
    conversation.updatedAt = new Date().toISOString();

    return conversation;
  }

  /**
   * Get conversation summary
   */
  async getSummary(conversationId: string): Promise<string> {
    const conversation = await this.getConversation(conversationId);

    const participantNames = conversation.agents
      .map(a => `${a.agentName}${a.role ? ` (${a.role})` : ''}`)
      .join(', ');

    return `Conversation: ${conversation.topic}
Participants: ${participantNames}
Status: ${conversation.status}
Messages: ${conversation.messages.length}
Round: ${conversation.currentRound}/${conversation.maxRounds}
Created: ${conversation.createdAt}`;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    if (!this.conversations.has(conversationId)) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    this.conversations.delete(conversationId);
  }
}
