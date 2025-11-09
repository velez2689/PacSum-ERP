-- =============================================================================
-- PACSUM ERP - Database Rollback / Cleanup
-- =============================================================================
-- File: 000_rollback.sql
-- Purpose: Clean up all database objects (for development/testing)
-- Author: Dana Querymaster (Database Engineer)
-- Date: 2024-11-07
-- WARNING: This will DELETE ALL DATA! Use only in development.
-- =============================================================================

-- WARNING: DESTRUCTIVE OPERATION
-- This script will drop all tables and data
-- DO NOT RUN IN PRODUCTION

\echo '⚠️  WARNING: This will DELETE ALL DATA!'
\echo '⚠️  Press Ctrl+C to cancel, or Enter to continue...'
\prompt 'Type YES to confirm: ' confirmation

-- Verify confirmation
\if :{?confirmation}
    \if :confirmation = 'YES'
        \echo 'Proceeding with rollback...'
    \else
        \echo 'Confirmation failed. Aborting.'
        \q
    \endif
\else
    \echo 'No confirmation provided. Aborting.'
    \q
\endif

-- =============================================================================
-- DROP ALL TABLES (in reverse order of dependencies)
-- =============================================================================

\echo 'Dropping tables...'

-- Drop audit and logging tables
DROP TABLE IF EXISTS compliance_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sync_logs CASCADE;

-- Drop core tables
DROP TABLE IF EXISTS fhs_scores CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

\echo 'Tables dropped.'

-- =============================================================================
-- DROP ALL FUNCTIONS
-- =============================================================================

\echo 'Dropping functions...'

-- Helper functions
DROP FUNCTION IF EXISTS auth.user_id() CASCADE;
DROP FUNCTION IF EXISTS auth.user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS auth.user_role() CASCADE;
DROP FUNCTION IF EXISTS auth.is_admin() CASCADE;

-- Trigger functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS redact_sensitive_audit_fields() CASCADE;

-- Utility functions
DROP FUNCTION IF EXISTS cleanup_old_audit_logs(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_audit_history(TEXT, UUID, INTEGER) CASCADE;

\echo 'Functions dropped.'

-- =============================================================================
-- DROP EXTENSIONS (optional - may want to keep these)
-- =============================================================================

-- Uncomment to drop extensions
-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;
-- DROP EXTENSION IF EXISTS pgcrypto CASCADE;
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

\echo 'Extensions preserved (comment out to drop).'

-- =============================================================================
-- VERIFY CLEANUP
-- =============================================================================

\echo 'Verifying cleanup...'

-- List remaining tables
SELECT 'Remaining tables:' AS info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- List remaining functions
SELECT 'Remaining functions:' AS info;
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';

\echo '✅ Rollback complete!'
\echo 'Run migrations again to recreate the schema.'

-- =============================================================================
-- END OF ROLLBACK
-- =============================================================================
