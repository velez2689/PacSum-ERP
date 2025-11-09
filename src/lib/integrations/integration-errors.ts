/**
 * Integration Error Classes
 * Custom error types for handling integration failures
 */

export enum IntegrationErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',

  // Sync errors
  SYNC_FAILED = 'SYNC_FAILED',
  SYNC_PARTIAL = 'SYNC_PARTIAL',
  SYNC_TIMEOUT = 'SYNC_TIMEOUT',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',

  // Webhook errors
  WEBHOOK_VERIFICATION_FAILED = 'WEBHOOK_VERIFICATION_FAILED',
  WEBHOOK_PROCESSING_FAILED = 'WEBHOOK_PROCESSING_FAILED',
  INVALID_WEBHOOK_PAYLOAD = 'INVALID_WEBHOOK_PAYLOAD',

  // Provider-specific errors
  STRIPE_ERROR = 'STRIPE_ERROR',
  QUICKBOOKS_ERROR = 'QUICKBOOKS_ERROR',

  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface IntegrationErrorContext {
  provider?: string;
  operation?: string;
  organizationId?: string;
  clientId?: string;
  statusCode?: number;
  requestId?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Base Integration Error
 */
export class IntegrationError extends Error {
  public readonly code: IntegrationErrorCode;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly context: IntegrationErrorContext;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: IntegrationErrorCode,
    statusCode: number = 500,
    isRetryable: boolean = false,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.context = {
      ...context,
      timestamp: new Date().toISOString(),
    };
    this.originalError = originalError;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IntegrationError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      context: this.context,
      stack: this.stack,
    };
  }
}

/**
 * Connection and Authentication Errors
 */
export class ConnectionError extends IntegrationError {
  constructor(
    message: string,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.CONNECTION_FAILED,
      503,
      true,
      context,
      originalError
    );
    this.name = 'ConnectionError';
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(
    message: string,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.AUTHENTICATION_FAILED,
      401,
      false,
      context,
      originalError
    );
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends IntegrationError {
  constructor(
    message: string,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.AUTHORIZATION_FAILED,
      403,
      false,
      context,
      originalError
    );
    this.name = 'AuthorizationError';
  }
}

export class TokenExpiredError extends IntegrationError {
  constructor(
    message: string = 'Access token has expired',
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.TOKEN_EXPIRED,
      401,
      true,
      context,
      originalError
    );
    this.name = 'TokenExpiredError';
  }
}

/**
 * API Errors
 */
export class ApiError extends IntegrationError {
  constructor(
    message: string,
    statusCode: number = 500,
    isRetryable: boolean = false,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.API_ERROR,
      statusCode,
      isRetryable,
      context,
      originalError
    );
    this.name = 'ApiError';
  }
}

export class RateLimitError extends IntegrationError {
  public readonly retryAfter?: number;

  constructor(
    message: string,
    retryAfter?: number,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.RATE_LIMIT_EXCEEDED,
      429,
      true,
      { ...context, retryAfter },
      originalError
    );
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class InvalidRequestError extends IntegrationError {
  constructor(
    message: string,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.INVALID_REQUEST,
      400,
      false,
      context,
      originalError
    );
    this.name = 'InvalidRequestError';
  }
}

export class ResourceNotFoundError extends IntegrationError {
  constructor(
    message: string,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.RESOURCE_NOT_FOUND,
      404,
      false,
      context,
      originalError
    );
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Sync Errors
 */
export class SyncError extends IntegrationError {
  public readonly recordsProcessed: number;
  public readonly recordsFailed: number;

  constructor(
    message: string,
    recordsProcessed: number = 0,
    recordsFailed: number = 0,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.SYNC_FAILED,
      500,
      true,
      { ...context, recordsProcessed, recordsFailed },
      originalError
    );
    this.name = 'SyncError';
    this.recordsProcessed = recordsProcessed;
    this.recordsFailed = recordsFailed;
  }
}

export class SyncPartialError extends IntegrationError {
  public readonly recordsProcessed: number;
  public readonly recordsFailed: number;

  constructor(
    message: string,
    recordsProcessed: number = 0,
    recordsFailed: number = 0,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.SYNC_PARTIAL,
      207,
      false,
      { ...context, recordsProcessed, recordsFailed },
      originalError
    );
    this.name = 'SyncPartialError';
    this.recordsProcessed = recordsProcessed;
    this.recordsFailed = recordsFailed;
  }
}

export class DataValidationError extends IntegrationError {
  public readonly validationErrors: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    validationErrors: Array<{ field: string; message: string }> = [],
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.DATA_VALIDATION_FAILED,
      422,
      false,
      { ...context, validationErrors },
      originalError
    );
    this.name = 'DataValidationError';
    this.validationErrors = validationErrors;
  }
}

/**
 * Webhook Errors
 */
export class WebhookVerificationError extends IntegrationError {
  constructor(
    message: string,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.WEBHOOK_VERIFICATION_FAILED,
      401,
      false,
      context,
      originalError
    );
    this.name = 'WebhookVerificationError';
  }
}

export class WebhookProcessingError extends IntegrationError {
  constructor(
    message: string,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.WEBHOOK_PROCESSING_FAILED,
      500,
      true,
      context,
      originalError
    );
    this.name = 'WebhookProcessingError';
  }
}

/**
 * Provider-Specific Errors
 */
export class StripeError extends IntegrationError {
  public readonly stripeErrorType?: string;
  public readonly stripeErrorCode?: string;

  constructor(
    message: string,
    stripeErrorType?: string,
    stripeErrorCode?: string,
    statusCode: number = 500,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.STRIPE_ERROR,
      statusCode,
      stripeErrorType === 'rate_limit_error',
      { ...context, provider: 'stripe', stripeErrorType, stripeErrorCode },
      originalError
    );
    this.name = 'StripeError';
    this.stripeErrorType = stripeErrorType;
    this.stripeErrorCode = stripeErrorCode;
  }
}

export class QuickBooksError extends IntegrationError {
  public readonly qboErrorCode?: string;

  constructor(
    message: string,
    qboErrorCode?: string,
    statusCode: number = 500,
    context: IntegrationErrorContext = {},
    originalError?: Error
  ) {
    super(
      message,
      IntegrationErrorCode.QUICKBOOKS_ERROR,
      statusCode,
      false,
      { ...context, provider: 'quickbooks', qboErrorCode },
      originalError
    );
    this.name = 'QuickBooksError';
    this.qboErrorCode = qboErrorCode;
  }
}

/**
 * Error Handler Utility
 */
export class IntegrationErrorHandler {
  /**
   * Parse and convert various error types to IntegrationError
   */
  static parseError(error: unknown, context: IntegrationErrorContext = {}): IntegrationError {
    // Already an IntegrationError
    if (error instanceof IntegrationError) {
      return error;
    }

    // Standard Error
    if (error instanceof Error) {
      return new IntegrationError(
        error.message,
        IntegrationErrorCode.UNKNOWN_ERROR,
        500,
        false,
        context,
        error
      );
    }

    // Unknown error type
    const message = typeof error === 'string' ? error : 'An unknown error occurred';
    return new IntegrationError(
      message,
      IntegrationErrorCode.UNKNOWN_ERROR,
      500,
      false,
      context
    );
  }

  /**
   * Log error with structured data
   */
  static logError(error: IntegrationError, logger: Console = console): void {
    const logData = {
      error: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      isRetryable: error.isRetryable,
      context: error.context,
      stack: error.stack,
    };

    if (error.statusCode >= 500) {
      logger.error('Integration Error:', logData);
    } else if (error.statusCode >= 400) {
      logger.warn('Integration Warning:', logData);
    } else {
      logger.info('Integration Info:', logData);
    }
  }

  /**
   * Determine if error should be retried
   */
  static shouldRetry(error: IntegrationError, attemptCount: number, maxAttempts: number = 3): boolean {
    if (attemptCount >= maxAttempts) {
      return false;
    }
    return error.isRetryable;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static getRetryDelay(attemptCount: number, baseDelay: number = 1000): number {
    // Exponential backoff: baseDelay * 2^attemptCount
    const delay = baseDelay * Math.pow(2, attemptCount);
    // Add jitter (random 0-25% of delay)
    const jitter = Math.random() * 0.25 * delay;
    return Math.min(delay + jitter, 60000); // Max 60 seconds
  }
}
