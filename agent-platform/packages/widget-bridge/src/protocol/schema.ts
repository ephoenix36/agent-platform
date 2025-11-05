/**
 * Widget Bridge Message Schemas
 * Zod-validated schemas for secure widget-extension communication
 */

import { z } from 'zod';

/**
 * Message type enumeration
 */
export enum MessageType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  EVENT = 'EVENT',
  SYNC = 'SYNC',
  HANDSHAKE = 'HANDSHAKE',
  ERROR = 'ERROR'
}

/**
 * Base message schema
 * All messages must include these fields
 */
export const WidgetMessageSchema = z.object({
  type: z.nativeEnum(MessageType),
  id: z.string(),
  source: z.enum(['extension', 'widget']),
  target: z.string(),
  timestamp: z.number(),
  metadata: z.record(z.any()).optional()
});

export type WidgetMessage = z.infer<typeof WidgetMessageSchema>;

/**
 * Request message schema
 * Extension -> Widget or Widget -> Extension request
 */
export const RequestMessageSchema = WidgetMessageSchema.extend({
  type: z.literal(MessageType.REQUEST),
  action: z.string(),
  payload: z.any().optional()
});

export type RequestMessage = z.infer<typeof RequestMessageSchema>;

/**
 * Response message schema
 * Reply to a request message
 */
export const ResponseMessageSchema = WidgetMessageSchema.extend({
  type: z.literal(MessageType.RESPONSE),
  requestId: z.string(),
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  }).optional()
});

export type ResponseMessage = z.infer<typeof ResponseMessageSchema>;

/**
 * Event message schema
 * Asynchronous notifications
 */
export const EventMessageSchema = WidgetMessageSchema.extend({
  type: z.literal(MessageType.EVENT),
  event: z.string(),
  data: z.any().optional()
});

export type EventMessage = z.infer<typeof EventMessageSchema>;

/**
 * State synchronization message schema
 * Full or partial state updates
 */
export const SyncMessageSchema = WidgetMessageSchema.extend({
  type: z.literal(MessageType.SYNC),
  state: z.record(z.any()),
  partial: z.boolean().default(false)
});

export type SyncMessage = z.infer<typeof SyncMessageSchema>;

/**
 * Handshake message schema
 * Initial connection establishment
 */
export const HandshakeMessageSchema = WidgetMessageSchema.extend({
  type: z.literal(MessageType.HANDSHAKE),
  protocol: z.string().default('widget-bridge-v1'),
  capabilities: z.array(z.string()).optional()
});

export type HandshakeMessage = z.infer<typeof HandshakeMessageSchema>;

/**
 * Error message schema
 * System-level errors
 */
export const ErrorMessageSchema = WidgetMessageSchema.extend({
  type: z.literal(MessageType.ERROR),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional()
  })
});

export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

/**
 * Discriminated union of all message types
 */
export const MessageSchema = z.discriminatedUnion('type', [
  RequestMessageSchema,
  ResponseMessageSchema,
  EventMessageSchema,
  SyncMessageSchema,
  HandshakeMessageSchema,
  ErrorMessageSchema
]);

export type Message = z.infer<typeof MessageSchema>;

/**
 * Validate and parse a message
 */
export function parseMessage(data: unknown): Message {
  return MessageSchema.parse(data);
}

/**
 * Type guard for message type
 */
export function isMessageType<T extends MessageType>(
  message: Message,
  type: T
): message is Extract<Message, { type: T }> {
  return message.type === type;
}
