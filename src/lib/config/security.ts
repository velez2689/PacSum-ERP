/**
 * Security Configuration
 * General security settings, CORS, CSP, rate limiting
 */

// Password requirements
export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // Login attempts
  LOGIN: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  },

  // Signup attempts
  SIGNUP: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },

  // Password reset requests
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },

  // Email verification requests
  EMAIL_VERIFICATION: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
  },

  // API requests (general)
  API: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },

  // MFA verification
  MFA: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    LOCKOUT_DURATION: 15 * 60 * 1000,
  },
} as const;

// CORS configuration
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
  ],
  CREDENTIALS: true,
  MAX_AGE: 86400, // 24 hours
} as const;

// Content Security Policy
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
} as const;

// Security headers
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',

  // HSTS (HTTPS only)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
} as const;

// Session configuration
export const SESSION_CONFIG = {
  MAX_CONCURRENT_SESSIONS: 5, // Maximum number of concurrent sessions per user
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours of inactivity
  SESSION_ABSOLUTE_TIMEOUT: 7 * 24 * 60 * 60 * 1000, // 7 days absolute
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

// Audit log events (must match audit_logs table constraint)
export const AUDIT_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  MFA_FAILED: 'MFA_FAILED',
  MFA_VERIFIED: 'MFA_VERIFIED',
  MFA_ENABLED: 'MFA_ENABLED',
  LOGOUT: 'LOGOUT',

  // User account events
  SIGNUP_SUCCESS: 'SIGNUP',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',

  // Data operations
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SELECT: 'SELECT',

  // Security events
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
} as const;

// Encryption settings
export const ENCRYPTION_CONFIG = {
  BCRYPT_ROUNDS: 12, // Cost factor for bcrypt
  CRYPTO_ALGORITHM: 'aes-256-gcm',
  CRYPTO_KEY_LENGTH: 32,
  CRYPTO_IV_LENGTH: 16,
} as const;

// Validation settings
export const VALIDATION_CONFIG = {
  EMAIL_MAX_LENGTH: 255,
  NAME_MAX_LENGTH: 100,
  NAME_MIN_LENGTH: 1,
} as const;
