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

-- =============================================================================
-- DROP ALL TABLES (in reverse order of dependencies)
-- =============================================================================

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

-- =============================================================================
-- DROP ALL FUNCTIONS
-- =============================================================================

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

-- =============================================================================
-- DROP SCHEMAS
-- =============================================================================

DROP SCHEMA IF EXISTS auth CASCADE;

-- =============================================================================
-- END OF ROLLBACK
-- =============================================================================
