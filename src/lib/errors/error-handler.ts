/**
 * Centralized Error Handler
 * Handles all errors and formats them for API responses
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  AuthError,
  ValidationError,
  RateLimitExceededError,
  isOperationalError,
  getSafeErrorMessage,
  getErrorStatusCode,
} from './auth-errors';
import { formatZodErrors } from '@/lib/auth/validators';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Log error to monitoring service
 */
function logError(error: Error, context?: Record<string, any>): void {
  // In production, send to error monitoring service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error monitoring service
    console.error('Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    });
  } else {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  }
}

/**
 * Handle Zod validation errors
 */
function handleZodError(error: ZodError): ErrorResponse {
  const formattedErrors = formatZodErrors(error);

  return {
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: { errors: formattedErrors },
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle authentication errors
 */
function handleAuthError(error: AuthError): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    },
  };

  // Add additional details for specific error types
  if (error instanceof ValidationError) {
    response.error.details = { errors: error.errors };
  } else if (error instanceof RateLimitExceededError) {
    response.error.details = { retryAfter: error.retryAfter };
  }

  return response;
}

/**
 * Handle generic errors
 */
function handleGenericError(error: Error): ErrorResponse {
  // Don't expose internal error details in production
  const message = isOperationalError(error)
    ? error.message
    : 'An unexpected error occurred. Please try again later.';

  return {
    success: false,
    error: {
      message,
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Main error handler
 */
export function handleError(
  error: unknown,
  context?: Record<string, any>
): NextResponse<ErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response = handleZodError(error);
    logError(error, { ...context, type: 'validation' });
    return NextResponse.json(response, { status: response.error.statusCode });
  }

  // Handle authentication errors
  if (error instanceof AuthError) {
    const response = handleAuthError(error);

    // Only log non-operational errors or errors that are not client mistakes
    if (!error.isOperational || error.statusCode >= 500) {
      logError(error, { ...context, type: 'auth' });
    }

    return NextResponse.json(response, { status: response.error.statusCode });
  }

  // Handle generic errors
  if (error instanceof Error) {
    const response = handleGenericError(error);
    logError(error, { ...context, type: 'generic' });
    return NextResponse.json(response, { status: response.error.statusCode });
  }

  // Handle unknown errors
  const unknownError = new Error('An unknown error occurred');
  const response = handleGenericError(unknownError);
  logError(unknownError, { ...context, type: 'unknown', originalError: error });
  return NextResponse.json(response, { status: response.error.statusCode });
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleError(error, {
        url: req.url,
        method: req.method,
        ...context,
      });
    }
  };
}

/**
 * Error boundary for middleware
 */
export function middlewareErrorHandler(error: unknown): NextResponse {
  console.error('Middleware error:', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'An error occurred while processing your request',
        code: 'MIDDLEWARE_ERROR',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 500 }
  );
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  statusCode: number,
  details?: Record<string, any>
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      code,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}
