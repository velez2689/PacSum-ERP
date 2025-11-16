/**
 * Refresh Token API Route
 * Generates new access token using refresh token
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/token-manager';
import { validateSession } from '@/lib/auth/session-manager';
import { handleError } from '@/lib/errors/error-handler';
import { InvalidTokenError, SessionExpiredError } from '@/lib/errors/auth-errors';
import { successResponse } from '@/utils/error-responses';
import { COOKIE_CONFIG, JWT_CONFIG } from '@/lib/config/jwt';
import { AUDIT_EVENTS } from '@/lib/config/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const token =
      request.cookies.get(COOKIE_CONFIG.REFRESH_TOKEN_NAME)?.value ||
      (await request.json().then((body) => body.refreshToken));

    if (!token) {
      throw new InvalidTokenError('No refresh token provided');
    }

    // Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (_error) {
      throw new InvalidTokenError('Invalid or expired refresh token');
    }

    // Validate session
    const sessionValidation = await validateSession(payload.sessionId);
    if (!sessionValidation.valid || !sessionValidation.session) {
      throw new SessionExpiredError(sessionValidation.reason);
    }

    // Verify token version matches
    if (sessionValidation.session.tokenVersion !== payload.tokenVersion) {
      throw new InvalidTokenError('Token has been revoked');
    }

    // Get user to ensure they still exist and are active
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, organization_id, is_active')
      .eq('id', payload.userId)
      .single();

    if (userError || !user || !user.is_active) {
      throw new InvalidTokenError('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId: payload.sessionId,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      sessionId: payload.sessionId,
      tokenVersion: sessionValidation.session.tokenVersion,
    });

    // Audit log
    await auditLog(user.id, AUDIT_EVENTS.TOKEN_REFRESHED, {
      session_id: payload.sessionId,
    });

    // Create response
    const response = successResponse(
      {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + JWT_CONFIG.ACCESS_TOKEN_EXPIRY_MS).toISOString(),
      },
      'Token refreshed successfully'
    );

    // Update cookies
    response.cookies.set(COOKIE_CONFIG.ACCESS_TOKEN_NAME, newAccessToken, {
      httpOnly: COOKIE_CONFIG.HTTP_ONLY,
      secure: COOKIE_CONFIG.SECURE,
      sameSite: COOKIE_CONFIG.SAME_SITE,
      path: COOKIE_CONFIG.PATH,
      maxAge: JWT_CONFIG.ACCESS_TOKEN_EXPIRY_MS / 1000,
    });

    response.cookies.set(COOKIE_CONFIG.REFRESH_TOKEN_NAME, newRefreshToken, {
      httpOnly: COOKIE_CONFIG.HTTP_ONLY,
      secure: COOKIE_CONFIG.SECURE,
      sameSite: COOKIE_CONFIG.SAME_SITE,
      path: COOKIE_CONFIG.PATH,
      maxAge: JWT_CONFIG.REFRESH_TOKEN_EXPIRY_MS / 1000,
    });

    return response;
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/auth/refresh',
      method: 'POST',
    });
  }
}

async function auditLog(
  userId: string,
  event: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    event,
    metadata,
    created_at: new Date().toISOString(),
  });
}
