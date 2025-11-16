/**
 * Logout API Route
 * Invalidates user session and clears cookies
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAccessToken } from '@/lib/auth/token-manager';
import { invalidateSession } from '@/lib/auth/session-manager';
import { handleError } from '@/lib/errors/error-handler';
import { successResponse } from '@/utils/error-responses';
import { COOKIE_CONFIG } from '@/lib/config/jwt';
import { AUDIT_EVENTS } from '@/lib/config/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token =
      request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN_NAME)?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        // Verify token and get session info
        const payload = verifyAccessToken(token);

        // Invalidate session
        await invalidateSession(payload.sessionId);

        // Audit log
        await auditLog(payload.userId, AUDIT_EVENTS.LOGOUT, {
          session_id: payload.sessionId,
        });
      } catch (error) {
        // Token might be expired or invalid, but we still want to clear cookies
        console.error('Error during logout:', error);
      }
    }

    // Create response
    const response = successResponse(
      { message: 'Logged out successfully' },
      'Logout successful'
    );

    // Clear cookies
    response.cookies.delete(COOKIE_CONFIG.ACCESS_TOKEN_NAME);
    response.cookies.delete(COOKIE_CONFIG.REFRESH_TOKEN_NAME);

    return response;
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/auth/logout',
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
