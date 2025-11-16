/**
 * Login API Route
 * Handles user authentication with email/password and optional MFA
 */

import { NextRequest } from 'next/server';
import { queryDbSingle, executeDb } from '@/lib/db/postgres';
import { comparePassword } from '@/lib/auth/password-utils';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/token-manager';
import { createSession } from '@/lib/auth/session-manager';
import { loginSchema } from '@/lib/auth/validators';
import { handleError } from '@/lib/errors/error-handler';
import {
  InvalidCredentialsError,
  EmailNotVerifiedError,
  MFARequiredError,
  AccountLockedError
} from '@/lib/errors/auth-errors';
import { successResponse } from '@/utils/error-responses';
import { COOKIE_CONFIG, JWT_CONFIG } from '@/lib/config/jwt';
import { AUDIT_EVENTS } from '@/lib/config/security';
import { verifyTOTP } from '@/lib/auth/mfa-utils';
import { generateMFASessionToken } from '@/lib/auth/mfa-utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return handleError(validation.error);
    }

    const { email, password, mfaCode, rememberMe } = validation.data;

    // Get user from database
    const user = await queryDbSingle<any>(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (!user) {
      // Don't reveal whether user exists
      throw new InvalidCredentialsError();
    }

    // Check if account is active
    if (user.status !== 'active') {
      throw new AccountLockedError('Your account has been deactivated');
    }

    // Verify password
    const passwordValid = await comparePassword(password, user.password_hash);
    if (!passwordValid) {
      // Audit failed login
      await auditLog(user.id, AUDIT_EVENTS.LOGIN_FAILED, {
        reason: 'invalid_password',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });

      throw new InvalidCredentialsError();
    }

    // Check if email is verified
    if (!user.email_verified) {
      throw new EmailNotVerifiedError();
    }

    // Handle MFA if enabled
    if (user.mfa_enabled) {
      if (!mfaCode) {
        // Generate temporary MFA session token
        const mfaToken = generateMFASessionToken();

        // Store MFA session temporarily (5 minutes)
        try {
          await executeDb(
            `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.id, 'MFA_REQUIRED', 'auth_mfa', user.id, 'pending', new Date().toISOString()]
          );
        } catch (error) {
          console.error('Failed to log MFA session:', error);
        }

        throw new MFARequiredError(mfaToken);
      }

      // Verify MFA code
      const mfaValid = verifyTOTP(user.mfa_secret, mfaCode);
      if (!mfaValid) {
        // Audit failed MFA
        await auditLog(user.id, AUDIT_EVENTS.MFA_FAILED, {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        });

        throw new InvalidCredentialsError('Invalid MFA code');
      }

      // Audit successful MFA
      await auditLog(user.id, AUDIT_EVENTS.MFA_VERIFIED);
    }

    // Create session
    const session = await createSession({
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      rememberMe,
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId: session.id,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId: session.id,
      tokenVersion: session.tokenVersion,
    });

    // Audit successful login
    await auditLog(user.id, AUDIT_EVENTS.LOGIN_SUCCESS, {
      session_id: session.id,
      ip: session.ipAddress,
    });

    // Create response
    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          organizationId: user.organization_id,
          emailVerified: user.email_verified,
          avatar: user.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + JWT_CONFIG.ACCESS_TOKEN_EXPIRY_MS).toISOString(),
      },
      'Login successful'
    );

    // Set cookies
    response.cookies.set(COOKIE_CONFIG.ACCESS_TOKEN_NAME, accessToken, {
      httpOnly: COOKIE_CONFIG.HTTP_ONLY,
      secure: COOKIE_CONFIG.SECURE,
      sameSite: COOKIE_CONFIG.SAME_SITE,
      path: COOKIE_CONFIG.PATH,
      maxAge: JWT_CONFIG.ACCESS_TOKEN_EXPIRY_MS / 1000,
    });

    response.cookies.set(COOKIE_CONFIG.REFRESH_TOKEN_NAME, refreshToken, {
      httpOnly: COOKIE_CONFIG.HTTP_ONLY,
      secure: COOKIE_CONFIG.SECURE,
      sameSite: COOKIE_CONFIG.SAME_SITE,
      path: COOKIE_CONFIG.PATH,
      maxAge: JWT_CONFIG.REFRESH_TOKEN_EXPIRY_MS / 1000,
    });

    return response;
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/auth/login',
      method: 'POST',
    });
  }
}

/**
 * Audit log helper
 */
async function auditLog(
  userId: string,
  event: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await executeDb(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, event, 'auth', userId, JSON.stringify(metadata || {}), 'success', new Date().toISOString()]
    );
  } catch (error) {
    // Log audit errors but don't fail the login
    console.error('Failed to log audit:', error);
  }
}
