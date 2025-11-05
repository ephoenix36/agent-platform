import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
      capture_pageview: false, // Disable automatic pageview capture (we'll do manual)
      capture_pageleave: true,
    });
  }
}

export function trackPageView(path: string) {
  if (typeof window !== 'undefined') {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      path,
    });
  }
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties);
  }
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits);
  }
}

// Specific tracking events
export const analytics = {
  // Domain interest tracking
  viewDomain: (domain: string) => {
    trackEvent('domain_viewed', { domain });
  },
  
  clickDomain: (domain: string) => {
    trackEvent('domain_clicked', { domain });
  },
  
  // Contact form tracking
  startContactForm: (domain: string) => {
    trackEvent('contact_form_started', { domain });
  },
  
  submitContactForm: (domain: string, success: boolean) => {
    trackEvent('contact_form_submitted', { domain, success });
  },
  
  // CTA tracking
  clickCTA: (cta: string, location: string) => {
    trackEvent('cta_clicked', { cta, location });
  },
  
  // Engagement tracking
  scrollDepth: (depth: number) => {
    trackEvent('scroll_depth', { depth });
  },
  
  timeOnPage: (seconds: number) => {
    trackEvent('time_on_page', { seconds });
  },
  
  // Newsletter tracking
  subscribeNewsletter: (success: boolean) => {
    trackEvent('newsletter_subscription', { success });
  },
};

export default posthog;
