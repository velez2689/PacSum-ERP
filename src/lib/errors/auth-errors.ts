/**
 * Authentication Error Classes
 * Custom error types for authentication and authorization
 */

export class AuthError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'AUTH_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'Access forbidden', code: string = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Invalid email or password') {
    super(message, 401, 'INVALID_CREDENTIALS');
  }
}

export class TokenExpiredError extends AuthError {
  constructor(message: string = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends AuthError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

export class EmailNotVerifiedError extends AuthError {
  constructor(message: string = 'Email address not verified') {
    super(message, 403, 'EMAIL_NOT_VERIFIED');
  }
}

export class AccountLockedError extends AuthError {
  constructor(message: string = 'Account is locked due to too many failed login attempts') {
    super(message, 423, 'ACCOUNT_LOCKED');
  }
}

export class MFARequiredError extends AuthError {
  public readonly mfaToken: string;

  constructor(mfaToken: string, message: string = 'MFA verification required') {
    super(message, 403, 'MFA_REQUIRED');
    this.mfaToken = mfaToken;
  }
}

export class InvalidMFACodeError extends AuthError {
  constructor(message: string = 'Invalid MFA code') {
    super(message, 401, 'INVALID_MFA_CODE');
  }
}

export class MFANotEnabledError extends AuthError {
  constructor(message: string = 'MFA is not enabled for this account') {
    super(message, 400, 'MFA_NOT_ENABLED');
  }
}

export class MFAAlreadyEnabledError extends AuthError {
  constructor(message: string = 'MFA is already enabled for this account') {
    super(message, 400, 'MFA_ALREADY_ENABLED');
  }
}

export class UserNotFoundError extends AuthError {
  constructor(message: string = 'User not found') {
    super(message, 404, 'USER_NOT_FOUND');
  }
}

export class UserAlreadyExistsError extends AuthError {
  constructor(message: string = 'User with this email already exists') {
    super(message, 409, 'USER_ALREADY_EXISTS');
  }
}

export class SessionNotFoundError extends AuthError {
  constructor(message: string = 'Session not found or expired') {
    super(message, 401, 'SESSION_NOT_FOUND');
  }
}

export class SessionExpiredError extends AuthError {
  constructor(message: string = 'Session has expired') {
    super(message, 401, 'SESSION_EXPIRED');
  }
}

export class RateLimitExceededError extends AuthError {
  public readonly retryAfter: number;

  constructor(retryAfter: number, message: string = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class ValidationError extends AuthError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

export class WeakPasswordError extends AuthError {
  public readonly requirements: string[];

  constructor(requirements: string[], message: string = 'Password does not meet security requirements') {
    super(message, 400, 'WEAK_PASSWORD');
    this.requirements = requirements;
  }
}

export class PasswordResetTokenInvalidError extends AuthError {
  constructor(message: string = 'Password reset token is invalid or expired') {
    super(message, 400, 'INVALID_RESET_TOKEN');
  }
}

export class EmailVerificationTokenInvalidError extends AuthError {
  constructor(message: string = 'Email verification token is invalid or expired') {
    super(message, 400, 'INVALID_VERIFICATION_TOKEN');
  }
}

export class InsufficientPermissionsError extends AuthError {
  public readonly requiredRole: string;

  constructor(requiredRole: string, message: string = 'Insufficient permissions') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS');
    this.requiredRole = requiredRole;
  }
}

export class OrganizationAccessDeniedError extends AuthError {
  constructor(message: string = 'Access to this organization is denied') {
    super(message, 403, 'ORGANIZATION_ACCESS_DENIED');
  }
}

export class CSRFTokenMismatchError extends AuthError {
  constructor(message: string = 'CSRF token mismatch') {
    super(message, 403, 'CSRF_TOKEN_MISMATCH');
  }
}

export class DatabaseError extends AuthError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class EmailDeliveryError extends AuthError {
  constructor(message: string = 'Failed to send email') {
    super(message, 500, 'EMAIL_DELIVERY_ERROR');
  }
}

/**
 * Check if error is an operational error (safe to expose to client)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AuthError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get safe error message for client
 */
export function getSafeErrorMessage(error: Error): string {
  if (isOperationalError(error)) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Get error status code
 */
export function getErrorStatusCode(error: Error): number {
  if (error instanceof AuthError) {
    return error.statusCode;
  }
  return 500;
}
