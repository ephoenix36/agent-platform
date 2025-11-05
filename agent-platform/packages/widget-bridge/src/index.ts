/**
 * Widget Bridge
 * Core exports for widget-extension communication
 */

// Schemas and types
export * from './protocol/schema';

// Transport layer
export { PostMessageTransport, type TransportConfig, type MessageHandler } from './protocol/transport';
