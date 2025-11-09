-- =============================================================================
-- PACSUM ERP - Initial Database Schema Migration
-- =============================================================================
-- File: 001_init.sql
-- Purpose: Create all core tables for the PACSUM ERP system
-- Author: Dana Querymaster (Database Engineer)
-- Date: 2024-11-07
-- Compatible with: PostgreSQL 13+, Supabase
-- =============================================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing (if needed)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ORGANIZATIONS TABLE
-- Multi-tenant support - each organization is a separate tenant
-- =============================================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    -- Settings stored as JSONB for flexibility
    settings JSONB DEFAULT '{
        "timezone": "America/New_York",
        "fiscal_year_start": "01-01",
        "currency": "USD",
        "date_format": "MM/DD/YYYY"
    }'::jsonb,
    -- Subscription information
    subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
    subscription_expires_at TIMESTAMPTZ,
    -- Contact information
    contact_email TEXT,
    contact_phone TEXT,
    -- Billing information
    billing_address JSONB,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    -- Constraints
    CONSTRAINT valid_email CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Add comment for documentation
COMMENT ON TABLE organizations IS 'Multi-tenant organizations - each bookkeeping firm is a separate organization';
COMMENT ON COLUMN organizations.settings IS 'Flexible JSON settings: timezone, fiscal year, currency, date format';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization';

-- =============================================================================
-- USERS TABLE
-- Authentication and authorization for all system users
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Authentication
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- NULL for SSO users
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    -- Profile information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url TEXT,
    phone TEXT,
    -- Authorization
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'accountant', 'viewer')),
    permissions JSONB DEFAULT '[]'::jsonb,
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    -- Session management
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret TEXT,
    -- Password reset
    reset_token TEXT,
    reset_token_expires_at TIMESTAMPTZ,
    -- Preferences
    preferences JSONB DEFAULT '{
        "theme": "light",
        "language": "en",
        "notifications": {
            "email": true,
            "push": false
        }
    }'::jsonb,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_failed_attempts CHECK (failed_login_attempts >= 0)
);

COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: owner (org owner), admin (full access), accountant (bookkeeper), viewer (read-only)';
COMMENT ON COLUMN users.permissions IS 'Additional granular permissions beyond role defaults';
COMMENT ON COLUMN users.failed_login_attempts IS 'Track failed login attempts for security';

-- =============================================================================
-- CLIENTS TABLE
-- Customer/client records managed by each organization
-- =============================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Basic information
    name TEXT NOT NULL,
    legal_name TEXT,
    client_code TEXT, -- Custom identifier used by org
    -- Classification
    industry TEXT,
    entity_type TEXT CHECK (entity_type IN ('sole_proprietor', 'llc', 'corporation', 's_corp', 'partnership', 'non_profit')),
    -- Contact information
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    website TEXT,
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    -- Tax information
    tax_id_number TEXT, -- EIN or SSN
    tax_id_type TEXT CHECK (tax_id_type IN ('EIN', 'SSN')),
    -- Business information
    business_start_date DATE,
    fiscal_year_end TEXT, -- MM-DD format
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'prospect')),
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
    -- Financial Health Score
    current_fhs_score NUMERIC(5, 2), -- Current FHS (0-100)
    fhs_last_calculated_at TIMESTAMPTZ,
    -- Billing
    billing_rate NUMERIC(10, 2), -- Monthly retainer or hourly rate
    billing_frequency TEXT CHECK (billing_frequency IN ('monthly', 'quarterly', 'annually', 'hourly')),
    billing_day_of_month INTEGER CHECK (billing_day_of_month BETWEEN 1 AND 31),
    -- Integration identifiers
    quickbooks_id TEXT,
    stripe_customer_id TEXT,
    -- Notes and metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Assigned team
    assigned_accountant_id UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Constraints
    CONSTRAINT valid_contact_email CHECK (primary_contact_email IS NULL OR primary_contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT unique_client_code_per_org UNIQUE (organization_id, client_code),
    CONSTRAINT valid_fhs_score CHECK (current_fhs_score IS NULL OR (current_fhs_score >= 0 AND current_fhs_score <= 100))
);

COMMENT ON TABLE clients IS 'Client/customer records for each organization';
COMMENT ON COLUMN clients.current_fhs_score IS 'Current Financial Health Score (0-100), cached for performance';
COMMENT ON COLUMN clients.client_code IS 'Organization-specific client identifier/code';
COMMENT ON COLUMN clients.risk_level IS 'Client risk assessment for compliance and audit purposes';

-- =============================================================================
-- TRANSACTIONS TABLE
-- Financial transactions for each client
-- =============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    -- Transaction details
    transaction_date DATE NOT NULL,
    post_date DATE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    -- Categorization
    category TEXT,
    subcategory TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer', 'adjustment')),
    -- Payment details
    payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'ach', 'wire', 'other')),
    check_number TEXT,
    reference_number TEXT,
    -- Parties involved
    payee TEXT,
    payer TEXT,
    vendor_id UUID, -- Future: reference to vendors table
    -- Bank reconciliation
    bank_account TEXT,
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Tax information
    tax_deductible BOOLEAN DEFAULT FALSE,
    tax_category TEXT,
    -- Status and flags
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'reconciled', 'void', 'disputed')),
    is_billable BOOLEAN DEFAULT FALSE,
    is_reimbursable BOOLEAN DEFAULT FALSE,
    -- Integration identifiers
    quickbooks_id TEXT,
    stripe_transaction_id TEXT,
    -- Attachments and notes
    receipt_url TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Constraints
    CONSTRAINT valid_amount CHECK (amount != 0),
    CONSTRAINT valid_dates CHECK (post_date IS NULL OR post_date >= transaction_date)
);

COMMENT ON TABLE transactions IS 'Financial transactions for each client';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount (positive for income/debit, negative for expense/credit)';
COMMENT ON COLUMN transactions.reconciled IS 'Whether transaction has been reconciled with bank statement';
COMMENT ON COLUMN transactions.tax_deductible IS 'Whether transaction is tax deductible (for expense tracking)';

-- =============================================================================
-- INVOICES TABLE
-- Client invoicing and billing
-- =============================================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    -- Invoice identification
    invoice_number TEXT NOT NULL,
    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    period_start_date DATE,
    period_end_date DATE,
    -- Amounts
    subtotal NUMERIC(15, 2) NOT NULL,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL,
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    amount_due NUMERIC(15, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'cancelled')),
    -- Payment information
    payment_terms TEXT DEFAULT 'net_30' CHECK (payment_terms IN ('due_on_receipt', 'net_15', 'net_30', 'net_60', 'net_90')),
    payment_method TEXT,
    paid_at TIMESTAMPTZ,
    -- Line items stored as JSONB for flexibility
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Notes and terms
    notes TEXT,
    terms_and_conditions TEXT,
    -- Integration identifiers
    quickbooks_id TEXT,
    stripe_invoice_id TEXT,
    -- Communication
    sent_at TIMESTAMPTZ,
    last_viewed_at TIMESTAMPTZ,
    last_reminder_sent_at TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Constraints
    CONSTRAINT unique_invoice_number_per_org UNIQUE (organization_id, invoice_number),
    CONSTRAINT valid_dates CHECK (due_date >= invoice_date),
    CONSTRAINT valid_period CHECK (period_end_date IS NULL OR period_start_date IS NULL OR period_end_date >= period_start_date),
    CONSTRAINT valid_amounts CHECK (
        subtotal >= 0 AND
        tax_amount >= 0 AND
        discount_amount >= 0 AND
        total_amount >= 0 AND
        amount_paid >= 0 AND
        amount_paid <= total_amount
    )
);

COMMENT ON TABLE invoices IS 'Client invoices and billing records';
COMMENT ON COLUMN invoices.line_items IS 'Invoice line items as JSON array: [{description, quantity, rate, amount}]';
COMMENT ON COLUMN invoices.amount_due IS 'Calculated field: total_amount - amount_paid';
COMMENT ON COLUMN invoices.reminder_count IS 'Number of payment reminders sent';

-- =============================================================================
-- DOCUMENTS TABLE
-- Document storage references (files stored in Supabase Storage)
-- =============================================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    -- Related entities (polymorphic)
    related_type TEXT, -- 'transaction', 'invoice', 'client', etc.
    related_id UUID,
    -- File information
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL, -- bytes
    mime_type TEXT NOT NULL,
    -- Storage location
    storage_path TEXT NOT NULL UNIQUE, -- Path in Supabase Storage
    storage_bucket TEXT DEFAULT 'documents',
    -- Classification
    document_type TEXT CHECK (document_type IN (
        'receipt', 'invoice', 'contract', 'tax_form',
        'bank_statement', 'financial_report', 'other'
    )),
    category TEXT,
    tags TEXT[], -- Array of tags for search
    -- OCR and processing
    ocr_text TEXT, -- Extracted text from OCR
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_processed_at TIMESTAMPTZ,
    -- Security
    is_confidential BOOLEAN DEFAULT TRUE,
    encryption_key_id TEXT, -- Reference to encryption key if encrypted
    -- Version control
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0),
    CONSTRAINT valid_version CHECK (version > 0)
);

COMMENT ON TABLE documents IS 'Document metadata - actual files stored in Supabase Storage';
COMMENT ON COLUMN documents.storage_path IS 'Path to file in Supabase Storage bucket';
COMMENT ON COLUMN documents.ocr_text IS 'Text extracted from document via OCR for searchability';
COMMENT ON COLUMN documents.related_type IS 'Type of related entity (transaction, invoice, client, etc.)';

-- =============================================================================
-- FHS_SCORES TABLE
-- Financial Health Score calculation history
-- =============================================================================
CREATE TABLE fhs_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    -- Score information
    score NUMERIC(5, 2) NOT NULL,
    score_date DATE NOT NULL,
    -- Score components (weighted factors)
    components JSONB NOT NULL DEFAULT '{
        "cash_flow_health": 0,
        "profitability": 0,
        "debt_to_equity": 0,
        "working_capital": 0,
        "revenue_growth": 0
    }'::jsonb,
    -- Financial metrics used in calculation
    metrics JSONB NOT NULL DEFAULT '{
        "total_revenue": 0,
        "total_expenses": 0,
        "net_income": 0,
        "total_assets": 0,
        "total_liabilities": 0,
        "cash_balance": 0
    }'::jsonb,
    -- Calculation details
    calculation_method TEXT DEFAULT 'standard_v1',
    calculation_period_start DATE NOT NULL,
    calculation_period_end DATE NOT NULL,
    -- Comparison
    previous_score NUMERIC(5, 2),
    score_change NUMERIC(5, 2),
    score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining')),
    -- Insights and recommendations
    insights TEXT[],
    recommendations TEXT[],
    alerts TEXT[],
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    calculated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Constraints
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100),
    CONSTRAINT valid_period CHECK (calculation_period_end >= calculation_period_start),
    CONSTRAINT valid_previous_score CHECK (previous_score IS NULL OR (previous_score >= 0 AND previous_score <= 100))
);

COMMENT ON TABLE fhs_scores IS 'Financial Health Score calculation history for clients';
COMMENT ON COLUMN fhs_scores.score IS 'Overall FHS score (0-100), higher is better';
COMMENT ON COLUMN fhs_scores.components IS 'Breakdown of score components with individual scores';
COMMENT ON COLUMN fhs_scores.metrics IS 'Financial metrics used in the calculation';
COMMENT ON COLUMN fhs_scores.score_trend IS 'Trend compared to previous score';

-- =============================================================================
-- INTEGRATIONS TABLE
-- Third-party integration configurations
-- =============================================================================
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Integration details
    provider TEXT NOT NULL CHECK (provider IN ('quickbooks', 'stripe', 'plaid', 'sendgrid', 'other')),
    provider_name TEXT NOT NULL,
    -- Connection status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'disconnected', 'error')),
    is_active BOOLEAN DEFAULT TRUE,
    -- Credentials (encrypted)
    credentials JSONB, -- Encrypted API keys, tokens, etc.
    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,
    scopes TEXT[], -- OAuth scopes or permissions
    -- Connection details
    connected_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,
    sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
    -- Error tracking
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0,
    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Constraints
    CONSTRAINT unique_provider_per_org UNIQUE (organization_id, provider)
);

COMMENT ON TABLE integrations IS 'Third-party integration configurations and status';
COMMENT ON COLUMN integrations.credentials IS 'Encrypted API credentials (should be encrypted at application level)';
COMMENT ON COLUMN integrations.sync_frequency IS 'How often to sync data from the provider';

-- =============================================================================
-- SYNC_LOGS TABLE
-- Integration synchronization history
-- =============================================================================
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    -- Sync details
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
    status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'partial')),
    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
    ) STORED,
    -- Results
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    -- Error details
    error_message TEXT,
    error_details JSONB,
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Constraints
    CONSTRAINT valid_record_counts CHECK (
        records_processed >= 0 AND
        records_created >= 0 AND
        records_updated >= 0 AND
        records_failed >= 0
    )
);

COMMENT ON TABLE sync_logs IS 'History of integration synchronization operations';
COMMENT ON COLUMN sync_logs.duration_seconds IS 'Calculated sync duration in seconds';
COMMENT ON COLUMN sync_logs.records_processed IS 'Total number of records processed during sync';

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- Automatically update updated_at timestamp on row changes
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
