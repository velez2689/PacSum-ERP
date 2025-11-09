/**
 * Token Manager
 * JWT token generation, validation, and management
 */

import jwt from 'jsonwebtoken';
import {
  JWT_CONFIG,
  JWTPayload,
  AccessTokenPayload,
  RefreshTokenPayload,
  EmailVerificationPayload,
  PasswordResetPayload,
} from '@/lib/config/jwt';

/**
 * Generate an access token
 */
export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  sessionId: string;
}): string {
  const tokenPayload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(tokenPayload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: {
  userId: string;
  email: string;
  role: string;
  organizationId?: string;
  sessionId: string;
  tokenVersion: number;
}): string {
  const tokenPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    ...payload,
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  const tokenPayload: Omit<EmailVerificationPayload, 'iat' | 'exp'> = {
    ...payload,
    type: 'email-verification',
  };

  return jwt.sign(tokenPayload, JWT_CONFIG.EMAIL_VERIFICATION_SECRET, {
    expiresIn: JWT_CONFIG.EMAIL_VERIFICATION_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(payload: {
  userId: string;
  email: string;
  role: string;
  passwordHash: string;
}): string {
  const tokenPayload: Omit<PasswordResetPayload, 'iat' | 'exp'> = {
    ...payload,
    type: 'password-reset',
  };

  return jwt.sign(tokenPayload, JWT_CONFIG.PASSWORD_RESET_SECRET, {
    expiresIn: JWT_CONFIG.PASSWORD_RESET_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as AccessTokenPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as RefreshTokenPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Verify and decode email verification token
 */
export function verifyEmailVerificationToken(token: string): EmailVerificationPayload {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.EMAIL_VERIFICATION_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as EmailVerificationPayload;

    if (decoded.type !== 'email-verification') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Email verification token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid email verification token');
    }
    throw error;
  }
}

/**
 * Verify and decode password reset token
 */
export function verifyPasswordResetToken(token: string): PasswordResetPayload {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.PASSWORD_RESET_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as PasswordResetPayload;

    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Password reset token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid password reset token');
    }
    throw error;
  }
}

/**
 * Decode token without verification (use carefully!)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired without throwing
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
