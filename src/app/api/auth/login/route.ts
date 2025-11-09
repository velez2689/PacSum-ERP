/**
 * Login API Route
 * Handles user authentication with email/password and optional MFA
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
import { RateLimiters } from '@/lib/middleware/rate-limiter';
import { COOKIE_CONFIG, JWT_CONFIG } from '@/lib/config/jwt';
import { AUDIT_EVENTS } from '@/lib/config/security';
import { verifyTOTP } from '@/lib/auth/mfa-utils';
import { generateMFASessionToken } from '@/lib/auth/mfa-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Apply rate limiting
    const identifier = email.toLowerCase();
    await RateLimiters.login(request, identifier);

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      // Don't reveal whether user exists
      throw new InvalidCredentialsError();
    }

    // Check if account is active
    if (!user.is_active) {
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
        await supabase.from('mfa_sessions').insert({
          token: mfaToken,
          user_id: user.id,
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        });

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
          avatar: user.avatar,
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
  metadata?: Record<string, any>
): Promise<void> {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    event,
    metadata,
    created_at: new Date().toISOString(),
  });
}
