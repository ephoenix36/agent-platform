/**
 * Simple logging utility
 */
export interface Logger {
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

export function setupLogging(): Logger {
  const currentLevel = levels[LOG_LEVEL] || levels.info;

  return {
    info: (...args: any[]) => {
      if (currentLevel >= levels.info) {
        console.error('[INFO]', ...args);  // Use stderr for MCP compatibility
      }
    },
    debug: (...args: any[]) => {
      if (currentLevel >= levels.debug) {
        console.error('[DEBUG]', ...args);  // Use stderr for MCP compatibility
      }
    },
    warn: (...args: any[]) => {
      if (currentLevel >= levels.warn) {
        console.error('[WARN]', ...args);  // Use stderr for MCP compatibility
      }
    },
    error: (...args: any[]) => {
      if (currentLevel >= levels.error) {
        console.error('[ERROR]', ...args);
      }
    }
  };
}
