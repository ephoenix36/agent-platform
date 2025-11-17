/**
 * Telemetry Bridge
 * Listens to EvoSuite evolution events and emits telemetry
 */

import { EventEmitter } from 'events';
import { MetricsAggregator, type MetricsSnapshot } from './MetricsAggregator.js';

export interface TelemetryBridgeConfig {
  enabled: boolean;
  batchSize?: number;
  flushInterval?: number;
}

export interface TelemetryEvent {
  type: string;
  sessionId: string;
  data: any;
  timestamp: number;
}

/**
 * TelemetryBridge listens to EvoSuite evolution events and forwards them as telemetry
 */
export class TelemetryBridge extends EventEmitter {
  private metricsAggregator: MetricsAggregator;
  private eventListeners: Map<string, (...args: any[]) => void> = new Map();
  private isStarted = false;

  // Evolution event types we listen to
  private static readonly EVENT_TYPES = [
    'optimization:start',
    'optimization:generation',
    'optimization:complete',
    'optimization:error'
  ] as const;

  constructor(
    private evolutionEmitter: EventEmitter,
    private config: TelemetryBridgeConfig
  ) {
    super();
    this.metricsAggregator = new MetricsAggregator();
  }

  /**
   * Start listening to evolution events
   */
  start(): void {
    if (this.isStarted || !this.config.enabled) {
      return;
    }

    this.isStarted = true;

    // Register listeners for each event type
    for (const eventType of TelemetryBridge.EVENT_TYPES) {
      const listener = this.createEventListener(eventType);
      this.eventListeners.set(eventType, listener);
      this.evolutionEmitter.on(eventType, listener);
    }
  }

  /**
   * Stop listening to evolution events
   */
  stop(): void {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;

    // Remove all listeners
    for (const [eventType, listener] of this.eventListeners.entries()) {
      this.evolutionEmitter.off(eventType, listener);
    }

    this.eventListeners.clear();
  }

  /**
   * Get current metrics snapshot
   */
  getMetrics(): MetricsSnapshot {
    return this.metricsAggregator.getAllMetrics();
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metricsAggregator.clearAllMetrics();
  }

  /**
   * Create an event listener for a specific event type
   */
  private createEventListener(eventType: string): (...args: any[]) => void {
    return (eventData: any) => {
      try {
        // Extract session ID
        const sessionId = eventData?.sessionId || 'unknown';

        // Record event in metrics
        this.metricsAggregator.recordEvent(sessionId, eventType);

        // Create telemetry event
        const telemetryEvent: TelemetryEvent = {
          type: this.convertEventType(eventType),
          sessionId,
          data: eventData,
          timestamp: Date.now()
        };

        // Emit telemetry event - wrap in try-catch to handle listener errors
        try {
          this.emit('telemetry', telemetryEvent);
        } catch (listenerError) {
          // Emit error event for listener failures
          this.emit('error', {
            error: listenerError instanceof Error ? listenerError : new Error(String(listenerError)),
            eventType,
            originalData: eventData
          });
        }
      } catch (error) {
        // Error handling - emit error event but don't throw
        this.emit('error', {
          error: error instanceof Error ? error : new Error(String(error)),
          eventType,
          originalData: eventData
        });
      }
    };
  }

  /**
   * Convert evolution event type to telemetry event type
   */
  private convertEventType(eventType: string): string {
    return `evosuite.${eventType.replace(':', '.')}`;
  }
}
