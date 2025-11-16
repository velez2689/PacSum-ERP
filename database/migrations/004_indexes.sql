-- =============================================================================
-- PACSUM ERP - Performance Indexes
-- =============================================================================
-- File: 004_indexes.sql
-- Purpose: Create indexes for optimal query performance
-- Author: Dana Querymaster (Database Engineer)
-- Date: 2024-11-07
-- Compatible with: PostgreSQL 13+, Supabase
-- =============================================================================

-- =============================================================================
-- ORGANIZATIONS INDEXES
-- =============================================================================

-- Unique index on slug for fast lookups
CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug)
    WHERE deleted_at IS NULL;

-- Index for active organizations
CREATE INDEX idx_organizations_status ON organizations(subscription_status)
    WHERE subscription_status = 'active' AND deleted_at IS NULL;

COMMENT ON INDEX idx_organizations_slug IS 'Fast lookup by organization slug (URL-friendly identifier)';
COMMENT ON INDEX idx_organizations_status IS 'Filter active organizations efficiently';

-- =============================================================================
-- USERS INDEXES
-- =============================================================================

-- Email lookup (already unique, but explicit index helps)
CREATE UNIQUE INDEX idx_users_email ON users(email)
    WHERE deleted_at IS NULL;

-- Organization membership lookup
CREATE INDEX idx_users_organization_id ON users(organization_id)
    WHERE deleted_at IS NULL;

-- Role-based queries
CREATE INDEX idx_users_organization_role ON users(organization_id, role)
    WHERE deleted_at IS NULL;

-- Login tracking
CREATE INDEX idx_users_last_login ON users(last_login_at DESC)
    WHERE deleted_at IS NULL;

-- Security: find locked accounts
CREATE INDEX idx_users_locked ON users(locked_until)
    WHERE locked_until IS NOT NULL;

-- Password reset tokens
CREATE INDEX idx_users_reset_token ON users(reset_token)
    WHERE reset_token IS NOT NULL;

COMMENT ON INDEX idx_users_email IS 'Fast email lookup for authentication';
COMMENT ON INDEX idx_users_organization_id IS 'List users by organization';
COMMENT ON INDEX idx_users_organization_role IS 'Role-based access queries';
COMMENT ON INDEX idx_users_locked IS 'Find locked user accounts for security';

-- =============================================================================
-- CLIENTS INDEXES
-- =============================================================================

-- Organization membership (most common query)
CREATE INDEX idx_clients_organization_id ON clients(organization_id)
    WHERE deleted_at IS NULL;

-- Client status filtering
CREATE INDEX idx_clients_organization_status ON clients(organization_id, status)
    WHERE deleted_at IS NULL;

-- Assigned accountant queries
CREATE INDEX idx_clients_assigned_accountant ON clients(assigned_accountant_id)
    WHERE deleted_at IS NULL AND assigned_accountant_id IS NOT NULL;

-- Client code lookup (unique per organization)
CREATE UNIQUE INDEX idx_clients_org_code ON clients(organization_id, client_code)
    WHERE deleted_at IS NULL AND client_code IS NOT NULL;

-- FHS score queries
CREATE INDEX idx_clients_fhs_score ON clients(current_fhs_score DESC NULLS LAST)
    WHERE deleted_at IS NULL;

-- Risk level filtering
CREATE INDEX idx_clients_risk_level ON clients(organization_id, risk_level)
    WHERE deleted_at IS NULL;

-- Integration identifiers
CREATE INDEX idx_clients_quickbooks_id ON clients(quickbooks_id)
    WHERE quickbooks_id IS NOT NULL;

CREATE INDEX idx_clients_stripe_id ON clients(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

-- Full-text search on client name
CREATE INDEX idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Note: gin_trgm_ops requires pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

COMMENT ON INDEX idx_clients_organization_id IS 'Primary query: clients by organization';
COMMENT ON INDEX idx_clients_organization_status IS 'Filter clients by status (active, inactive, etc.)';
COMMENT ON INDEX idx_clients_fhs_score IS 'Sort clients by Financial Health Score';
COMMENT ON INDEX idx_clients_name_trgm IS 'Full-text search on client names';

-- =============================================================================
-- TRANSACTIONS INDEXES
-- =============================================================================

-- Organization membership
CREATE INDEX idx_transactions_organization_id ON transactions(organization_id)
    WHERE deleted_at IS NULL;

-- Client transactions (most common query)
CREATE INDEX idx_transactions_client_id ON transactions(client_id, transaction_date DESC)
    WHERE deleted_at IS NULL;

-- Date range queries (critical for reporting)
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC)
    WHERE deleted_at IS NULL;

-- Organization + date queries
CREATE INDEX idx_transactions_org_date ON transactions(organization_id, transaction_date DESC)
    WHERE deleted_at IS NULL;

-- Transaction type filtering
CREATE INDEX idx_transactions_type ON transactions(organization_id, transaction_type)
    WHERE deleted_at IS NULL;

-- Reconciliation queries
CREATE INDEX idx_transactions_reconciled ON transactions(client_id, reconciled)
    WHERE deleted_at IS NULL AND reconciled = FALSE;

-- Status filtering
CREATE INDEX idx_transactions_status ON transactions(client_id, status)
    WHERE deleted_at IS NULL;

-- Category-based reporting
CREATE INDEX idx_transactions_category ON transactions(organization_id, category, transaction_date DESC)
    WHERE deleted_at IS NULL AND category IS NOT NULL;

-- Integration identifiers
CREATE INDEX idx_transactions_quickbooks_id ON transactions(quickbooks_id)
    WHERE quickbooks_id IS NOT NULL;

CREATE INDEX idx_transactions_stripe_id ON transactions(stripe_transaction_id)
    WHERE stripe_transaction_id IS NOT NULL;

-- Amount range queries
CREATE INDEX idx_transactions_amount ON transactions(amount DESC)
    WHERE deleted_at IS NULL;

-- Created by audit
CREATE INDEX idx_transactions_created_by ON transactions(created_by)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_transactions_client_id IS 'Primary query: transactions by client and date';
COMMENT ON INDEX idx_transactions_date IS 'Date range queries for reporting';
COMMENT ON INDEX idx_transactions_reconciled IS 'Find unreconciled transactions';
COMMENT ON INDEX idx_transactions_category IS 'Category-based financial reporting';

-- =============================================================================
-- INVOICES INDEXES
-- =============================================================================

-- Organization membership
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id)
    WHERE deleted_at IS NULL;

-- Client invoices
CREATE INDEX idx_invoices_client_id ON invoices(client_id, invoice_date DESC)
    WHERE deleted_at IS NULL;

-- Invoice number lookup (unique per organization)
CREATE UNIQUE INDEX idx_invoices_org_number ON invoices(organization_id, invoice_number)
    WHERE deleted_at IS NULL;

-- Status filtering
CREATE INDEX idx_invoices_status ON invoices(organization_id, status)
    WHERE deleted_at IS NULL;

-- Overdue invoices (critical business query)
CREATE INDEX idx_invoices_overdue ON invoices(organization_id, due_date)
    WHERE deleted_at IS NULL
    AND status NOT IN ('paid', 'void', 'cancelled');

-- Payment tracking
CREATE INDEX idx_invoices_paid ON invoices(paid_at DESC)
    WHERE deleted_at IS NULL AND paid_at IS NOT NULL;

-- Date range queries
CREATE INDEX idx_invoices_date_range ON invoices(invoice_date DESC, due_date)
    WHERE deleted_at IS NULL;

-- Integration identifiers
CREATE INDEX idx_invoices_quickbooks_id ON invoices(quickbooks_id)
    WHERE quickbooks_id IS NOT NULL;

CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id)
    WHERE stripe_invoice_id IS NOT NULL;

-- Created by audit
CREATE INDEX idx_invoices_created_by ON invoices(created_by)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_invoices_client_id IS 'Client invoice history';
COMMENT ON INDEX idx_invoices_org_number IS 'Fast invoice number lookup';
COMMENT ON INDEX idx_invoices_overdue IS 'Critical: find overdue invoices for collections';
COMMENT ON INDEX idx_invoices_status IS 'Filter invoices by status (draft, sent, paid, etc.)';

-- =============================================================================
-- DOCUMENTS INDEXES
-- =============================================================================

-- Organization membership
CREATE INDEX idx_documents_organization_id ON documents(organization_id)
    WHERE deleted_at IS NULL;

-- Client documents
CREATE INDEX idx_documents_client_id ON documents(client_id, created_at DESC)
    WHERE deleted_at IS NULL AND client_id IS NOT NULL;

-- Storage path lookup (unique)
CREATE UNIQUE INDEX idx_documents_storage_path ON documents(storage_path)
    WHERE deleted_at IS NULL;

-- Document type filtering
CREATE INDEX idx_documents_type ON documents(organization_id, document_type)
    WHERE deleted_at IS NULL AND document_type IS NOT NULL;

-- Related entity queries (polymorphic)
CREATE INDEX idx_documents_related ON documents(related_type, related_id)
    WHERE deleted_at IS NULL AND related_type IS NOT NULL;

-- OCR search
CREATE INDEX idx_documents_ocr_text ON documents USING gin(to_tsvector('english', ocr_text))
    WHERE deleted_at IS NULL AND ocr_text IS NOT NULL;

-- Tag search
CREATE INDEX idx_documents_tags ON documents USING gin(tags)
    WHERE deleted_at IS NULL;

-- Uploaded by audit
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by)
    WHERE deleted_at IS NULL;

-- Confidential documents
CREATE INDEX idx_documents_confidential ON documents(organization_id, is_confidential)
    WHERE deleted_at IS NULL AND is_confidential = TRUE;

COMMENT ON INDEX idx_documents_client_id IS 'List documents for a client';
COMMENT ON INDEX idx_documents_storage_path IS 'Fast lookup by storage path';
COMMENT ON INDEX idx_documents_ocr_text IS 'Full-text search on OCR extracted text';
COMMENT ON INDEX idx_documents_tags IS 'Search documents by tags';

-- =============================================================================
-- FHS_SCORES INDEXES
-- =============================================================================

-- Organization membership
CREATE INDEX idx_fhs_scores_organization_id ON fhs_scores(organization_id);

-- Client FHS history (most common query)
CREATE INDEX idx_fhs_scores_client_date ON fhs_scores(client_id, score_date DESC);

-- Score range queries
CREATE INDEX idx_fhs_scores_score ON fhs_scores(organization_id, score DESC);

-- Date range queries
CREATE INDEX idx_fhs_scores_date ON fhs_scores(score_date DESC);

-- Trend analysis
CREATE INDEX idx_fhs_scores_trend ON fhs_scores(organization_id, score_trend)
    WHERE score_trend IS NOT NULL;

-- Latest score per client (for dashboard)
CREATE INDEX idx_fhs_scores_latest ON fhs_scores(client_id, score_date DESC, score);

COMMENT ON INDEX idx_fhs_scores_client_date IS 'FHS history timeline for a client';
COMMENT ON INDEX idx_fhs_scores_score IS 'Sort clients by FHS score';
COMMENT ON INDEX idx_fhs_scores_latest IS 'Get latest FHS score per client';

-- =============================================================================
-- INTEGRATIONS INDEXES
-- =============================================================================

-- Organization membership
CREATE INDEX idx_integrations_organization_id ON integrations(organization_id);

-- Provider lookup (unique per organization)
CREATE UNIQUE INDEX idx_integrations_org_provider ON integrations(organization_id, provider);

-- Active integrations
CREATE INDEX idx_integrations_active ON integrations(organization_id, is_active)
    WHERE is_active = TRUE;

-- Status filtering
CREATE INDEX idx_integrations_status ON integrations(organization_id, status);

-- Sync scheduling
CREATE INDEX idx_integrations_next_sync ON integrations(next_sync_at)
    WHERE next_sync_at IS NOT NULL AND is_active = TRUE;

-- Error tracking
CREATE INDEX idx_integrations_errors ON integrations(organization_id, error_count)
    WHERE error_count > 0;

COMMENT ON INDEX idx_integrations_org_provider IS 'One integration per provider per organization';
COMMENT ON INDEX idx_integrations_next_sync IS 'Find integrations ready for sync';
COMMENT ON INDEX idx_integrations_errors IS 'Monitor integrations with errors';

-- =============================================================================
-- SYNC_LOGS INDEXES
-- =============================================================================

-- Integration sync history
CREATE INDEX idx_sync_logs_integration ON sync_logs(integration_id, started_at DESC);

-- Date range queries
CREATE INDEX idx_sync_logs_date ON sync_logs(started_at DESC);

-- Status filtering
CREATE INDEX idx_sync_logs_status ON sync_logs(integration_id, status)
    WHERE status IN ('failed', 'partial');

-- Performance monitoring
CREATE INDEX idx_sync_logs_duration ON sync_logs(duration_seconds DESC)
    WHERE duration_seconds IS NOT NULL;

COMMENT ON INDEX idx_sync_logs_integration IS 'Sync history for an integration';
COMMENT ON INDEX idx_sync_logs_status IS 'Find failed or partial syncs';
COMMENT ON INDEX idx_sync_logs_duration IS 'Monitor sync performance';

-- =============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =============================================================================

-- Dashboard: Recent client activity
CREATE INDEX idx_dashboard_recent_activity ON transactions(
    organization_id,
    transaction_date DESC,
    client_id
) WHERE deleted_at IS NULL;

-- Financial reporting: Revenue by category and period
CREATE INDEX idx_reporting_revenue ON transactions(
    organization_id,
    transaction_type,
    category,
    transaction_date DESC
) WHERE deleted_at IS NULL AND transaction_type = 'income';

-- Financial reporting: Expenses by category and period
CREATE INDEX idx_reporting_expenses ON transactions(
    organization_id,
    transaction_type,
    category,
    transaction_date DESC
) WHERE deleted_at IS NULL AND transaction_type = 'expense';

-- Client onboarding: Recent clients
CREATE INDEX idx_clients_recent ON clients(
    organization_id,
    created_at DESC,
    status
) WHERE deleted_at IS NULL;

-- Collections: Overdue invoices by client
CREATE INDEX idx_collections_overdue ON invoices(
    organization_id,
    client_id,
    due_date,
    amount_due
) WHERE deleted_at IS NULL
  AND status NOT IN ('paid', 'void', 'cancelled');

COMMENT ON INDEX idx_dashboard_recent_activity IS 'Dashboard: show recent client transactions';
COMMENT ON INDEX idx_reporting_revenue IS 'Financial reporting: revenue by category';
COMMENT ON INDEX idx_reporting_expenses IS 'Financial reporting: expenses by category';
COMMENT ON INDEX idx_collections_overdue IS 'Collections workflow: overdue invoices';

-- =============================================================================
-- STATISTICS AND MAINTENANCE
-- =============================================================================

-- Update table statistics for query planner
ANALYZE organizations;
ANALYZE users;
ANALYZE clients;
ANALYZE transactions;
ANALYZE invoices;
ANALYZE documents;
ANALYZE fhs_scores;
ANALYZE integrations;
ANALYZE sync_logs;
ANALYZE audit_logs;
ANALYZE compliance_logs;

-- =============================================================================
-- INDEX MAINTENANCE NOTES
-- =============================================================================

-- Note: PostgreSQL/Supabase automatically maintains indexes
-- For production, consider:
-- 1. Regular VACUUM ANALYZE to update statistics
-- 2. Monitor index bloat with pg_stat_user_indexes
-- 3. Rebuild indexes if needed: REINDEX INDEX CONCURRENTLY idx_name
-- 4. Monitor slow queries and add indexes as needed
-- 5. Remove unused indexes to reduce write overhead

-- Recommended maintenance query (run periodically):
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan ASC;

-- =============================================================================
-- END OF INDEXES MIGRATION
-- =============================================================================
