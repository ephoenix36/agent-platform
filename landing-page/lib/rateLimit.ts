/**
 * Rate Limiting Utilities
 * 
 * Simple in-memory rate limiting for API routes.
 * For production, use Redis or a proper rate limiting service.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  
  /** Time window in milliseconds */
  windowMs: number;
  
  /** Message to return when rate limited */
  message?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  
  /** Remaining requests in current window */
  remaining: number;
  
  /** Time until rate limit resets (ms) */
  resetIn: number;
  
  /** Error message if rate limited */
  message?: string;
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // No entry or expired - allow and create new entry
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Within rate limit
  if (entry.count < config.maxRequests) {
    entry.count++;
    rateLimitMap.set(identifier, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
    };
  }

  // Rate limited
  return {
    allowed: false,
    remaining: 0,
    resetIn: entry.resetTime - now,
    message: config.message || 'Too many requests. Please try again later.',
  };
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get IP from headers (Vercel, CloudFlare, etc.)
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfIp = headers.get('cf-connecting-ip');

  const ip = forwardedFor?.split(',')[0] || realIp || cfIp || 'unknown';

  return ip;
}

/**
 * Clean up expired entries periodically
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}

/**
 * Honeypot field validator
 * Returns true if request appears to be spam
 */
export function isHoneypotTriggered(honeypotValue: unknown): boolean {
  // Honeypot field should be empty
  // Real users won't see or fill it
  // Bots typically fill all fields
  return Boolean(honeypotValue);
}

/**
 * Basic spam detection heuristics
 */
export function detectSpam(data: {
  name?: string;
  email?: string;
  message?: string;
  company?: string;
}): { isSpam: boolean; reason?: string } {
  // Check for excessive URLs
  const urlPattern = /https?:\/\//gi;
  const messageUrls = (data.message?.match(urlPattern) || []).length;
  if (messageUrls > 2) {
    return { isSpam: true, reason: 'Too many URLs in message' };
  }

  // Check for common spam keywords
  const spamKeywords = ['viagra', 'cialis', 'casino', 'crypto', 'bitcoin', 'forex'];
  const messageText = (data.message || '').toLowerCase();
  for (const keyword of spamKeywords) {
    if (messageText.includes(keyword)) {
      return { isSpam: true, reason: `Spam keyword detected: ${keyword}` };
    }
  }

  // Check for suspicious email patterns
  const suspiciousEmailDomains = ['temp-mail.org', 'guerrillamail.com', 'mailinator.com'];
  const emailDomain = data.email?.split('@')[1]?.toLowerCase();
  if (emailDomain && suspiciousEmailDomains.includes(emailDomain)) {
    return { isSpam: true, reason: 'Suspicious email domain' };
  }

  // Check for repetitive characters
  const repeatPattern = /(.)\1{10,}/;
  if (repeatPattern.test(data.message || '')) {
    return { isSpam: true, reason: 'Repetitive characters detected' };
  }

  return { isSpam: false };
}
