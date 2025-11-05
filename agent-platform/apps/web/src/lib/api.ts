/**
 * API Client Library
 * 
 * Type-safe API client with authentication, error handling, and request/response interceptors
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Environment configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Type definitions for API responses
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Subscription {
  has_subscription: boolean;
  tier: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  usage: {
    current: number;
    quota: number | 'unlimited';
    percentage: number;
  };
}

export interface APIKey {
  id: string;
  key_prefix: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  usage_count: number;
  rate_limit: {
    per_minute: number;
    per_month: number;
  };
}

export interface UsageData {
  period_start: string;
  period_end: string;
  total_usage: number;
  quota: number | 'unlimited';
  percentage: number;
  by_feature: {
    [feature: string]: number;
  };
  daily_breakdown: {
    date: string;
    count: number;
  }[];
}

export interface Invoice {
  id: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  created: string;
  due_date?: string;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  period_start: string;
  period_end: string;
}

export interface CheckoutSession {
  session_id: string;
  url: string;
}

export interface PriceInfo {
  tier: string;
  price_id: string;
  amount: number;
  currency: string;
  interval: string;
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Authentication Manager
 */
class AuthManager {
  private static API_KEY_STORAGE_KEY = 'sota_api_key';
  private static TOKEN_STORAGE_KEY = 'sota_auth_token';

  static getAPIKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static setAPIKey(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.API_KEY_STORAGE_KEY, key);
  }

  static removeAPIKey(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.API_KEY_STORAGE_KEY);
  }

  static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_STORAGE_KEY);
  }

  static setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
  }

  static removeAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
  }

  static clearAll(): void {
    this.removeAPIKey();
    this.removeAuthToken();
  }
}

/**
 * API Client Class
 */
class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add authentication
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add API key if available
        const apiKey = AuthManager.getAPIKey();
        if (apiKey && config.headers) {
          config.headers['X-API-Key'] = apiKey;
        }

        // Add auth token if available
        const token = AuthManager.getAuthToken();
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Log requests in development
        if (IS_DEVELOPMENT) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
        }

        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => {
        // Log responses in development
        if (IS_DEVELOPMENT) {
          console.log(`[API] Response ${response.status}:`, response.data);
        }
        return response;
      },
      (error: AxiosError<APIResponse>) => {
        const status = error.response?.status;
        const message = error.response?.data?.error || error.message;
        const code = error.code;

        // Log errors in development
        if (IS_DEVELOPMENT) {
          console.error('[API] Response error:', {
            status,
            message,
            code,
            url: error.config?.url,
          });
        }

        // Handle specific error cases
        if (status === 401) {
          // Unauthorized - clear auth and redirect to login
          AuthManager.clearAll();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }

        // Create custom error
        const apiError = new APIError(
          message || 'An unexpected error occurred',
          status,
          code,
          error.response?.data
        );

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T = any>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  /**
   * Billing API Methods
   */
  billing = {
    // Get current subscription
    getCurrentSubscription: async (): Promise<APIResponse<{ subscription: Subscription }>> => {
      return this.get('/billing/subscriptions/current');
    },

    // Create checkout session
    createCheckoutSession: async (tier: string, successUrl?: string, cancelUrl?: string): Promise<APIResponse<CheckoutSession>> => {
      return this.post('/billing/checkout/create-session', {
        tier,
        success_url: successUrl || `${window.location.origin}/billing/success`,
        cancel_url: cancelUrl || `${window.location.origin}/billing`,
      });
    },

    // Upgrade subscription
    upgradeSubscription: async (newTier: string): Promise<APIResponse<Subscription>> => {
      return this.post('/billing/subscriptions/upgrade', { new_tier: newTier });
    },

    // Downgrade subscription
    downgradeSubscription: async (newTier: string): Promise<APIResponse<Subscription>> => {
      return this.post('/billing/subscriptions/downgrade', { new_tier: newTier });
    },

    // Cancel subscription
    cancelSubscription: async (): Promise<APIResponse<Subscription>> => {
      return this.post('/billing/subscriptions/cancel');
    },

    // Reactivate subscription
    reactivateSubscription: async (): Promise<APIResponse<Subscription>> => {
      return this.post('/billing/subscriptions/reactivate');
    },

    // Get API key
    getAPIKey: async (): Promise<APIResponse<APIKey>> => {
      return this.get('/billing/api-keys/current');
    },

    // Regenerate API key
    regenerateAPIKey: async (): Promise<APIResponse<{ api_key: APIKey; key: string }>> => {
      return this.post('/billing/api-keys/regenerate');
    },

    // Get usage data
    getCurrentUsage: async (): Promise<APIResponse<UsageData>> => {
      return this.get('/billing/usage/current');
    },

    // Get usage history
    getUsageHistory: async (startDate?: string, endDate?: string): Promise<APIResponse<UsageData[]>> => {
      return this.get('/billing/usage/history', { start_date: startDate, end_date: endDate });
    },

    // Get invoices
    getInvoices: async (limit?: number): Promise<APIResponse<{ invoices: Invoice[] }>> => {
      return this.get('/billing/invoices', { limit });
    },

    // Get price info for all tiers
    getPricing: async (): Promise<APIResponse<{ prices: PriceInfo[] }>> => {
      return this.get('/billing/pricing');
    },
  };

  /**
   * Auth API Methods
   */
  auth = {
    // Login with email/password
    login: async (email: string, password: string): Promise<APIResponse<{ token: string; user: any }>> => {
      const response = await this.post<APIResponse<{ token: string; user: any }>>('/auth/login', { email, password });
      if (response.success && response.data?.token) {
        AuthManager.setAuthToken(response.data.token);
      }
      return response;
    },

    // Logout
    logout: async (): Promise<void> => {
      AuthManager.clearAll();
    },

    // Register new user
    register: async (email: string, password: string, name?: string): Promise<APIResponse<{ user: any }>> => {
      return this.post('/auth/register', { email, password, name });
    },
  };
}

// Export singleton instance
export const api = new APIClient();

// Export auth manager for direct access
export const auth = AuthManager;

// Export type guard helpers
export function isAPIError(error: any): error is APIError {
  return error instanceof APIError;
}

export function getErrorMessage(error: unknown): string {
  if (isAPIError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
