/**
 * Session Manager
 * Handles user sessions, token versioning, and session invalidation
 */

import { v4 as uuidv4 } from 'uuid';
import { SESSION_CONFIG } from '@/lib/config/security';
import { queryDb, queryDbSingle, executeDb } from '@/lib/db/postgres';

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

  try {
    await executeDb(
      `INSERT INTO sessions (id, user_id, token_version, ip_address, user_agent, last_activity, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sessionId,
        data.userId,
        1,
        data.ipAddress || null,
        data.userAgent || null,
        now.toISOString(),
        expiresAt.toISOString(),
        now.toISOString(),
      ]
    );
  } catch (error) {
    throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Clean up old sessions if user has too many
  await cleanupOldSessions(data.userId);

  return {
    id: sessionId,
    userId: data.userId,
    tokenVersion: 1,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    lastActivity: now,
    expiresAt,
    createdAt: now,
  };
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const data = await queryDbSingle<any>(
      'SELECT * FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (!data) {
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
  } catch {
    return null;
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const now = new Date();

  await executeDb(
    'UPDATE sessions SET last_activity = $1 WHERE id = $2',
    [now.toISOString(), sessionId]
  );
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await executeDb('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await executeDb('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/**
 * Invalidate all sessions except current
 */
export async function invalidateOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<void> {
  await executeDb(
    'DELETE FROM sessions WHERE user_id = $1 AND id != $2',
    [userId, currentSessionId]
  );
}

/**
 * Increment token version (invalidates all tokens for this session)
 */
export async function incrementTokenVersion(sessionId: string): Promise<number> {
  const data = await queryDbSingle<any>(
    'SELECT token_version FROM sessions WHERE id = $1',
    [sessionId]
  );

  if (!data) {
    throw new Error('Session not found');
  }

  const newVersion = data.token_version + 1;

  await executeDb(
    'UPDATE sessions SET token_version = $1 WHERE id = $2',
    [newVersion, sessionId]
  );

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
  try {
    const data = await queryDb<any>(
      'SELECT * FROM sessions WHERE user_id = $1 ORDER BY last_activity DESC',
      [userId]
    );

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
  } catch {
    return [];
  }
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

  try {
    const data = await queryDb<any>(
      'DELETE FROM sessions WHERE expires_at < $1 RETURNING id',
      [now.toISOString()]
    );

    return data?.length || 0;
  } catch (error) {
    throw new Error(`Failed to cleanup sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
