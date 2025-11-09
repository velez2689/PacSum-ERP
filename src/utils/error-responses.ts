/**
 * Standardized Error Responses
 * Pre-defined error responses for common scenarios
 */

import { NextResponse } from 'next/server';

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, any>;
    timestamp: string;
  };
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      meta,
    },
    { status }
  );
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  code: string,
  statusCode: number = 500,
  details?: Record<string, any>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        statusCode,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status: statusCode }
  );
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  // Authentication errors
  unauthorized: (message: string = 'Unauthorized') =>
    errorResponse(message, 'UNAUTHORIZED', 401),

  invalidCredentials: () =>
    errorResponse('Invalid email or password', 'INVALID_CREDENTIALS', 401),

  tokenExpired: () =>
    errorResponse('Your session has expired. Please login again.', 'TOKEN_EXPIRED', 401),

  invalidToken: () =>
    errorResponse('Invalid authentication token', 'INVALID_TOKEN', 401),

  // Authorization errors
  forbidden: (message: string = 'Access forbidden') =>
    errorResponse(message, 'FORBIDDEN', 403),

  insufficientPermissions: () =>
    errorResponse('You do not have permission to perform this action', 'INSUFFICIENT_PERMISSIONS', 403),

  organizationAccessDenied: () =>
    errorResponse('Access to this organization is denied', 'ORGANIZATION_ACCESS_DENIED', 403),

  emailNotVerified: () =>
    errorResponse('Please verify your email address to continue', 'EMAIL_NOT_VERIFIED', 403),

  // Client errors
  badRequest: (message: string = 'Bad request') =>
    errorResponse(message, 'BAD_REQUEST', 400),

  validationError: (errors: Record<string, string[]>) =>
    errorResponse('Validation failed', 'VALIDATION_ERROR', 400, { errors }),

  notFound: (resource: string = 'Resource') =>
    errorResponse(`${resource} not found`, 'NOT_FOUND', 404),

  conflict: (message: string = 'Resource already exists') =>
    errorResponse(message, 'CONFLICT', 409),

  // Rate limiting
  rateLimitExceeded: (retryAfter: number) =>
    errorResponse(
      'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter }
    ),

  accountLocked: () =>
    errorResponse(
      'Account is locked due to too many failed login attempts. Please try again later or reset your password.',
      'ACCOUNT_LOCKED',
      423
    ),

  // Server errors
  internalServerError: (message: string = 'An unexpected error occurred') =>
    errorResponse(message, 'INTERNAL_SERVER_ERROR', 500),

  serviceUnavailable: () =>
    errorResponse('Service temporarily unavailable. Please try again later.', 'SERVICE_UNAVAILABLE', 503),

  // MFA errors
  mfaRequired: (mfaToken: string) =>
    errorResponse('MFA verification required', 'MFA_REQUIRED', 403, { mfaToken }),

  invalidMfaCode: () =>
    errorResponse('Invalid MFA code', 'INVALID_MFA_CODE', 401),

  mfaNotEnabled: () =>
    errorResponse('MFA is not enabled for this account', 'MFA_NOT_ENABLED', 400),

  mfaAlreadyEnabled: () =>
    errorResponse('MFA is already enabled for this account', 'MFA_ALREADY_ENABLED', 400),

  // User errors
  userNotFound: () =>
    errorResponse('User not found', 'USER_NOT_FOUND', 404),

  userAlreadyExists: () =>
    errorResponse('A user with this email already exists', 'USER_ALREADY_EXISTS', 409),

  // Session errors
  sessionNotFound: () =>
    errorResponse('Session not found or expired', 'SESSION_NOT_FOUND', 401),

  sessionExpired: () =>
    errorResponse('Your session has expired. Please login again.', 'SESSION_EXPIRED', 401),

  // Password errors
  weakPassword: (requirements: string[]) =>
    errorResponse(
      'Password does not meet security requirements',
      'WEAK_PASSWORD',
      400,
      { requirements }
    ),

  passwordResetTokenInvalid: () =>
    errorResponse('Password reset token is invalid or expired', 'INVALID_RESET_TOKEN', 400),

  // Email errors
  emailVerificationTokenInvalid: () =>
    errorResponse('Email verification token is invalid or expired', 'INVALID_VERIFICATION_TOKEN', 400),

  emailDeliveryFailed: () =>
    errorResponse('Failed to send email. Please try again later.', 'EMAIL_DELIVERY_ERROR', 500),

  // Method errors
  methodNotAllowed: (allowedMethods: string[]) =>
    NextResponse.json(
      {
        success: false,
        error: {
          message: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED',
          statusCode: 405,
          details: { allowedMethods },
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 405,
        headers: {
          Allow: allowedMethods.join(', '),
        },
      }
    ),
};

/**
 * Common success responses
 */
export const SuccessResponses = {
  ok: <T>(data: T, message?: string) => successResponse(data, message, undefined, 200),

  created: <T>(data: T, message?: string) => successResponse(data, message, undefined, 201),

  accepted: <T>(data: T, message?: string) => successResponse(data, message, undefined, 202),

  noContent: () => new NextResponse(null, { status: 204 }),
};
