/**
 * Stripe Client Initialization
 * Singleton Stripe SDK client with configuration
 */

import Stripe from 'stripe';
import { integrationConfig } from '../config';
import { StripeError as CustomStripeError } from '../integration-errors';
import { RateLimiter, RequestQueue } from '../utils';

/**
 * Stripe client singleton
 */
let stripeClient: Stripe | null = null;

/**
 * Rate limiter for Stripe API calls
 */
const rateLimiter = new RateLimiter(
  integrationConfig.rateLimits.stripe.maxRequestsPerSecond,
  1000 // 1 second
);

/**
 * Request queue for managing concurrent requests
 */
const requestQueue = new RequestQueue(
  integrationConfig.rateLimits.stripe.maxConcurrentRequests
);

/**
 * Get or create Stripe client instance
 */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    const config = integrationConfig.stripe;

    if (!config.apiKey) {
      throw new Error('Stripe API key is not configured');
    }

    stripeClient = new Stripe(config.apiKey, {
      apiVersion: config.apiVersion as Stripe.LatestApiVersion,
      maxNetworkRetries: config.maxNetworkRetries,
      timeout: config.timeout,
      typescript: true,
      telemetry: false,
    });
  }

  return stripeClient;
}

/**
 * Execute Stripe API call with rate limiting and error handling
 */
export async function executeStripeRequest<T>(
  operation: (stripe: Stripe) => Promise<T>,
  options: {
    idempotencyKey?: string;
    retries?: number;
  } = {}
): Promise<T> {
  const { idempotencyKey, retries = 0 } = options;

  // Acquire rate limit token
  await rateLimiter.acquire();

  // Add to request queue
  return requestQueue.add(async () => {
    const stripe = getStripeClient();

    try {
      // Set idempotency key if provided
      if (idempotencyKey && stripe.requestOptions) {
        stripe.requestOptions.idempotencyKey = idempotencyKey;
      }

      const result = await operation(stripe);

      // Log successful request
      if (integrationConfig.logging.enabled && integrationConfig.logging.logRequests) {
        console.log('[Stripe] Request successful', {
          timestamp: new Date().toISOString(),
          idempotencyKey,
        });
      }

      return result;
    } catch (error) {
      // Parse Stripe error
      const stripeError = parseStripeError(error);

      // Log error
      if (integrationConfig.logging.enabled) {
        console.error('[Stripe] Request failed', {
          timestamp: new Date().toISOString(),
          error: stripeError.message,
          type: stripeError.stripeErrorType,
          code: stripeError.stripeErrorCode,
          idempotencyKey,
        });
      }

      // Retry on rate limit errors
      if (stripeError.stripeErrorType === 'rate_limit_error' && retries < 3) {
        const delay = Math.pow(2, retries) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeStripeRequest(operation, { idempotencyKey, retries: retries + 1 });
      }

      throw stripeError;
    }
  });
}

/**
 * Parse Stripe errors into custom error format
 */
export function parseStripeError(error: unknown): CustomStripeError {
  // Already a custom Stripe error
  if (error instanceof CustomStripeError) {
    return error;
  }

  // Stripe SDK error
  if (isStripeError(error)) {
    const statusCode = error.statusCode || 500;
    const errorType = error.type || 'api_error';
    const errorCode = error.code;
    const message = error.message || 'Stripe API error';

    return new CustomStripeError(
      message,
      errorType,
      errorCode,
      statusCode,
      {
        provider: 'stripe',
        statusCode,
        requestId: error.requestId,
      },
      error as Error
    );
  }

  // Generic error
  const message = error instanceof Error ? error.message : 'Unknown Stripe error';
  return new CustomStripeError(
    message,
    'api_error',
    undefined,
    500,
    { provider: 'stripe' },
    error instanceof Error ? error : undefined
  );
}

/**
 * Type guard for Stripe errors
 */
function isStripeError(error: unknown): error is Stripe.StripeError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error
  );
}

/**
 * Validate Stripe configuration
 */
export function validateStripeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!integrationConfig.stripe.apiKey) {
    errors.push('Stripe API key is not configured');
  }

  if (!integrationConfig.stripe.apiKey.startsWith('sk_')) {
    errors.push('Stripe API key must start with "sk_"');
  }

  if (integrationConfig.stripe.apiKey.startsWith('sk_test_')) {
    console.warn('[Stripe] Using test API key - ensure this is intentional in production');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test Stripe connection
 */
export async function testStripeConnection(): Promise<{
  connected: boolean;
  error?: string;
  accountId?: string;
}> {
  try {
    const stripe = getStripeClient();
    const account = await stripe.account.retrieve();

    return {
      connected: true,
      accountId: account.id,
    };
  } catch (error) {
    const stripeError = parseStripeError(error);
    return {
      connected: false,
      error: stripeError.message,
    };
  }
}

/**
 * Get Stripe publishable key for client-side use
 */
export function getStripePublishableKey(): string {
  return integrationConfig.stripe.publishableKey;
}

/**
 * Create Stripe webhook signature verification
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret?: string
): Stripe.Event {
  const stripe = getStripeClient();
  const webhookSecret = secret || integrationConfig.stripe.webhookSecret;

  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook signature verification failed';
    throw new CustomStripeError(
      message,
      'signature_verification_error',
      'signature_verification_failed',
      401,
      {
        provider: 'stripe',
        operation: 'webhook_verification',
      },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get rate limiter status
 */
export function getRateLimiterStatus(): {
  availableTokens: number;
  queueLength: number;
  activeRequests: number;
} {
  return {
    availableTokens: rateLimiter.getAvailableTokens(),
    queueLength: requestQueue.getQueueLength(),
    activeRequests: requestQueue.getActiveCount(),
  };
}
