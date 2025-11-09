/**
 * Rate Limiter Middleware
 * Prevents brute force attacks and API abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimitExceededError } from '@/lib/errors/auth-errors';
import { RATE_LIMIT_CONFIG } from '@/lib/config/security';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
 * Check rate limit
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${action}:${identifier}`;
  const now = new Date();

  // Get existing rate limit record
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('key', key)
    .single();

  // Calculate window start
  const windowStart = new Date(now.getTime() - config.windowMs);

  if (!existing) {
    // Create new rate limit record
    await supabase.from('rate_limits').insert({
      key,
      count: 1,
      window_start: now.toISOString(),
      expires_at: new Date(now.getTime() + config.windowMs).toISOString(),
    });

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }

  const existingWindowStart = new Date(existing.window_start);

  // Check if we're in a new window
  if (existingWindowStart < windowStart) {
    // Reset counter for new window
    await supabase
      .from('rate_limits')
      .update({
        count: 1,
        window_start: now.toISOString(),
        expires_at: new Date(now.getTime() + config.windowMs).toISOString(),
      })
      .eq('key', key);

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }

  // Check if locked out
  if (existing.locked_until && new Date(existing.locked_until) > now) {
    const retryAfter = Math.ceil(
      (new Date(existing.locked_until).getTime() - now.getTime()) / 1000
    );

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(existing.locked_until),
      retryAfter,
    };
  }

  // Check if limit exceeded
  if (existing.count >= config.maxAttempts) {
    // Set lockout if configured
    let lockedUntil: string | undefined;
    let retryAfter: number | undefined;

    if (config.lockoutDuration) {
      lockedUntil = new Date(now.getTime() + config.lockoutDuration).toISOString();
      retryAfter = Math.ceil(config.lockoutDuration / 1000);
    } else {
      retryAfter = Math.ceil(
        (new Date(existing.expires_at).getTime() - now.getTime()) / 1000
      );
    }

    await supabase
      .from('rate_limits')
      .update({ locked_until: lockedUntil })
      .eq('key', key);

    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(existing.expires_at),
      retryAfter,
    };
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .update({ count: existing.count + 1 })
    .eq('key', key);

  return {
    allowed: true,
    remaining: config.maxAttempts - existing.count - 1,
    resetAt: new Date(existing.expires_at),
  };
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(action: string, config: RateLimitConfig) {
  return async (
    request: NextRequest,
    userId?: string,
    handler?: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request, userId);
    const result = await checkRateLimit(identifier, action, config);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      if (result.retryAfter) {
        headers.set('Retry-After', result.retryAfter.toString());
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
            details: {
              retryAfter: result.retryAfter,
              resetAt: result.resetAt.toISOString(),
            },
            timestamp: new Date().toISOString(),
          },
        },
        { status: 429, headers }
      );
    }

    // If handler provided, execute it
    if (handler) {
      const response = await handler(request);
      // Add rate limit headers to response
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Otherwise, return success
    return NextResponse.json({ allowed: true }, { headers });
  };
}

/**
 * Pre-configured rate limiters for common actions
 */
export const RateLimiters = {
  login: createRateLimiter('login', RATE_LIMIT_CONFIG.LOGIN),
  signup: createRateLimiter('signup', RATE_LIMIT_CONFIG.SIGNUP),
  passwordReset: createRateLimiter('password-reset', RATE_LIMIT_CONFIG.PASSWORD_RESET),
  emailVerification: createRateLimiter('email-verification', RATE_LIMIT_CONFIG.EMAIL_VERIFICATION),
  mfa: createRateLimiter('mfa', RATE_LIMIT_CONFIG.MFA),
  api: createRateLimiter('api', RATE_LIMIT_CONFIG.API),
};

/**
 * Clear rate limit for a specific identifier and action
 */
export async function clearRateLimit(identifier: string, action: string): Promise<void> {
  const key = `ratelimit:${action}:${identifier}`;
  await supabase.from('rate_limits').delete().eq('key', key);
}

/**
 * Clean up expired rate limits (run as scheduled job)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = new Date();

  const { data, error } = await supabase
    .from('rate_limits')
    .delete()
    .lt('expires_at', now.toISOString())
    .select();

  if (error) {
    throw new Error(`Failed to cleanup rate limits: ${error.message}`);
  }

  return data?.length || 0;
}

/**
 * Get rate limit status (for debugging/monitoring)
 */
export async function getRateLimitStatus(
  identifier: string,
  action: string
): Promise<{
  count: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  lockedUntil?: Date;
} | null> {
  const key = `ratelimit:${action}:${identifier}`;

  const { data } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('key', key)
    .single();

  if (!data) {
    return null;
  }

  const config = getConfigForAction(action);

  return {
    count: data.count,
    limit: config.maxAttempts,
    remaining: Math.max(0, config.maxAttempts - data.count),
    resetAt: new Date(data.expires_at),
    lockedUntil: data.locked_until ? new Date(data.locked_until) : undefined,
  };
}

/**
 * Get rate limit config for action
 */
function getConfigForAction(action: string): RateLimitConfig {
  const configs: Record<string, RateLimitConfig> = {
    login: RATE_LIMIT_CONFIG.LOGIN,
    signup: RATE_LIMIT_CONFIG.SIGNUP,
    'password-reset': RATE_LIMIT_CONFIG.PASSWORD_RESET,
    'email-verification': RATE_LIMIT_CONFIG.EMAIL_VERIFICATION,
    mfa: RATE_LIMIT_CONFIG.MFA,
    api: RATE_LIMIT_CONFIG.API,
  };

  return configs[action] || RATE_LIMIT_CONFIG.API;
}
