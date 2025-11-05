/**
 * Test suite for widget communication message schemas
 * Validates message structure and type safety
 */

import {
  MessageType,
  MessageSchema,
  WidgetMessageSchema,
  RequestMessageSchema,
  ResponseMessageSchema,
  EventMessageSchema,
  SyncMessageSchema,
  type WidgetMessage,
  type RequestMessage,
  type ResponseMessage,
  type EventMessage,
  type SyncMessage
} from '../src/protocol/schema';

describe('Message Schemas', () => {
  describe('MessageType Enum', () => {
    it('should have all expected message types', () => {
      expect(MessageType.REQUEST).toBe('REQUEST');
      expect(MessageType.RESPONSE).toBe('RESPONSE');
      expect(MessageType.EVENT).toBe('EVENT');
      expect(MessageType.SYNC).toBe('SYNC');
      expect(MessageType.HANDSHAKE).toBe('HANDSHAKE');
      expect(MessageType.ERROR).toBe('ERROR');
    });
  });

  describe('Base WidgetMessage Schema', () => {
    it('should validate a complete base message', () => {
      const message: WidgetMessage = {
        type: MessageType.REQUEST,
        id: 'msg-123',
        source: 'extension',
        target: 'widget-1',
        timestamp: Date.now()
      };

      expect(() => WidgetMessageSchema.parse(message)).not.toThrow();
    });

    it('should reject message without required fields', () => {
      const invalidMessage = {
        type: MessageType.REQUEST,
        id: 'msg-123'
        // Missing source, target, timestamp
      };

      expect(() => WidgetMessageSchema.parse(invalidMessage)).toThrow();
    });

    it('should accept message with optional metadata', () => {
      const messageWithMetadata: WidgetMessage = {
        type: MessageType.EVENT,
        id: 'msg-456',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        metadata: {
          priority: 'high',
          retry: true
        }
      };

      expect(() => WidgetMessageSchema.parse(messageWithMetadata)).not.toThrow();
    });

    it('should validate source as extension or widget', () => {
      const validSources = ['extension', 'widget'];
      
      validSources.forEach(source => {
        const message = {
          type: MessageType.REQUEST,
          id: 'msg-1',
          source,
          target: 'target-1',
          timestamp: Date.now()
        };
        
        expect(() => WidgetMessageSchema.parse(message)).not.toThrow();
      });
    });
  });

  describe('RequestMessage Schema', () => {
    it('should validate request with action and payload', () => {
      const request: RequestMessage = {
        type: MessageType.REQUEST,
        id: 'req-1',
        source: 'extension',
        target: 'widget-1',
        timestamp: Date.now(),
        action: 'getData',
        payload: {
          query: { type: 'poll', status: 'active' }
        }
      };

      expect(() => RequestMessageSchema.parse(request)).not.toThrow();
    });

    it('should require action field', () => {
      const invalidRequest = {
        type: MessageType.REQUEST,
        id: 'req-2',
        source: 'extension',
        target: 'widget-1',
        timestamp: Date.now(),
        // Missing action
        payload: {}
      };

      expect(() => RequestMessageSchema.parse(invalidRequest)).toThrow();
    });

    it('should accept any payload type', () => {
      const payloadTypes = [
        null,
        'string',
        123,
        { complex: { nested: 'object' } },
        ['array', 'of', 'values']
      ];

      payloadTypes.forEach((payload, idx) => {
        const request = {
          type: MessageType.REQUEST,
          id: `req-${idx}`,
          source: 'extension',
          target: 'widget-1',
          timestamp: Date.now(),
          action: 'test',
          payload
        };

        expect(() => RequestMessageSchema.parse(request)).not.toThrow();
      });
    });
  });

  describe('ResponseMessage Schema', () => {
    it('should validate successful response', () => {
      const response: ResponseMessage = {
        type: MessageType.RESPONSE,
        id: 'res-1',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        requestId: 'req-1',
        success: true,
        data: {
          votes: [
            { option: 'Red', count: 10 },
            { option: 'Blue', count: 15 }
          ]
        }
      };

      expect(() => ResponseMessageSchema.parse(response)).not.toThrow();
    });

    it('should validate error response', () => {
      const errorResponse: ResponseMessage = {
        type: MessageType.RESPONSE,
        id: 'res-2',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        requestId: 'req-2',
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Poll not found'
        }
      };

      expect(() => ResponseMessageSchema.parse(errorResponse)).not.toThrow();
    });

    it('should require requestId for correlation', () => {
      const invalidResponse = {
        type: MessageType.RESPONSE,
        id: 'res-3',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        // Missing requestId
        success: true,
        data: {}
      };

      expect(() => ResponseMessageSchema.parse(invalidResponse)).toThrow();
    });
  });

  describe('EventMessage Schema', () => {
    it('should validate event with data', () => {
      const event: EventMessage = {
        type: MessageType.EVENT,
        id: 'evt-1',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        event: 'vote-submitted',
        data: {
          pollId: 'poll-123',
          option: 'Blue',
          userId: 'user-456'
        }
      };

      expect(() => EventMessageSchema.parse(event)).not.toThrow();
    });

    it('should require event name', () => {
      const invalidEvent = {
        type: MessageType.EVENT,
        id: 'evt-2',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        // Missing event
        data: {}
      };

      expect(() => EventMessageSchema.parse(invalidEvent)).toThrow();
    });

    it('should accept events without data', () => {
      const minimalEvent: EventMessage = {
        type: MessageType.EVENT,
        id: 'evt-3',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        event: 'widget-ready'
      };

      expect(() => EventMessageSchema.parse(minimalEvent)).not.toThrow();
    });
  });

  describe('SyncMessage Schema', () => {
    it('should validate state sync message', () => {
      const sync: SyncMessage = {
        type: MessageType.SYNC,
        id: 'sync-1',
        source: 'extension',
        target: 'widget-1',
        timestamp: Date.now(),
        state: {
          poll: {
            id: 'poll-123',
            question: 'Favorite color?',
            options: ['Red', 'Blue', 'Green'],
            votes: { 'Red': 5, 'Blue': 8, 'Green': 3 }
          }
        },
        partial: false
      };

      expect(() => SyncMessageSchema.parse(sync)).not.toThrow();
    });

    it('should support partial state updates', () => {
      const partialSync: SyncMessage = {
        type: MessageType.SYNC,
        id: 'sync-2',
        source: 'widget',
        target: 'extension',
        timestamp: Date.now(),
        state: {
          votes: { 'Blue': 9 } // Only updated vote count
        },
        partial: true
      };

      expect(() => SyncMessageSchema.parse(partialSync)).not.toThrow();
    });

    it('should require state field', () => {
      const invalidSync = {
        type: MessageType.SYNC,
        id: 'sync-3',
        source: 'extension',
        target: 'widget-1',
        timestamp: Date.now(),
        // Missing state
        partial: false
      };

      expect(() => SyncMessageSchema.parse(invalidSync)).toThrow();
    });

    it('should default partial to false', () => {
      const sync = {
        type: MessageType.SYNC,
        id: 'sync-4',
        source: 'extension',
        target: 'widget-1',
        timestamp: Date.now(),
        state: { data: 'test' }
      };

      const parsed = SyncMessageSchema.parse(sync);
      expect(parsed.partial).toBe(false);
    });
  });

  describe('Message Type Discrimination', () => {
    it('should parse message to correct type based on type field', () => {
      const messages = [
        {
          type: MessageType.REQUEST,
          id: '1',
          source: 'extension',
          target: 'widget',
          timestamp: Date.now(),
          action: 'test',
          payload: {}
        },
        {
          type: MessageType.RESPONSE,
          id: '2',
          source: 'widget',
          target: 'extension',
          timestamp: Date.now(),
          requestId: '1',
          success: true,
          data: {}
        },
        {
          type: MessageType.EVENT,
          id: '3',
          source: 'widget',
          target: 'extension',
          timestamp: Date.now(),
          event: 'test-event'
        },
        {
          type: MessageType.SYNC,
          id: '4',
          source: 'extension',
          target: 'widget',
          timestamp: Date.now(),
          state: {},
          partial: false
        }
      ];

      messages.forEach(msg => {
        expect(() => MessageSchema.parse(msg)).not.toThrow();
      });
    });
  });
});
