-- =============================================================================
-- PACSUM ERP - Audit Tables and Triggers
-- =============================================================================
-- File: 003_audit_tables.sql
-- Purpose: Create audit logging tables and triggers for compliance
-- Author: Dana Querymaster (Database Engineer)
-- Date: 2024-11-07
-- Compatible with: PostgreSQL 13+, Supabase
-- =============================================================================

-- =============================================================================
-- AUDIT_LOGS TABLE
-- Comprehensive audit trail for all data changes and user actions
-- =============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Who performed the action
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- What action was performed
    action TEXT NOT NULL CHECK (action IN (
        'INSERT', 'UPDATE', 'DELETE', 'SELECT',
        'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
        'PERMISSION_DENIED', 'EXPORT', 'IMPORT'
    )),
    -- What resource was affected
    resource_type TEXT NOT NULL, -- 'client', 'transaction', 'invoice', etc.
    resource_id UUID,
    resource_name TEXT, -- Human-readable name for the resource
    -- Change details
    old_values JSONB, -- Previous values (for UPDATE/DELETE)
    new_values JSONB, -- New values (for INSERT/UPDATE)
    changes JSONB, -- Computed diff of changes
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,
    -- Status and outcome
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure', 'partial')),
    error_message TEXT,
    -- Timing
    duration_ms INTEGER, -- Request duration in milliseconds
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Compliance metadata
    compliance_category TEXT, -- 'soc2', 'pci', 'gdpr', etc.
    retention_required_until DATE, -- Legal hold date
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Constraints
    CONSTRAINT valid_duration CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Partition audit_logs by month for performance
-- Note: Supabase may not support declarative partitioning, so this is optional
-- CREATE TABLE audit_logs_y2024m11 PARTITION OF audit_logs
--     FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance and security';
COMMENT ON COLUMN audit_logs.changes IS 'Computed diff between old_values and new_values';
COMMENT ON COLUMN audit_logs.compliance_category IS 'Which compliance framework requires this audit';
COMMENT ON COLUMN audit_logs.retention_required_until IS 'Date until which this record must be retained';

-- Create indexes for audit_logs (query performance)
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_status ON audit_logs(status) WHERE status != 'success';

-- =============================================================================
-- COMPLIANCE_LOGS TABLE
-- Specialized compliance and security event logging
-- =============================================================================
CREATE TABLE compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    -- Event details
    event_type TEXT NOT NULL CHECK (event_type IN (
        'data_access', 'data_export', 'data_deletion',
        'permission_change', 'security_setting_change',
        'encryption_key_rotation', 'backup_created',
        'audit_log_access', 'compliance_report_generated',
        'security_incident', 'privacy_request'
    )),
    event_category TEXT NOT NULL CHECK (event_category IN ('security', 'privacy', 'audit', 'backup', 'incident')),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    -- Who and what
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    affected_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User affected by the action
    description TEXT NOT NULL,
    -- Details
    details JSONB DEFAULT '{}'::jsonb,
    -- Compliance framework
    compliance_framework TEXT[], -- ['SOC2', 'GDPR', 'PCI']
    control_id TEXT, -- Specific control identifier (e.g., 'SOC2-CC6.1')
    -- Evidence and documentation
    evidence_urls TEXT[], -- Links to supporting evidence
    remediation_status TEXT CHECK (remediation_status IN ('not_required', 'pending', 'in_progress', 'completed')),
    remediated_at TIMESTAMPTZ,
    remediated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Retention
    retention_required_until DATE
);

COMMENT ON TABLE compliance_logs IS 'Specialized compliance and security event logging';
COMMENT ON COLUMN compliance_logs.control_id IS 'Specific compliance control identifier (e.g., SOC2-CC6.1)';
COMMENT ON COLUMN compliance_logs.evidence_urls IS 'Links to supporting evidence documents';

-- Create indexes for compliance_logs
CREATE INDEX idx_compliance_logs_organization_id ON compliance_logs(organization_id);
CREATE INDEX idx_compliance_logs_event_type ON compliance_logs(event_type);
CREATE INDEX idx_compliance_logs_severity ON compliance_logs(severity);
CREATE INDEX idx_compliance_logs_created_at ON compliance_logs(created_at DESC);
CREATE INDEX idx_compliance_logs_remediation_status ON compliance_logs(remediation_status)
    WHERE remediation_status IN ('pending', 'in_progress');

-- =============================================================================
-- AUDIT TRIGGER FUNCTION
-- Automatically log all data changes to audit_logs
-- =============================================================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_organization_id UUID;
    v_old_values JSONB;
    v_new_values JSONB;
    v_changes JSONB;
BEGIN
    -- Get current user ID (from RLS context or session)
    BEGIN
        v_user_id := auth.user_id();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- Get organization ID from the record
    IF TG_OP = 'DELETE' THEN
        v_organization_id := OLD.organization_id;
    ELSE
        v_organization_id := NEW.organization_id;
    END IF;

    -- Convert row to JSONB
    IF TG_OP = 'INSERT' THEN
        v_new_values := to_jsonb(NEW);
        v_old_values := NULL;
        v_changes := v_new_values;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        -- Calculate changes (fields that actually changed)
        SELECT jsonb_object_agg(key, value)
        INTO v_changes
        FROM jsonb_each(v_new_values)
        WHERE v_new_values->key IS DISTINCT FROM v_old_values->key;
    ELSIF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
        v_changes := v_old_values;
    END IF;

    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        changes,
        status
    ) VALUES (
        v_user_id,
        v_organization_id,
        TG_OP,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        v_old_values,
        v_new_values,
        v_changes,
        'success'
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_trigger_function() IS 'Automatically log all data changes to audit_logs table';

-- =============================================================================
-- APPLY AUDIT TRIGGERS TO DATA TABLES
-- =============================================================================

-- Organizations
CREATE TRIGGER audit_organizations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Users
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Clients
CREATE TRIGGER audit_clients_trigger
    AFTER INSERT OR UPDATE OR DELETE ON clients
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Transactions
CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Invoices
CREATE TRIGGER audit_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Documents
CREATE TRIGGER audit_documents_trigger
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Integrations (sensitive data - always audit)
CREATE TRIGGER audit_integrations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON integrations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================================================
-- SENSITIVE FIELD REDACTION FUNCTION
-- Redact sensitive fields in audit logs (e.g., passwords, API keys)
-- =============================================================================
CREATE OR REPLACE FUNCTION redact_sensitive_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Redact password hashes
    IF NEW.resource_type = 'users' THEN
        IF NEW.old_values ? 'password_hash' THEN
            NEW.old_values := jsonb_set(NEW.old_values, '{password_hash}', '"[REDACTED]"');
        END IF;
        IF NEW.new_values ? 'password_hash' THEN
            NEW.new_values := jsonb_set(NEW.new_values, '{password_hash}', '"[REDACTED]"');
        END IF;
        IF NEW.changes ? 'password_hash' THEN
            NEW.changes := jsonb_set(NEW.changes, '{password_hash}', '"[REDACTED]"');
        END IF;
        -- Redact two-factor secrets
        IF NEW.old_values ? 'two_factor_secret' THEN
            NEW.old_values := jsonb_set(NEW.old_values, '{two_factor_secret}', '"[REDACTED]"');
        END IF;
        IF NEW.new_values ? 'two_factor_secret' THEN
            NEW.new_values := jsonb_set(NEW.new_values, '{two_factor_secret}', '"[REDACTED]"');
        END IF;
    END IF;

    -- Redact integration credentials
    IF NEW.resource_type = 'integrations' THEN
        IF NEW.old_values ? 'credentials' THEN
            NEW.old_values := jsonb_set(NEW.old_values, '{credentials}', '"[REDACTED]"');
        END IF;
        IF NEW.new_values ? 'credentials' THEN
            NEW.new_values := jsonb_set(NEW.new_values, '{credentials}', '"[REDACTED]"');
        END IF;
        IF NEW.changes ? 'credentials' THEN
            NEW.changes := jsonb_set(NEW.changes, '{credentials}', '"[REDACTED]"');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION redact_sensitive_audit_fields() IS 'Redact sensitive fields (passwords, API keys) in audit logs';

-- Apply redaction trigger to audit_logs
CREATE TRIGGER redact_sensitive_fields_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION redact_sensitive_audit_fields();

-- =============================================================================
-- AUDIT LOG CLEANUP FUNCTION
-- Archive or delete old audit logs based on retention policy
-- =============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 2555)
RETURNS TABLE (
    deleted_count BIGINT,
    archived_count BIGINT
) AS $$
DECLARE
    v_cutoff_date TIMESTAMPTZ;
    v_deleted BIGINT;
BEGIN
    -- Calculate cutoff date (default 7 years for SOC2 compliance)
    v_cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;

    -- Delete logs older than retention period (unless legal hold)
    WITH deleted AS (
        DELETE FROM audit_logs
        WHERE created_at < v_cutoff_date
        AND (retention_required_until IS NULL OR retention_required_until < CURRENT_DATE)
        RETURNING *
    )
    SELECT COUNT(*) INTO v_deleted FROM deleted;

    deleted_count := v_deleted;
    archived_count := 0; -- Future: implement archival to cold storage

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_audit_logs(INTEGER) IS 'Clean up old audit logs based on retention policy (default 7 years)';

-- =============================================================================
-- RLS POLICIES FOR AUDIT TABLES
-- =============================================================================

-- Enable RLS on audit tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs in their organization
CREATE POLICY "Admins can view audit logs in their organization"
    ON audit_logs
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- System can insert audit logs (service role bypasses RLS)
CREATE POLICY "System can insert audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Prevent updates and deletes (audit logs are immutable)
-- Note: No UPDATE or DELETE policies = operations denied

-- Only admins can view compliance logs
CREATE POLICY "Admins can view compliance logs in their organization"
    ON compliance_logs
    FOR SELECT
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- System and admins can insert compliance logs
CREATE POLICY "Admins can insert compliance logs"
    ON compliance_logs
    FOR INSERT
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- Admins can update remediation status
CREATE POLICY "Admins can update compliance log remediation"
    ON compliance_logs
    FOR UPDATE
    USING (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    )
    WITH CHECK (
        organization_id = auth.user_organization_id() AND
        auth.is_admin()
    );

-- =============================================================================
-- AUDIT LOG QUERY HELPER FUNCTIONS
-- =============================================================================

-- Get audit history for a specific resource
CREATE OR REPLACE FUNCTION get_audit_history(
    p_resource_type TEXT,
    p_resource_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    action TEXT,
    user_email TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.action,
        u.email,
        al.changes,
        al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.resource_type = p_resource_type
    AND al.resource_id = p_resource_id
    AND al.organization_id = auth.user_organization_id()
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_audit_history IS 'Get audit history for a specific resource';

-- =============================================================================
-- END OF AUDIT TABLES MIGRATION
-- =============================================================================
