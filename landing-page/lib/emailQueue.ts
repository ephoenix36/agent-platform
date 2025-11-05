/**
 * Email Queue System
 * 
 * Provides fallback mechanism when email service is unavailable.
 * Queues submissions in localStorage and retries automatically.
 */

export interface QueuedEmail {
  id: string;
  timestamp: number;
  data: {
    name: string;
    email: string;
    company: string;
    domain: string;
    message: string;
    budget?: string;
  };
  attempts: number;
  lastAttempt?: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
}

const QUEUE_KEY = 'email_queue';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY = 60000; // 1 minute

/**
 * Add email to queue
 */
export function queueEmail(data: QueuedEmail['data']): QueuedEmail {
  const email: QueuedEmail = {
    id: generateId(),
    timestamp: Date.now(),
    data,
    attempts: 0,
    status: 'pending',
  };

  const queue = getQueue();
  queue.push(email);
  saveQueue(queue);

  return email;
}

/**
 * Process queued emails
 */
export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const queue = getQueue();
  let processed = 0;
  let failed = 0;

  for (const email of queue) {
    if (email.status === 'sent') continue;
    if (email.status === 'failed' && email.attempts >= MAX_ATTEMPTS) continue;

    // Check if enough time has passed since last attempt
    if (email.lastAttempt && Date.now() - email.lastAttempt < RETRY_DELAY) {
      continue;
    }

    // Mark as processing
    email.status = 'processing';
    email.attempts++;
    email.lastAttempt = Date.now();
    saveQueue(queue);

    try {
      // Attempt to send
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(email.data),
      });

      if (response.ok) {
        email.status = 'sent';
        processed++;
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Queue processing error:', error);
      
      if (email.attempts >= MAX_ATTEMPTS) {
        email.status = 'failed';
        failed++;
      } else {
        email.status = 'pending';
      }
    }

    saveQueue(queue);
  }

  // Clean up sent emails older than 7 days
  const cleanedQueue = queue.filter(
    (email) =>
      email.status !== 'sent' ||
      Date.now() - email.timestamp < 7 * 24 * 60 * 60 * 1000
  );
  
  if (cleanedQueue.length !== queue.length) {
    saveQueue(cleanedQueue);
  }

  return { processed, failed };
}

/**
 * Get queue from localStorage
 */
function getQueue(): QueuedEmail[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save queue to localStorage
 */
function saveQueue(queue: QueuedEmail[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to save queue:', error);
  }
}

/**
 * Get queue status
 */
export function getQueueStatus(): {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
} {
  const queue = getQueue();
  
  return {
    total: queue.length,
    pending: queue.filter((e) => e.status === 'pending').length,
    processing: queue.filter((e) => e.status === 'processing').length,
    sent: queue.filter((e) => e.status === 'sent').length,
    failed: queue.filter((e) => e.status === 'failed').length,
  };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Start automatic queue processing
 */
export function startQueueProcessor(intervalMs: number = 60000): () => void {
  const interval = setInterval(() => {
    processQueue().catch(console.error);
  }, intervalMs);

  // Process immediately on start
  processQueue().catch(console.error);

  // Return cleanup function
  return () => clearInterval(interval);
}
