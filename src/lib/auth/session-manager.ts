/**
 * Session Manager
 * Handles user sessions, token versioning, and session invalidation
 */

import { v4 as uuidv4 } from 'uuid';
import { SESSION_CONFIG } from '@/lib/config/security';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Session {
  id: string;
  userId: string;
  tokenVersion: number;
  ipAddress?: string;
  userAgent?: string;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface SessionCreateData {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  rememberMe?: boolean;
}

/**
 * Create a new session
 */
export async function createSession(data: SessionCreateData): Promise<Session> {
  const sessionId = uuidv4();
  const now = new Date();

  // Calculate expiration based on remember me
  const expirationMs = data.rememberMe
    ? SESSION_CONFIG.REMEMBER_ME_DURATION
    : SESSION_CONFIG.SESSION_ABSOLUTE_TIMEOUT;

  const expiresAt = new Date(now.getTime() + expirationMs);

  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      id: sessionId,
      user_id: data.userId,
      token_version: 1,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      last_activity: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  // Clean up old sessions if user has too many
  await cleanupOldSessions(data.userId);

  return {
    id: session.id,
    userId: session.user_id,
    tokenVersion: session.token_version,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    lastActivity: new Date(session.last_activity),
    expiresAt: new Date(session.expires_at),
    createdAt: new Date(session.created_at),
  };
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    tokenVersion: data.token_version,
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
    lastActivity: new Date(data.last_activity),
    expiresAt: new Date(data.expires_at),
    createdAt: new Date(data.created_at),
  };
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const now = new Date();

  await supabase
    .from('sessions')
    .update({
      last_activity: now.toISOString(),
    })
    .eq('id', sessionId);
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await supabase.from('sessions').delete().eq('id', sessionId);
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await supabase.from('sessions').delete().eq('user_id', userId);
}

/**
 * Invalidate all sessions except current
 */
export async function invalidateOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<void> {
  await supabase
    .from('sessions')
    .delete()
    .eq('user_id', userId)
    .neq('id', currentSessionId);
}

/**
 * Increment token version (invalidates all tokens for this session)
 */
export async function incrementTokenVersion(sessionId: string): Promise<number> {
  const { data, error } = await supabase
    .from('sessions')
    .select('token_version')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    throw new Error('Session not found');
  }

  const newVersion = data.token_version + 1;

  await supabase
    .from('sessions')
    .update({ token_version: newVersion })
    .eq('id', sessionId);

  return newVersion;
}

/**
 * Validate session and check expiration
 */
export async function validateSession(sessionId: string): Promise<{
  valid: boolean;
  session?: Session;
  reason?: string;
}> {
  const session = await getSession(sessionId);

  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }

  const now = new Date();

  // Check absolute expiration
  if (session.expiresAt < now) {
    await invalidateSession(sessionId);
    return { valid: false, reason: 'Session expired (absolute timeout)' };
  }

  // Check inactivity timeout
  const inactivityMs = now.getTime() - session.lastActivity.getTime();
  if (inactivityMs > SESSION_CONFIG.SESSION_TIMEOUT) {
    await invalidateSession(sessionId);
    return { valid: false, reason: 'Session expired (inactivity timeout)' };
  }

  // Update last activity
  await updateSessionActivity(sessionId);

  return { valid: true, session };
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_activity', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((s) => ({
    id: s.id,
    userId: s.user_id,
    tokenVersion: s.token_version,
    ipAddress: s.ip_address,
    userAgent: s.user_agent,
    lastActivity: new Date(s.last_activity),
    expiresAt: new Date(s.expires_at),
    createdAt: new Date(s.created_at),
  }));
}

/**
 * Clean up old/expired sessions for a user
 */
export async function cleanupOldSessions(userId: string): Promise<void> {
  const sessions = await getUserSessions(userId);

  // Remove expired sessions
  const now = new Date();
  const expiredSessions = sessions.filter((s) => s.expiresAt < now);

  for (const session of expiredSessions) {
    await invalidateSession(session.id);
  }

  // If user still has too many sessions, remove oldest ones
  const activeSessions = sessions.filter((s) => s.expiresAt >= now);

  if (activeSessions.length > SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
    const sessionsToRemove = activeSessions
      .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
      .slice(0, activeSessions.length - SESSION_CONFIG.MAX_CONCURRENT_SESSIONS);

    for (const session of sessionsToRemove) {
      await invalidateSession(session.id);
    }
  }
}

/**
 * Clean up all expired sessions (run as a scheduled job)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();

  const { data, error } = await supabase
    .from('sessions')
    .delete()
    .lt('expires_at', now.toISOString())
    .select();

  if (error) {
    throw new Error(`Failed to cleanup sessions: ${error.message}`);
  }

  return data?.length || 0;
}
