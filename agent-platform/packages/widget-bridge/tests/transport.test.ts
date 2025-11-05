/**
 * Test suite for PostMessage Transport Layer
 * Tests secure iframe communication
 */

import { PostMessageTransport } from '../src/protocol/transport';
import { MessageType } from '../src/protocol/schema';

describe('PostMessageTransport', () => {
  let transport: PostMessageTransport;
  let mockIframe: any;
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    // Store original window
    originalWindow = global.window;

    // Mock iframe
    mockIframe = {
      contentWindow: {
        postMessage: jest.fn()
      }
    };

    // Mock window methods
    global.window = {
      ...originalWindow,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      postMessage: jest.fn(),
      location: {
        ...originalWindow.location,
        origin: 'http://localhost:3000'
      },
      parent: originalWindow.parent
    } as any;
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
    
    if (transport) {
      transport.disconnect();
    }
  });

  describe('Constructor', () => {
    it('should create transport instance', () => {
      transport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      expect(transport).toBeInstanceOf(PostMessageTransport);
    });

    it('should accept iframe as target', () => {
      transport = new PostMessageTransport({
        target: mockIframe,
        targetOrigin: 'http://localhost:8080',
        sourceId: 'widget-1',
        sourceType: 'widget'
      });

      expect(transport).toBeDefined();
    });
  });

  describe('connect()', () => {
    it('should register message listener', () => {
      transport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      transport.connect();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should send handshake message', () => {
      transport = new PostMessageTransport({
        target: mockIframe,
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      transport.connect();

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: MessageType.HANDSHAKE
        }),
        'http://localhost:8080'
      );
    });
  });

  describe('disconnect()', () => {
    it('should remove message listener', () => {
      transport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      transport.connect();
      transport.disconnect();

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });
  });

  describe('send()', () => {
    beforeEach(() => {
      transport = new PostMessageTransport({
        target: mockIframe,
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });
      transport.connect();
    });

    it('should send message via postMessage', () => {
      const message: any = {
        type: MessageType.REQUEST,
        id: 'msg-1',
        source: 'extension',
        target: 'widget-1',
        timestamp: Date.now(),
        action: 'getData',
        payload: {}
      };

      transport.send(message);

      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        message,
        'http://localhost:8080'
      );
    });

    it('should throw error if not connected', () => {
      const disconnectedTransport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      expect(() => {
        disconnectedTransport.send({
          type: MessageType.EVENT,
          id: 'msg-2',
          source: 'extension',
          target: 'widget',
          timestamp: Date.now(),
          event: 'test'
        });
      }).toThrow();
    });
  });

  describe('receive()', () => {
    it('should call handler on valid message', (done) => {
      transport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      const expectedMessage = {
        type: MessageType.RESPONSE,
        id: 'msg-3',
        source: 'widget-1',
        target: 'extension',
        timestamp: Date.now(),
        requestId: 'req-1',
        success: true,
        data: { test: true }
      };

      transport.onMessage((message: any) => {
        expect(message).toEqual(expectedMessage);
        done();
      });

      transport.connect();

      // Simulate received message
      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];
      messageHandler({
        origin: 'http://localhost:8080',
        data: expectedMessage
      });
    });

    it('should reject message from invalid origin', () => {
      transport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      const handler = jest.fn();
      transport.onMessage(handler);
      transport.connect();

      // Simulate message from wrong origin
      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];
      messageHandler({
        origin: 'http://malicious-site.com',
        data: {
          type: MessageType.REQUEST,
          id: 'msg-4',
          source: 'widget',
          target: 'extension',
          timestamp: Date.now(),
          action: 'hack'
        }
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject invalid message schema', () => {
      transport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });

      const handler = jest.fn();
      transport.onMessage(handler);
      transport.connect();

      // Simulate invalid message
      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];
      messageHandler({
        origin: 'http://localhost:8080',
        data: {
          // Missing required fields
          type: MessageType.REQUEST,
          id: 'msg-5'
        }
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('request()', () => {
    beforeEach(() => {
      transport = new PostMessageTransport({
        target: mockIframe,
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension'
      });
      transport.connect();
    });

    it('should send request and wait for response', async () => {
      const requestPromise = transport.request('getData', { query: 'test' }, 'widget-1');

      // Get the sent message
      const sentMessage = mockIframe.contentWindow.postMessage.mock.calls[1][0]; // [0] is handshake

      expect(sentMessage.type).toBe(MessageType.REQUEST);
      expect(sentMessage.action).toBe('getData');

      // Simulate response
      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];
      messageHandler({
        origin: 'http://localhost:8080',
        data: {
          type: MessageType.RESPONSE,
          id: 'res-1',
          source: 'widget-1',
          target: 'extension',
          timestamp: Date.now(),
          requestId: sentMessage.id,
          success: true,
          data: { result: 'success' }
        }
      });

      const response = await requestPromise;
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ result: 'success' });
    });

    it('should timeout if no response received', async () => {
      const requestPromise = transport.request('getData', {}, 'widget-1', 100);

      await expect(requestPromise).rejects.toThrow('Request timeout');
    }, 200);

    it('should handle error responses', async () => {
      const requestPromise = transport.request('getData', {}, 'widget-1');

      const sentMessage = mockIframe.contentWindow.postMessage.mock.calls[1][0];

      // Simulate error response
      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];
      messageHandler({
        origin: 'http://localhost:8080',
        data: {
          type: MessageType.RESPONSE,
          id: 'res-2',
          source: 'widget-1',
          target: 'extension',
          timestamp: Date.now(),
          requestId: sentMessage.id,
          success: false,
          error: {
            code: 'ERROR',
            message: 'Something failed'
          }
        }
      });

      await expect(requestPromise).rejects.toThrow('Something failed');
    });
  });

  describe('Security', () => {
    it('should validate origin on every message', () => {
      transport = new PostMessageTransport({
        targetOrigin: 'http://localhost:8080',
        sourceId: 'extension',
        sourceType: 'extension',
        strictOriginCheck: true
      });

      const handler = jest.fn();
      transport.onMessage(handler);
      transport.connect();

      const messageHandler = (window.addEventListener as jest.Mock).mock.calls[0][1];

      // Valid origin
      messageHandler({
        origin: 'http://localhost:8080',
        data: {
          type: MessageType.EVENT,
          id: 'msg-6',
          source: 'widget',
          target: 'extension',
          timestamp: Date.now(),
          event: 'test'
        }
      });

      expect(handler).toHaveBeenCalledTimes(1);

      // Invalid origin
      messageHandler({
        origin: 'http://evil.com',
        data: {
          type: MessageType.EVENT,
          id: 'msg-7',
          source: 'widget',
          target: 'extension',
          timestamp: Date.now(),
          event: 'test'
        }
      });

      expect(handler).toHaveBeenCalledTimes(1); // Still only called once
    });
  });
});
