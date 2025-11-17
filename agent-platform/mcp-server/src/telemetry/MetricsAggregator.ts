/**
 * Metrics Aggregator
 * Tracks and aggregates telemetry events per session
 */

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  eventCounts: Record<string, number>;
  totalEvents: number;
  lastEventTime: number;
  duration: number;
}

export interface MetricsSnapshot {
  sessions: SessionMetrics[];
  totalSessions: number;
  totalEvents: number;
  eventTypeDistribution: Record<string, number>;
}

export class MetricsAggregator {
  private sessions: Map<string, SessionMetrics> = new Map();

  /**
   * Record an event for a session
   */
  recordEvent(sessionId: string, eventType: string): void {
    const now = Date.now();
    
    if (!this.sessions.has(sessionId)) {
      // Create new session
      this.sessions.set(sessionId, {
        sessionId,
        startTime: now,
        eventCounts: {},
        totalEvents: 0,
        lastEventTime: now,
        duration: 0
      });
    }

    const session = this.sessions.get(sessionId)!;
    
    // Update event counts
    session.eventCounts[eventType] = (session.eventCounts[eventType] || 0) + 1;
    session.totalEvents++;
    session.lastEventTime = now;
    session.duration = now - session.startTime;
  }

  /**
   * Get metrics for a specific session
   */
  getSessionMetrics(sessionId: string): SessionMetrics | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get aggregate metrics across all sessions
   */
  getAllMetrics(): MetricsSnapshot {
    const sessions = Array.from(this.sessions.values());
    
    // Calculate totals
    let totalEvents = 0;
    const eventTypeDistribution: Record<string, number> = {};

    for (const session of sessions) {
      totalEvents += session.totalEvents;
      
      for (const [eventType, count] of Object.entries(session.eventCounts)) {
        eventTypeDistribution[eventType] = (eventTypeDistribution[eventType] || 0) + count;
      }
    }

    return {
      sessions,
      totalSessions: this.sessions.size,
      totalEvents,
      eventTypeDistribution
    };
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.sessions.clear();
  }

  /**
   * End a session (finalize metrics)
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const now = Date.now();
      session.duration = now - session.startTime;
      session.lastEventTime = now;
    }
  }
}
