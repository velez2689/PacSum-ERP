-- =============================================================================
-- PACSUM ERP - Sessions Table
-- =============================================================================
-- File: 005_sessions.sql
-- Purpose: Create sessions table for user session management
-- Author: Dana Querymaster (Database Engineer)
-- Date: 2024-11-14
-- Compatible with: PostgreSQL 13+, Supabase
-- =============================================================================

-- =============================================================================
-- SESSIONS TABLE
-- Manages user session tokens and session invalidation
-- =============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Token versioning for instant session invalidation
    token_version INTEGER NOT NULL DEFAULT 1,
    -- Request context
    ip_address INET,
    user_agent TEXT,
    -- Activity tracking
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Session expiration
    expires_at TIMESTAMPTZ NOT NULL,
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE sessions IS 'User session management and token versioning for instant invalidation';
COMMENT ON COLUMN sessions.token_version IS 'Incremented to invalidate all tokens in this session';
COMMENT ON COLUMN sessions.expires_at IS 'Absolute session expiration time';

-- Create indexes for common queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity DESC);

-- =============================================================================
-- END OF SESSIONS MIGRATION
-- =============================================================================
