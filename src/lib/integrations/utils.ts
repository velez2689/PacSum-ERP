/**
 * Integration Utilities
 * Common helper functions for integrations
 */

import { IntegrationError, IntegrationErrorCode, IntegrationErrorContext } from './integration-errors';

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 60000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if we've reached max attempts
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Check if error should be retried
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * baseDelay,
        maxDelay
      );

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = maxTokens / refillIntervalMs;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate wait time
    const tokensNeeded = tokens - this.tokens;
    const waitTime = tokensNeeded / this.refillRate;

    await sleep(waitTime);
    this.tokens = 0;
  }

  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Request queue for managing concurrent requests
 */
export class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private activeCount = 0;

  constructor(private readonly maxConcurrent: number) {}

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.activeCount++;
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeCount--;
          this.processQueue();
        }
      };

      this.queue.push(task);
      this.processQueue();
    });
  }

  private processQueue(): void {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task();
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveCount(): number {
    return this.activeCount;
  }
}

/**
 * Idempotency key generator
 */
export function generateIdempotencyKey(
  operation: string,
  organizationId: string,
  ...args: Array<string | number>
): string {
  const data = [operation, organizationId, ...args].join(':');
  return `idem_${hashString(data)}_${Date.now()}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate webhook signature (generic)
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Sanitize data for logging (remove sensitive information)
 */
export function sanitizeForLogging(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'clientSecret',
    'client_secret',
    'privateKey',
    'private_key',
    'ssn',
    'taxId',
    'tax_id',
    'creditCard',
    'credit_card',
    'cvv',
    'pin',
  ];

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Parse error response from API
 */
export function parseApiError(
  error: unknown,
  provider: string,
  context: IntegrationErrorContext = {}
): IntegrationError {
  if (error instanceof IntegrationError) {
    return error;
  }

  // Handle axios errors
  if (isAxiosError(error)) {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    const errorCode = error.response?.data?.code || error.code;

    return new IntegrationError(
      message,
      IntegrationErrorCode.API_ERROR,
      statusCode,
      statusCode >= 500 || statusCode === 429,
      {
        ...context,
        provider,
        statusCode,
        errorCode,
        requestId: error.response?.headers['x-request-id'],
      },
      error
    );
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new IntegrationError(
    message,
    IntegrationErrorCode.UNKNOWN_ERROR,
    500,
    false,
    { ...context, provider },
    error instanceof Error ? error : undefined
  );
}

/**
 * Type guard for axios errors
 */
function isAxiosError(error: unknown): error is {
  response?: {
    status: number;
    data?: { message?: string; code?: string };
    headers: Record<string, string>;
  };
  message: string;
  code?: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    'message' in error
  );
}

/**
 * Batch processor for handling large datasets
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    concurrency?: number;
    onProgress?: (processed: number, total: number) => void;
    onError?: (error: Error, item: T) => void;
  } = {}
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const { batchSize = 100, concurrency = 5, onProgress, onError } = options;

  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];
  const queue = new RequestQueue(concurrency);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length));

    await Promise.all(
      batch.map((item) =>
        queue.add(async () => {
          try {
            const result = await processor(item);
            results.push(result);

            if (onProgress) {
              onProgress(results.length + errors.length, items.length);
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            errors.push({ item, error: err });

            if (onError) {
              onError(err, item);
            } else if (onProgress) {
              onProgress(results.length + errors.length, items.length);
            }
          }
        })
      )
    );
  }

  return { results, errors };
}

/**
 * Map PACSUM transaction type to external provider format
 */
export function mapTransactionType(
  pacsumType: string,
  provider: 'stripe' | 'quickbooks'
): string {
  const mappings: Record<string, Record<string, string>> = {
    stripe: {
      income: 'charge',
      expense: 'refund',
      transfer: 'transfer',
    },
    quickbooks: {
      income: 'Invoice',
      expense: 'Expense',
      transfer: 'Transfer',
    },
  };

  return mappings[provider]?.[pacsumType.toLowerCase()] || pacsumType;
}

/**
 * Format currency amount for API (convert to smallest unit)
 */
export function formatCurrencyForApi(amount: number, currency: string = 'USD'): number {
  // Most currencies use 2 decimal places (cents)
  // Special cases: JPY, KRW use 0 decimal places
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'CLP', 'VND'];

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }

  return Math.round(amount * 100);
}

/**
 * Parse currency amount from API (convert from smallest unit)
 */
export function parseCurrencyFromApi(amount: number, currency: string = 'USD'): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'CLP', 'VND'];

  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount;
  }

  return amount / 100;
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(requiredVars: string[]): void {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

/**
 * Create audit log entry
 */
export interface AuditLogEntry {
  timestamp: string;
  provider: string;
  operation: string;
  organizationId: string;
  userId?: string;
  status: 'success' | 'failure' | 'partial';
  duration: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export function createAuditLogEntry(
  provider: string,
  operation: string,
  organizationId: string,
  status: 'success' | 'failure' | 'partial',
  duration: number,
  options: {
    userId?: string;
    metadata?: Record<string, unknown>;
    error?: Error;
  } = {}
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    provider,
    operation,
    organizationId,
    userId: options.userId,
    status,
    duration,
    metadata: options.metadata ? sanitizeForLogging(options.metadata) : undefined,
    error: options.error?.message,
  };
}

/**
 * Chunk array into smaller arrays
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Partial<T>>
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return target;

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      target[key] = deepMerge(
        { ...targetValue } as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[Extract<keyof T, string>];
    } else {
      target[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return deepMerge(target, ...sources);
}
