/**
 * Security Headers Middleware
 * Sets security-related HTTP headers (CORS, CSP, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { CORS_CONFIG, CSP_DIRECTIVES, SECURITY_HEADERS } from '@/lib/config/security';

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin');

  // Check if origin is allowed
  if (origin && CORS_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (CORS_CONFIG.ALLOWED_ORIGINS.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  // Set other CORS headers
  response.headers.set(
    'Access-Control-Allow-Methods',
    CORS_CONFIG.ALLOWED_METHODS.join(', ')
  );

  response.headers.set(
    'Access-Control-Allow-Headers',
    CORS_CONFIG.ALLOWED_HEADERS.join(', ')
  );

  if (CORS_CONFIG.CREDENTIALS) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set('Access-Control-Max-Age', CORS_CONFIG.MAX_AGE.toString());

  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, request);
}

/**
 * Build Content Security Policy header value
 */
function buildCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply all predefined security headers
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    if (value) {
      response.headers.set(header, value);
    }
  });

  // Apply Content Security Policy
  const csp = buildCSPHeader();
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflightRequest(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Apply CORS headers
  applyCorsHeaders(response, request);

  // Apply security headers
  applySecurityHeaders(response);

  return response;
}

/**
 * Create security headers for API routes
 */
export function createSecurityHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  // CORS headers
  const origin = request.headers.get('origin');
  if (origin && CORS_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', CORS_CONFIG.ALLOWED_METHODS.join(', '));
  headers.set('Access-Control-Allow-Headers', CORS_CONFIG.ALLOWED_HEADERS.join(', '));

  if (CORS_CONFIG.CREDENTIALS) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Security headers
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    if (value) {
      headers.set(header, value);
    }
  });

  // CSP
  headers.set('Content-Security-Policy', buildCSPHeader());

  return headers;
}

/**
 * Validate origin against allowed origins
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  return CORS_CONFIG.ALLOWED_ORIGINS.includes(origin) ||
         CORS_CONFIG.ALLOWED_ORIGINS.includes('*');
}

/**
 * Create response with security headers
 */
export function createSecureResponse(
  data: any,
  init: ResponseInit = {},
  request?: NextRequest
): NextResponse {
  const response = NextResponse.json(data, init);

  if (request) {
    applyCorsHeaders(response, request);
  }

  applySecurityHeaders(response);

  return response;
}

/**
 * CSRF token validation
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const csrfToken = request.headers.get('X-CSRF-Token');
  const cookieToken = request.cookies.get('csrf_token')?.value;

  // Both tokens must exist and match
  if (!csrfToken || !cookieToken) {
    return false;
  }

  return csrfToken === cookieToken;
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF cookie
 */
export function setCSRFCookie(response: NextResponse): NextResponse {
  const token = generateCSRFToken();

  response.cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Also return token in response header for client to use
  response.headers.set('X-CSRF-Token', token);

  return response;
}
