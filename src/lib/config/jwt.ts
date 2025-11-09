/**
 * JWT Configuration
 * Handles JWT token settings and secrets
 */

export const JWT_CONFIG = {
  // Access token settings
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-change-in-production',
  ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes
  ACCESS_TOKEN_EXPIRY_MS: 15 * 60 * 1000, // 15 minutes in milliseconds

  // Refresh token settings
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-in-production',
  REFRESH_TOKEN_EXPIRY: '7d', // 7 days
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds

  // Email verification token settings
  EMAIL_VERIFICATION_SECRET: process.env.JWT_EMAIL_VERIFICATION_SECRET || 'your-email-verification-secret',
  EMAIL_VERIFICATION_EXPIRY: '24h', // 24 hours
  EMAIL_VERIFICATION_EXPIRY_MS: 24 * 60 * 60 * 1000,

  // Password reset token settings
  PASSWORD_RESET_SECRET: process.env.JWT_PASSWORD_RESET_SECRET || 'your-password-reset-secret',
  PASSWORD_RESET_EXPIRY: '1h', // 1 hour
  PASSWORD_RESET_EXPIRY_MS: 60 * 60 * 1000,

  // JWT issuer and audience
  ISSUER: 'pacsum-erp',
  AUDIENCE: 'pacsum-erp-users',

  // Algorithm
  ALGORITHM: 'HS256' as const,
} as const;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  type: 'access' | 'refresh' | 'email-verification' | 'password-reset';
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AccessTokenPayload extends JWTPayload {
  type: 'access';
  sessionId: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  type: 'refresh';
  sessionId: string;
  tokenVersion: number;
}

export interface EmailVerificationPayload extends JWTPayload {
  type: 'email-verification';
}

export interface PasswordResetPayload extends JWTPayload {
  type: 'password-reset';
  passwordHash: string; // To invalidate token if password already changed
}

// Cookie settings
export const COOKIE_CONFIG = {
  ACCESS_TOKEN_NAME: 'access_token',
  REFRESH_TOKEN_NAME: 'refresh_token',

  // Cookie options
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === 'production',
  SAME_SITE: 'lax' as const,
  PATH: '/',

  // Domain (set in production)
  DOMAIN: process.env.COOKIE_DOMAIN,
} as const;
