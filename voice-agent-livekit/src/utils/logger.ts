/**
 * Logger utility for Voice Agent
 * Winston-based structured logging with configurable levels
 */

import winston from 'winston';
import type { LogLevel, LogEntry } from './types.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom log format
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    // Console output with colors
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    }),
    // File output for errors
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/voice-agent-error.log',
      level: 'error',
    }),
    // File output for all logs
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/voice-agent.log',
    }),
  ],
});

// Helper functions for structured logging
export const log = {
  debug: (message: string, context?: Record<string, unknown>) => {
    logger.debug(message, context);
  },
  
  info: (message: string, context?: Record<string, unknown>) => {
    logger.info(message, context);
  },
  
  warn: (message: string, context?: Record<string, unknown>) => {
    logger.warn(message, context);
  },
  
  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    logger.error(message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  },
  
  // Specialized logging for events
  event: (eventType: string, data: Record<string, unknown>) => {
    logger.info(`Event: ${eventType}`, { eventType, ...data });
  },
  
  // Performance logging
  perf: (operation: string, durationMs: number, metadata?: Record<string, unknown>) => {
    logger.info(`Performance: ${operation}`, {
      operation,
      durationMs,
      ...metadata,
    });
  },
  
  // Session logging
  session: (sessionId: string, action: string, data?: Record<string, unknown>) => {
    logger.info(`Session ${sessionId}: ${action}`, { sessionId, action, ...data });
  },
};

// Performance timer utility
export class PerfTimer {
  private startTime: number;
  private operation: string;
  
  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }
  
  end(metadata?: Record<string, unknown>) {
    const durationMs = Date.now() - this.startTime;
    log.perf(this.operation, durationMs, metadata);
    return durationMs;
  }
}
