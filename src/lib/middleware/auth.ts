/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-manager';
import { validateSession } from '@/lib/auth/session-manager';
import { UnauthorizedError, SessionExpiredError, InvalidTokenError } from '@/lib/errors/auth-errors';
import { COOKIE_CONFIG } from '@/lib/config/jwt';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    sessionId: string;
  };
}

/**
 * Extract token from request
 */
function extractToken(request: NextRequest): string | null {
  // Try to get from cookie first
  const cookieToken = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Try Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Authenticate request and attach user info
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    sessionId: string;
  };
  error?: Error;
}> {
  try {
    // Extract token
    const token = extractToken(request);
    if (!token) {
      return {
        authenticated: false,
        error: new UnauthorizedError('No authentication token provided'),
      };
    }

    // Verify token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return {
        authenticated: false,
        error: new InvalidTokenError(error instanceof Error ? error.message : 'Invalid token'),
      };
    }

    // Validate session
    const sessionValidation = await validateSession(payload.sessionId);
    if (!sessionValidation.valid) {
      return {
        authenticated: false,
        error: new SessionExpiredError(sessionValidation.reason),
      };
    }

    // Check if session token version matches
    if (sessionValidation.session?.tokenVersion !== payload.userId) {
      // Token version mismatch - tokens have been revoked
      return {
        authenticated: false,
        error: new InvalidTokenError('Token has been revoked'),
      };
    }

    // Get user from database to ensure they still exist and are active
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, organization_id, email_verified, is_active')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      return {
        authenticated: false,
        error: new UnauthorizedError('User not found'),
      };
    }

    if (!user.is_active) {
      return {
        authenticated: false,
        error: new UnauthorizedError('Account is deactivated'),
      };
    }

    // Return authenticated user info
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
        sessionId: payload.sessionId,
      },
    };
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error : new Error('Authentication failed'),
    };
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: NonNullable<AuthenticatedRequest['user']>) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated || !auth.user) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: auth.error?.message || 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 401 }
    );
  }

  return handler(request, auth.user);
}

/**
 * Optional authentication middleware (doesn't require auth but attaches user if present)
 */
export async function optionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, user?: NonNullable<AuthenticatedRequest['user']>) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  return handler(request, auth.user);
}

/**
 * Require email verification middleware
 */
export async function requireEmailVerification(
  request: NextRequest,
  user: NonNullable<AuthenticatedRequest['user']>,
  handler: (request: NextRequest, user: NonNullable<AuthenticatedRequest['user']>) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get user email verification status
  const { data: userData } = await supabase
    .from('users')
    .select('email_verified')
    .eq('id', user.id)
    .single();

  if (!userData?.email_verified) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Please verify your email address to continue',
          code: 'EMAIL_NOT_VERIFIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 403 }
    );
  }

  return handler(request, user);
}
