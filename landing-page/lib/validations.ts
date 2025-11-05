import { z } from 'zod';

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
  
  company: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters'),
  
  domain: z.enum(['sales', 'product', 'education', 'healthcare', 'climate', 'governance'], {
    required_error: 'Please select a domain',
  }),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  
  budget: z.string().optional(),
  
  // Honeypot field - should be empty (hidden from real users)
  website: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

/**
 * Newsletter subscription validation schema
 */
export const newsletterSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email is required')
    .max(255, 'Email must be less than 255 characters'),
});

export type NewsletterValues = z.infer<typeof newsletterSchema>;

/**
 * Environment variables validation
 */
export const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
  CONTACT_EMAIL: z.string().email(),
});

/**
 * Rate limiting validation
 */
export function validateRateLimit(identifier: string, limit: number = 5, window: number = 60000): boolean {
  // Simple in-memory rate limiting (replace with Redis in production)
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  
  if (typeof window !== 'undefined') {
    const attempts = JSON.parse(localStorage.getItem(key) || '[]') as number[];
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < window);
    
    if (recentAttempts.length >= limit) {
      return false;
    }
    
    recentAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(recentAttempts));
  }
  
  return true;
}
