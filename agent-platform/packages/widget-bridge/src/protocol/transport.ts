/**
 * PostMessage Transport Layer
 * Secure iframe communication with origin validation
 */

import { v4 as uuidv4 } from 'uuid';
import {
  MessageType,
  parseMessage,
  type Message,
  type RequestMessage,
  type ResponseMessage,
  type HandshakeMessage
} from './schema';

export interface TransportConfig {
  /** Target window or iframe */
  target?: Window | HTMLIFrameElement;
  /** Target origin for security validation */
  targetOrigin: string;
  /** Source identifier (extension or widget ID) */
  sourceId: string;
  /** Source type */
  sourceType: 'extension' | 'widget';
  /** Strict origin checking */
  strictOriginCheck?: boolean;
  /** Default request timeout in ms */
  defaultTimeout?: number;
}

export type MessageHandler = (message: Message) => void;

/**
 * PostMessageTransport
 * Handles secure PostMessage communication between extension and widget
 */
export class PostMessageTransport {
  private config: Omit<Required<TransportConfig>, 'target'> & { target?: Window | HTMLIFrameElement };
  private targetWindow: Window | null = null;
  private connected: boolean = false;
  private messageHandler: MessageHandler | null = null;
  private boundHandleMessage: ((event: MessageEvent) => void) | null = null;
  private pendingRequests: Map<string, {
    resolve: (response: ResponseMessage) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  constructor(config: TransportConfig) {
    this.config = {
      target: config.target || undefined,
      targetOrigin: config.targetOrigin,
      sourceId: config.sourceId,
      sourceType: config.sourceType,
      strictOriginCheck: config.strictOriginCheck ?? true,
      defaultTimeout: config.defaultTimeout ?? 30000
    };
  }

  /**
   * Connect and establish communication
   */
  connect(): void {
    if (this.connected) {
      return;
    }

    // Determine target window
    if (this.config.target) {
      if ('contentWindow' in this.config.target) {
        this.targetWindow = this.config.target.contentWindow;
      } else {
        this.targetWindow = this.config.target as Window;
      }
    } else {
      this.targetWindow = window.parent;
    }

    // Register message listener
    this.boundHandleMessage = this.handleMessage.bind(this);
    window.addEventListener('message', this.boundHandleMessage);

    this.connected = true;

    // Send handshake
    this.sendHandshake();
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (!this.connected) {
      return;
    }

    if (this.boundHandleMessage) {
      window.removeEventListener('message', this.boundHandleMessage);
    }

    // Clear all pending requests without rejecting (silent cleanup)
    this.pendingRequests.forEach(({ timeout }) => {
      clearTimeout(timeout);
    });
    this.pendingRequests.clear();

    this.connected = false;
    this.targetWindow = null;
    this.boundHandleMessage = null;
  }

  /**
   * Send a message
   */
  send(message: Message): void {
    if (!this.connected || !this.targetWindow) {
      throw new Error('Transport not connected');
    }

    this.targetWindow.postMessage(message, this.config.targetOrigin);
  }

  /**
   * Register message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Send request and wait for response
   */
  async request(
    action: string,
    payload: any,
    target: string,
    timeout?: number
  ): Promise<ResponseMessage> {
    const requestId = uuidv4();
    const requestTimeout = timeout ?? this.config.defaultTimeout;

    const request: RequestMessage = {
      type: MessageType.REQUEST,
      id: requestId,
      source: this.config.sourceType,
      target,
      timestamp: Date.now(),
      action,
      payload
    };

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, requestTimeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      // Send request
      this.send(request);
    });
  }

  /**
   * Handle incoming PostMessage events
   */
  private handleMessage(event: MessageEvent): void {
    // Validate origin
    if (this.config.strictOriginCheck && event.origin !== this.config.targetOrigin) {
      console.warn(`[WidgetBridge] Rejected message from invalid origin: ${event.origin}`);
      return;
    }

    // Parse and validate message
    let message: Message;
    try {
      message = parseMessage(event.data);
    } catch (error) {
      console.warn('[WidgetBridge] Invalid message schema:', error);
      return;
    }

    // Handle responses to pending requests
    if (message.type === MessageType.RESPONSE) {
      const pending = this.pendingRequests.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.requestId);

        if (message.success) {
          pending.resolve(message);
        } else {
          pending.reject(new Error(message.error?.message || 'Request failed'));
        }
        return;
      }
    }

    // Forward to message handler
    if (this.messageHandler) {
      this.messageHandler(message);
    }
  }

  /**
   * Send handshake message
   */
  private sendHandshake(): void {
    const handshake: HandshakeMessage = {
      type: MessageType.HANDSHAKE,
      id: uuidv4(),
      source: this.config.sourceType,
      target: '*', // Broadcast handshake
      timestamp: Date.now(),
      protocol: 'widget-bridge-v1',
      capabilities: []
    };

    this.send(handshake);
  }

  /**
   * Check if transport is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
