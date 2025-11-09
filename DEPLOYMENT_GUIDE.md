# PACSUM ERP - Database Deployment Guide

**Status:** Ready for Production Deployment
**Target:** Supabase PostgreSQL
**Date:** November 8, 2025

---

## Quick Start

### Step 1: Prepare Your Supabase Project

1. Sign into [Supabase Dashboard](https://app.supabase.com)
2. Create or select your project
3. Note your connection string (Settings → Database)
4. Enable Row Level Security in SQL Editor

### Step 2: Deploy Migrations

```bash
# Option A: Using psql CLI
psql postgresql://[user]:[password]@[host]:[port]/postgres < database/migrations/001_init.sql
psql postgresql://[user]:[password]@[host]:[port]/postgres < database/migrations/002_rls_policies.sql
psql postgresql://[user]:[password]@[host]:[port]/postgres < database/migrations/003_audit_tables.sql
psql postgresql://[user]:[password]@[host]:[port]/postgres < database/migrations/004_indexes.sql
```

```bash
# Option B: Using Supabase SQL Editor
# Copy and paste each SQL file into the editor one at a time
```

```bash
# Option C: Using migration runner (Node.js)
npm run migrate:deploy
```

### Step 3: Verify Installation

```sql
-- Check tables created
SELECT COUNT(*) as total_tables FROM information_schema.tables
WHERE table_schema = 'public';
-- Expected: 13+ tables

-- Check RLS enabled
SELECT COUNT(*) as rls_tables FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Expected: 10+ tables

-- Check indexes created
SELECT COUNT(*) as total_indexes FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: 55+ indexes

-- Check policies
SELECT COUNT(*) as total_policies FROM pg_policies;
-- Expected: 25+ policies
```

### Step 4: Load Test Data (Optional)

```sql
-- Load development data for testing
psql postgresql://[user]:[password]@[host]:[port]/postgres < database/seeds/dev-data.sql
```

### Step 5: Configure Application

Update your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/postgres
```

---

## Detailed Deployment Steps

### Phase 1: Environment Setup

#### 1.1 Supabase Project Configuration

```sql
-- Connect to Supabase SQL Editor
-- Go to: Project → SQL Editor → New Query

-- Verify PostgreSQL version
SELECT version();
-- Expected: PostgreSQL 13+ (typically 14 or 15)

-- Check available extensions
SELECT * FROM pg_available_extensions
WHERE name IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');
```

#### 1.2 Enable Required Extensions

The migrations will automatically create these, but verify:

```sql
-- Extensions created by 001_init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verify they're installed
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');
```

---

### Phase 2: Run Migrations

#### 2.1 Execute Migration 001_init.sql

```sql
-- Creates core tables:
-- - organizations
-- - users
-- - clients
-- - transactions
-- - invoices
-- - documents
-- - fhs_scores
-- - integrations
-- - sync_logs
-- - sessions
-- + automatic updated_at triggers

-- Expected output: 30+ tables and indexes created
-- Time: ~5-10 seconds
```

**Verification:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Should see: audit_logs, clients, compliance_logs, documents, fhs_scores,
-- integrations, invoices, organizations, sessions, sync_logs, transactions,
-- users, etc.
```

#### 2.2 Execute Migration 002_rls_policies.sql

```sql
-- Creates RLS security architecture:
-- - Helper functions (auth.user_id, auth.user_role, etc.)
-- - RLS policies on 10 tables
-- - Multi-tenant data isolation

-- Expected output: 25+ policies created
-- Time: ~3-5 seconds
```

**Verification:**
```sql
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Should see policies for: organizations, users, clients,
-- transactions, documents, invoices, fhs_scores, sessions, etc.
```

#### 2.3 Execute Migration 003_audit_tables.sql

```sql
-- Creates audit infrastructure:
-- - audit_logs table
-- - compliance_logs table
-- - api_logs table (optional)
-- - data_access_logs table (optional)
-- - Audit triggers on 5 tables
-- - Audit indexes

-- Expected output: 4 tables, 10+ indexes, 5 triggers
-- Time: ~3-5 seconds
```

**Verification:**
```sql
-- Check audit tables exist
SELECT tablename FROM pg_tables
WHERE tablename LIKE '%audit%' OR tablename LIKE '%compliance%'
ORDER BY tablename;

-- Check audit triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name LIKE '%audit%'
ORDER BY event_object_table;
```

#### 2.4 Execute Migration 004_indexes.sql

```sql
-- Creates performance indexes:
-- - 55+ strategic indexes
-- - Composite indexes for common filters
-- - Partial indexes for sparse data
-- - GIN indexes for full-text search
-- - Covering indexes for optimization

-- Expected output: 55+ indexes created
-- Time: ~5-10 seconds (depends on existing data)
```

**Verification:**
```sql
-- Count indexes
SELECT COUNT(*) as total_indexes FROM pg_indexes
WHERE schemaname = 'public';
-- Expected: 55+

-- View index details
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

### Phase 3: Verify Security Configuration

#### 3.1 Row Level Security

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- Expected: 10+ tables with RLS enabled
-- Tables: organizations, users, clients, transactions, documents,
--         invoices, fhs_scores, integrations, sync_logs, sessions
```

#### 3.2 RLS Policy Verification

```sql
-- List all policies
SELECT schemaname, tablename, policyname, cmd, QUAL, WITH_CHECK
FROM pg_policies
ORDER BY tablename, policyname;

-- Test a policy (example - may fail without auth context)
-- This verifies the policy structure, not the runtime behavior
SELECT * FROM organizations LIMIT 1;
```

#### 3.3 Helper Functions

```sql
-- Check authentication helper functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'auth' OR routine_schema = 'public'
AND routine_name LIKE '%user%' OR routine_name LIKE '%admin%'
ORDER BY routine_name;

-- Expected functions: auth.user_id(), auth.user_organization_id(),
--                     auth.user_role(), auth.is_admin()
```

---

### Phase 4: Load Test Data

#### 4.1 Seed Development Database

```sql
-- Load test data
-- This creates realistic test data for development/testing
-- DO NOT run in production without review

-- This will:
-- - Create 1 test organization (ACME Bookkeeping)
-- - Create 3 test users with different roles
-- - Create 5 test clients
-- - Create 20+ test transactions
-- - Create 10+ test invoices
-- - Create 15+ test documents
-- - Create multiple FHS scores

-- Time: ~5 seconds
```

#### 4.2 Verify Test Data

```sql
-- Check organization
SELECT COUNT(*) as org_count FROM organizations;
-- Expected: 1

-- Check users
SELECT COUNT(*) as user_count FROM users;
-- Expected: 3
SELECT COUNT(*) as admin_count FROM users WHERE role = 'admin';
-- Expected: 1

-- Check clients
SELECT COUNT(*) as client_count FROM clients;
-- Expected: 5

-- Check transactions
SELECT COUNT(*) as transaction_count FROM transactions;
-- Expected: 20+

-- Check invoices
SELECT COUNT(*) as invoice_count FROM invoices;
-- Expected: 10+
```

---

### Phase 5: Connection Validation

#### 5.1 Test Authentication Integration

```sql
-- Simulate JWT claims for RLS testing
SET request.jwt.claims = '{"sub":"b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","role":"authenticated"}';

-- Try to access data
SELECT COUNT(*) FROM organizations;

-- Reset JWT
RESET request.jwt.claims;
```

#### 5.2 Verify Supabase Auth Connection

In your application:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test connection
const { data, error } = await supabase.auth.getSession()
console.log('Auth session:', data.session ? 'Connected' : 'Not connected')
```

---

### Phase 6: Performance Verification

#### 6.1 Check Index Usage

```sql
-- View index usage statistics
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### 6.2 Monitor Query Performance

```sql
-- Enable query logging
SET log_min_duration_statement = 1000; -- Log queries > 1 second

-- Run a test query
SELECT * FROM clients WHERE organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Check slow query log
SELECT * FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 6.3 Cache Hit Ratio

```sql
-- Check cache hit ratio (should be > 99% for healthy database)
SELECT
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

---

### Phase 7: Backup Configuration

#### 7.1 Enable Automated Backups

In Supabase Dashboard:
1. Go to Project Settings
2. Backups section
3. Enable automatic backups (minimum daily)
4. Set retention policy (recommended: 7 days)

#### 7.2 Test Restore Procedure

```sql
-- Before starting, backup to SQL
-- In Supabase: Database → Backups → Download

-- Create a restore point
-- This documents your recovery procedure
```

---

## Post-Deployment Checklist

### Security Verification
- [ ] RLS is enabled on all sensitive tables
- [ ] RLS policies are tested with different roles
- [ ] Audit logging is functional
- [ ] JWT integration with Supabase Auth works
- [ ] Service role key is secure and only used server-side

### Performance Verification
- [ ] All indexes are created (55+)
- [ ] Common queries perform well (< 100ms)
- [ ] Cache hit ratio > 99%
- [ ] No slow queries in logs
- [ ] Table sizes are reasonable

### Data Verification
- [ ] Test organization created successfully
- [ ] Test users have correct roles
- [ ] Test clients visible only to authorized users
- [ ] Transactions properly linked to clients
- [ ] Invoices calculate amounts correctly
- [ ] Documents store metadata properly

### Application Integration
- [ ] Supabase connection string configured
- [ ] Environment variables set correctly
- [ ] Authentication flow works (login/logout)
- [ ] Multi-tenant isolation verified
- [ ] Role-based access control working
- [ ] Audit logging captures events

### Compliance Verification
- [ ] Audit logs are being captured
- [ ] User actions are tracked
- [ ] IP addresses are logged
- [ ] Soft deletes working properly
- [ ] Compliance framework categories used

---

## Troubleshooting

### Issue: "Relation does not exist"
**Cause:** Migration 001_init.sql wasn't run
**Solution:** Execute migrations in order: 001 → 002 → 003 → 004

### Issue: "Permission denied for schema public"
**Cause:** User doesn't have proper database privileges
**Solution:** Use Supabase dashboard or admin user credentials

### Issue: "RLS policy blocks query"
**Cause:** RLS policy doesn't match JWT claims
**Solution:** Check `request.jwt.claims` and RLS policy logic

### Issue: Slow queries after deployment
**Cause:** Indexes not used or statistics stale
**Solution:** Run `ANALYZE;` to update statistics

### Issue: Memory or disk space exceeded
**Cause:** Large result sets or partition growth
**Solution:** Implement pagination, clean old audit logs

### Issue: Cannot connect from application
**Cause:** Connection string or credentials incorrect
**Solution:** Verify `NEXT_PUBLIC_SUPABASE_URL` and keys in environment

---

## Rollback Procedure

If needed to rollback:

```sql
-- Step 1: Backup current data (if important)
-- In Supabase: Database → Backups → Download

-- Step 2: Run rollback migration
psql postgresql://[...] < database/migrations/000_rollback.sql

-- Step 3: Verify tables are dropped
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Should be significantly lower
```

**Note:** Rollback is destructive - only use if necessary. Better to keep failed state for investigation.

---

## Maintenance Tasks

### Weekly
- [ ] Monitor slow query logs
- [ ] Check index usage statistics
- [ ] Review failed authentication attempts
- [ ] Verify backup completion

### Monthly
- [ ] Analyze table statistics
- [ ] Review audit log volume
- [ ] Check for unused indexes
- [ ] Update database credentials rotation

### Quarterly
- [ ] Review and optimize slow queries
- [ ] Analyze partition growth
- [ ] Test restore procedure
- [ ] Security audit of RLS policies

### Annually
- [ ] Full schema review
- [ ] Capacity planning based on growth
- [ ] Update migration documentation
- [ ] Security assessment

---

## Performance Targets

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Query latency (reads) | < 100ms | Check indexes, optimize query |
| Query latency (writes) | < 500ms | Check triggers, constraints |
| Cache hit ratio | > 99% | Increase shared_buffers |
| Table scan %age | < 5% | Review missing indexes |
| Slow queries (> 1s) | < 1 per hour | Investigate and optimize |
| Audit log growth | < 10GB/month | Implement retention |
| Disk usage | < 80% | Archive or clean data |

---

## Support & Documentation

### Key Reference Files
- `DATABASE_MIGRATIONS_COMPLETE.md` - Overview of all migrations
- `SCHEMA_REFERENCE.md` - Detailed table and column specifications
- `database/README.md` - Migration runner documentation
- `database/MIGRATION_CHECKLIST.md` - Deployment tasks

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [RLS Policy Guide](https://www.postgresql.org/docs/current/sql-createpolicy.html)

---

## Final Checklist

Before going to production:

- [ ] All 4 migrations run successfully
- [ ] 13+ tables created
- [ ] 55+ indexes created
- [ ] 25+ RLS policies active
- [ ] Audit logging functional
- [ ] Test data loads without errors
- [ ] RLS policies tested with different users
- [ ] Application connects to database
- [ ] Authentication flow works end-to-end
- [ ] Backup strategy configured
- [ ] Monitoring and alerting configured
- [ ] Documentation reviewed and understood
- [ ] Security review completed
- [ ] Performance baselines established
- [ ] Disaster recovery plan documented

---

## Sign-Off

**Deployment Status:** READY FOR PRODUCTION

**Database Engineer:** Dana Querymaster
**Date:** November 8, 2025
**Environment:** Supabase PostgreSQL
**Version:** 1.0 - Complete Schema

---

**Last Updated:** November 8, 2025
**Next Review:** [Set your review date]

