/**
 * Next.js Middleware
 * Global middleware for authentication, authorization, and security
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/token-manager';
import { COOKIE_CONFIG } from '@/lib/config/jwt';
import { applySecurityHeaders, applyCorsHeaders } from '@/lib/middleware/security-headers';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/verify',
  '/auth/reset-password',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/verify-email',
  '/api/auth/send-reset-email',
  '/api/auth/reset-password',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard', // This will match /dashboard and /dashboard/* via startsWith in isProtectedRoute
  '/api/auth/me',
  '/api/auth/mfa',
  '/api/clients',
  '/api/transactions',
  '/api/invoices',
];

// API routes that should be excluded from middleware
const API_EXCLUDED_ROUTES = [
  '/api/health',
  '/api/ping',
];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === pathname) return true;
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return false;
  });
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route should be excluded from middleware
 */
function isExcludedRoute(pathname: string): boolean {
  return API_EXCLUDED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Get authentication status from request
 */
async function getAuthStatus(request: NextRequest): Promise<{
  authenticated: boolean;
  userId?: string;
  role?: string;
}> {
  // Get token from cookie
  const token = request.cookies.get(COOKIE_CONFIG.ACCESS_TOKEN_NAME)?.value;

  if (!token) {
    return { authenticated: false };
  }

  try {
    const payload = verifyAccessToken(token);
    return {
      authenticated: true,
      userId: payload.userId,
      role: payload.role,
    };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/public/') ||
    isExcludedRoute(pathname)
  ) {
    return NextResponse.next();
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    applyCorsHeaders(response, request);
    return response;
  }

  // Get authentication status
  const authStatus = await getAuthStatus(request);

  // Redirect authenticated users away from auth pages (except during the actual login submission)
  // The auth context will handle the redirect after successful login
  if (authStatus.authenticated && pathname === '/auth/login') {
    // Get the redirect URL from query params, or default to root
    const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Protect API routes that require authentication
  // Note: Page routes are protected at the component level using the auth context
  if (isProtectedRoute(pathname) && pathname.startsWith('/api/') && !authStatus.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 401 }
    );
  }

  // Continue with request
  const response = NextResponse.next();

  // Apply security headers
  applySecurityHeaders(response);
  applyCorsHeaders(response, request);

  // Add custom headers for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Middleware-Path', pathname);
    response.headers.set('X-Auth-Status', authStatus.authenticated ? 'authenticated' : 'unauthenticated');
  }

  return response;
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
