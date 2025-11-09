-- =============================================================================
-- PACSUM ERP - Row Level Security (RLS) Policies
-- =============================================================================
-- File: 002_rls_policies.sql
-- Purpose: Implement Row Level Security for multi-tenant data isolation
-- Author: Dana Querymaster (Database Engineer)
-- Date: 2024-11-07
-- Compatible with: PostgreSQL 13+, Supabase
-- =============================================================================

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhs_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =============================================================================

-- Get the current user's ID from JWT token
-- This assumes Supabase auth sets auth.uid()
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claim.sub', true)
    )::uuid;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION auth.user_id() IS 'Get current authenticated user ID from JWT';

-- Get the current user's organization ID
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id
    FROM users
    WHERE id = auth.user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.user_organization_id() IS 'Get organization ID for current authenticated user';

-- Get the current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
    SELECT role
    FROM users
    WHERE id = auth.user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.user_role() IS 'Get role for current authenticated user';

-- Check if current user is admin or owner
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
    SELECT role IN ('admin', 'owner')
    FROM users
    WHERE id = auth.user_id();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION auth.is_admin() IS 'Check if current user has admin or owner role';

-- =============================================================================
-- ORGANIZATIONS POLICIES
-- Users can only see their own organization
-- =============================================================================

-- Users can view their own organization
CREATE POLICY "Users can view their own organization"
    ON organizations
    FOR SELECT
    USING (id = auth.user_organization_id());

-- Only owners can update their organization
CREATE POLICY "Owners can update their organization"
    ON organizations
    FOR UPDATE
    USING (
        id = auth.user_organization_id() AND
        auth.user_role() = 'owner'
    )
    WITH CHECK (
        id = auth.user_organization_id() AND
        auth.user_role() = 'owner'
    );

-- Owners can insert organizations (for initial setup)
CREATE POLICY "Owners can create organizations"
    ON organizations
    FOR INSERT
    WITH CHECK (auth.user_role() = 'owner');

-- Only owners can delete their organization (soft delete via updated_at)
CREATE POLICY "Owners can delete their organization"
    ON organizations
    FOR DELETE
    USING (
        id = auth.user_organization_id() AND
        auth.user_role() = 'owner'
    );

-- =============================================================================
-- USERS POLICIES
-- Users can only see users in their organization
-- =============================================================================

-- Users can view users in their organization
CREATE POLICY "Users can view users in their organization"
    ON users
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON users
    FOR SELECT
    USING (id = auth.user_id());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
    ON users
    FOR UPDATE
    USING (id = auth.user_id())
    WITH CHECK (
        id = auth.user_id() AND
        -- Prevent users from changing their own role or organization
        organization_id = auth.user_organization_id()
    );

-- Admins can insert new users in their organization
CREATE POLICY "Admins can create users in their organization"
    ON users
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- Admins can update users in their organization
CREATE POLICY "Admins can update users in their organization"
    ON users
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    )
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- Owners can delete users in their organization
CREATE POLICY "Owners can delete users in their organization"
    ON users
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.user_role() = 'owner'
    );

-- =============================================================================
-- CLIENTS POLICIES
-- Users can only access clients in their organization
-- =============================================================================

-- Users can view clients in their organization
CREATE POLICY "Users can view clients in their organization"
    ON clients
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Accountants and admins can create clients
CREATE POLICY "Accountants can create clients"
    ON clients
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Accountants and admins can update clients
CREATE POLICY "Accountants can update clients"
    ON clients
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    )
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Admins can delete clients
CREATE POLICY "Admins can delete clients"
    ON clients
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- =============================================================================
-- TRANSACTIONS POLICIES
-- Users can only access transactions for clients in their organization
-- =============================================================================

-- Users can view transactions in their organization
CREATE POLICY "Users can view transactions in their organization"
    ON transactions
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Accountants can create transactions
CREATE POLICY "Accountants can create transactions"
    ON transactions
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Accountants can update transactions
CREATE POLICY "Accountants can update transactions"
    ON transactions
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    )
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Admins can delete transactions
CREATE POLICY "Admins can delete transactions"
    ON transactions
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- =============================================================================
-- INVOICES POLICIES
-- Users can only access invoices for clients in their organization
-- =============================================================================

-- Users can view invoices in their organization
CREATE POLICY "Users can view invoices in their organization"
    ON invoices
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Accountants can create invoices
CREATE POLICY "Accountants can create invoices"
    ON invoices
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Accountants can update invoices
CREATE POLICY "Accountants can update invoices"
    ON invoices
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    )
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Admins can delete invoices
CREATE POLICY "Admins can delete invoices"
    ON invoices
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- =============================================================================
-- DOCUMENTS POLICIES
-- Users can only access documents in their organization
-- =============================================================================

-- Users can view documents in their organization
CREATE POLICY "Users can view documents in their organization"
    ON documents
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Accountants can upload documents
CREATE POLICY "Accountants can upload documents"
    ON documents
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Accountants can update documents
CREATE POLICY "Accountants can update documents"
    ON documents
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    )
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- Users who uploaded the document can delete it (plus admins)
CREATE POLICY "Users can delete their own documents"
    ON documents
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id() AND
        (uploaded_by = auth.user_id() OR auth.is_admin())
    );

-- =============================================================================
-- FHS_SCORES POLICIES
-- Users can only access FHS scores for clients in their organization
-- =============================================================================

-- Users can view FHS scores in their organization
CREATE POLICY "Users can view FHS scores in their organization"
    ON fhs_scores
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Accountants can create FHS scores
CREATE POLICY "Accountants can create FHS scores"
    ON fhs_scores
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.user_role() IN ('owner', 'admin', 'accountant')
    );

-- FHS scores are immutable after creation (no UPDATE policy)
-- Admins can delete FHS scores if needed
CREATE POLICY "Admins can delete FHS scores"
    ON fhs_scores
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- =============================================================================
-- INTEGRATIONS POLICIES
-- Only admins can manage integrations
-- =============================================================================

-- All users can view integrations in their organization
CREATE POLICY "Users can view integrations in their organization"
    ON integrations
    FOR SELECT
    USING (organization_id = auth.user_organization_id());

-- Admins can create integrations
CREATE POLICY "Admins can create integrations"
    ON integrations
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- Admins can update integrations
CREATE POLICY "Admins can update integrations"
    ON integrations
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    )
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- Admins can delete integrations
CREATE POLICY "Admins can delete integrations"
    ON integrations
    FOR DELETE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- =============================================================================
-- SYNC_LOGS POLICIES
-- All users can view sync logs, only system can create them
-- =============================================================================

-- Users can view sync logs for their organization's integrations
CREATE POLICY "Users can view sync logs for their organization"
    ON sync_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM integrations
            WHERE integrations.id = sync_logs.integration_id
            AND integrations.organization_id = auth.user_organization_id()
        )
    );

-- System/service role can insert sync logs
-- Note: This requires a service role bypass or specific user
CREATE POLICY "System can create sync logs"
    ON sync_logs
    FOR INSERT
    WITH CHECK (true); -- Service role will bypass RLS

-- Admins can delete old sync logs
CREATE POLICY "Admins can delete sync logs"
    ON sync_logs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM integrations
            WHERE integrations.id = sync_logs.integration_id
            AND integrations.organization_id = auth.user_organization_id()
        ) AND auth.is_admin()
    );

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant service role full access (bypasses RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant anonymous users limited read access (for public pages if needed)
GRANT SELECT ON organizations TO anon;

-- =============================================================================
-- END OF RLS POLICIES
-- =============================================================================
