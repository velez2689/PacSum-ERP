/**
 * Integration Configuration
 * Centralized configuration for third-party integrations
 */

export interface StripeConfig {
  apiKey: string;
  webhookSecret: string;
  publishableKey: string;
  apiVersion: string;
  maxNetworkRetries: number;
  timeout: number;
}

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
  apiBaseUrl: string;
  authBaseUrl: string;
  minorVersion: string;
  scopes: string[];
}

export interface IntegrationRateLimits {
  maxRequestsPerSecond: number;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxConcurrentRequests: number;
}

export interface IntegrationRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatusCodes: number[];
}

export interface IntegrationConfig {
  stripe: StripeConfig;
  quickbooks: QuickBooksConfig;
  rateLimits: {
    stripe: IntegrationRateLimits;
    quickbooks: IntegrationRateLimits;
  };
  retry: IntegrationRetryConfig;
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    logRequests: boolean;
    logResponses: boolean;
  };
  sync: {
    batchSize: number;
    maxSyncDuration: number; // milliseconds
    defaultSyncInterval: number; // milliseconds
  };
}

/**
 * Get Stripe configuration from environment variables
 */
function getStripeConfig(): StripeConfig {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }

  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set - webhook signature verification will fail');
  }

  return {
    apiKey,
    webhookSecret: webhookSecret || '',
    publishableKey: publishableKey || '',
    apiVersion: '2023-10-16',
    maxNetworkRetries: 3,
    timeout: 30000, // 30 seconds
  };
}

/**
 * Get QuickBooks configuration from environment variables
 */
function getQuickBooksConfig(): QuickBooksConfig {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  if (!clientId || !clientSecret) {
    throw new Error('QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET environment variables are required');
  }

  const baseUrl = environment === 'production'
    ? 'https://quickbooks.api.intuit.com'
    : 'https://sandbox-quickbooks.api.intuit.com';

  return {
    clientId,
    clientSecret,
    redirectUri: redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/quickbooks/oauth-callback`,
    environment,
    apiBaseUrl: baseUrl,
    authBaseUrl: 'https://oauth.platform.intuit.com/oauth2/v1',
    minorVersion: '65',
    scopes: [
      'com.intuit.quickbooks.accounting',
      'com.intuit.quickbooks.payment',
    ],
  };
}

/**
 * Stripe rate limits
 * See: https://stripe.com/docs/rate-limits
 */
const stripeRateLimits: IntegrationRateLimits = {
  maxRequestsPerSecond: 100,
  maxRequestsPerMinute: 100,
  maxRequestsPerHour: 100000,
  maxConcurrentRequests: 10,
};

/**
 * QuickBooks rate limits
 * See: https://developer.intuit.com/app/developer/qbo/docs/develop/rest-api-features#rate-limits
 */
const quickbooksRateLimits: IntegrationRateLimits = {
  maxRequestsPerSecond: 5,
  maxRequestsPerMinute: 500,
  maxRequestsPerHour: 5000,
  maxConcurrentRequests: 3,
};

/**
 * Retry configuration
 */
const retryConfig: IntegrationRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 60 seconds
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Get the complete integration configuration
 */
export function getIntegrationConfig(): IntegrationConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    stripe: getStripeConfig(),
    quickbooks: getQuickBooksConfig(),
    rateLimits: {
      stripe: stripeRateLimits,
      quickbooks: quickbooksRateLimits,
    },
    retry: retryConfig,
    logging: {
      enabled: true,
      level: isDevelopment ? 'debug' : 'info',
      logRequests: isDevelopment,
      logResponses: isDevelopment,
    },
    sync: {
      batchSize: 100,
      maxSyncDuration: 300000, // 5 minutes
      defaultSyncInterval: 3600000, // 1 hour
    },
  };
}

/**
 * Validate integration configuration
 */
export function validateIntegrationConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    getStripeConfig();
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`Stripe configuration error: ${error.message}`);
    }
  }

  try {
    getQuickBooksConfig();
  } catch (error) {
    if (error instanceof Error) {
      errors.push(`QuickBooks configuration error: ${error.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export singleton instance
 */
export const integrationConfig = getIntegrationConfig();
