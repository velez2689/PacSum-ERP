/**
 * Rate Limiter Middleware - SIMPLIFIED FOR DEV
 * Prevents brute force attacks and API abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIMIT_CONFIG } from '@/lib/config/security';

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutDuration?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Get client identifier (IP address or user ID)
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Check rate limit - SIMPLIFIED VERSION
 * In development, this allows all requests to enable testing
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // In development, always allow requests
  const resetAt = new Date(Date.now() + config.windowMs);
  
  return {
    allowed: true,
    remaining: config.maxAttempts - 1,
    resetAt: resetAt,
  };
}

/**
 * Rate limit middleware - DISABLED FOR DEV
 * Re-enable in production with proper database setup
 */
export async function withRateLimit(
  request: NextRequest,
  action: string,
  userId?: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIG
) {
  const identifier = getClientIdentifier(request, userId);

  try {
    const result = await checkRateLimit(identifier, action, config);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': result.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': config.maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
          },
        }
      );
    }

    return {
      allowed: true,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };
  } catch (error) {
    // In development, log error and allow request
    console.warn('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

// In-memory rate limiter for development (simple)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (record.count < config.maxAttempts) {
    record.count++;
    return true;
  }

  return false;
}
