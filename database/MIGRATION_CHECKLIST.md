# Database Migration Checklist

Use this checklist when setting up the database for the first time or deploying to a new environment.

## Pre-Migration Checklist

### Environment Setup

- [ ] PostgreSQL 13+ or Supabase project created
- [ ] Database connection URL obtained
- [ ] `.env.local` file created with `DATABASE_URL`
- [ ] PostgreSQL client tools installed (`psql` command available)
- [ ] Node.js 18+ installed
- [ ] Project dependencies installed (`npm install`)

### Verification Steps

```bash
# Verify PostgreSQL version
psql $DATABASE_URL -c "SELECT version();"

# Should be PostgreSQL 13 or higher

# Verify connection
psql $DATABASE_URL -c "SELECT current_database();"

# Verify Node.js version
node --version
# Should be v18.0.0 or higher
```

## Migration Steps

### Step 1: Run Migrations

```bash
# Option A: Using npm scripts (recommended)
npm run db:migrate

# Option B: Manual execution
psql $DATABASE_URL -f database/migrations/001_init.sql
psql $DATABASE_URL -f database/migrations/002_rls_policies.sql
psql $DATABASE_URL -f database/migrations/003_audit_tables.sql
psql $DATABASE_URL -f database/migrations/004_indexes.sql

# Option C: Using Supabase CLI
supabase db push
```

**Expected Output:**
- [ ] All migrations complete without errors
- [ ] 11 tables created (organizations, users, clients, transactions, invoices, documents, fhs_scores, integrations, sync_logs, audit_logs, compliance_logs)
- [ ] RLS enabled on all tables
- [ ] Indexes created successfully

### Step 2: Verify Schema

```bash
# List all tables
psql $DATABASE_URL -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"
```

**Expected Tables:**
- [ ] audit_logs
- [ ] clients
- [ ] compliance_logs
- [ ] documents
- [ ] fhs_scores
- [ ] integrations
- [ ] invoices
- [ ] organizations
- [ ] sync_logs
- [ ] transactions
- [ ] users

### Step 3: Verify RLS

```bash
# Check RLS is enabled
psql $DATABASE_URL -c "
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"
```

**Expected Result:**
- [ ] All tables show `rowsecurity = true`

### Step 4: Verify Indexes

```bash
# List all indexes
psql $DATABASE_URL -c "
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"
```

**Expected Result:**
- [ ] 50+ indexes created
- [ ] All foreign keys have indexes
- [ ] All unique constraints have indexes

### Step 5: Load Seed Data (Development Only)

⚠️ **DEVELOPMENT ENVIRONMENTS ONLY** - Do NOT run in production!

```bash
# Load test data
npm run db:seed
```

**Expected Result:**
- [ ] 1 organization created
- [ ] 3 users created (owner, accountant, viewer)
- [ ] 5 clients created
- [ ] 20 transactions created
- [ ] 3 invoices created
- [ ] 2 FHS scores created
- [ ] 2 integrations created

### Step 6: Verify Seed Data

```bash
# Check record counts
psql $DATABASE_URL -c "
SELECT 'organizations' AS table, COUNT(*) FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'fhs_scores', COUNT(*) FROM fhs_scores;
"
```

**Expected Counts (if seeded):**
- [ ] organizations: 1
- [ ] users: 3
- [ ] clients: 5
- [ ] transactions: 20
- [ ] invoices: 3
- [ ] fhs_scores: 2

## Post-Migration Checklist

### Functional Testing

- [ ] Can connect to database from application
- [ ] Can query organizations table
- [ ] Can query users table (with RLS)
- [ ] Can authenticate with test credentials
- [ ] RLS policies working correctly
- [ ] Audit triggers firing on INSERT/UPDATE/DELETE
- [ ] Full-text search working on documents

### Test Authentication (if seeded)

Try logging in with test credentials:

**Owner Account:**
- Email: `owner@acmebookkeeping.com`
- Password: `password123`
- Expected: Full access to all features

**Accountant Account:**
- Email: `accountant@acmebookkeeping.com`
- Password: `password123`
- Expected: Can manage clients, transactions, invoices

**Viewer Account:**
- Email: `viewer@acmebookkeeping.com`
- Password: `password123`
- Expected: Read-only access

### Performance Testing

```bash
# Check query performance
psql $DATABASE_URL -c "
EXPLAIN ANALYZE
SELECT c.*, u.email AS accountant_email
FROM clients c
LEFT JOIN users u ON c.assigned_accountant_id = u.id
WHERE c.organization_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
AND c.status = 'active';
"
```

**Expected:**
- [ ] Query uses index on organization_id
- [ ] Execution time < 10ms for small datasets
- [ ] No sequential scans on large tables

### Security Testing

```bash
# Verify RLS policies work
psql $DATABASE_URL -c "
SET request.jwt.claims = '{\"sub\": \"b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11\"}';
SELECT COUNT(*) FROM clients;
"
```

**Expected:**
- [ ] Only returns clients for the authenticated user's organization
- [ ] Cross-tenant queries blocked

### Audit Testing

```bash
# Verify audit logs are created
psql $DATABASE_URL -c "
SELECT action, resource_type, COUNT(*)
FROM audit_logs
GROUP BY action, resource_type
ORDER BY COUNT(*) DESC;
"
```

**Expected:**
- [ ] INSERT, UPDATE operations logged
- [ ] Sensitive fields redacted
- [ ] User IDs captured

## Environment-Specific Steps

### Development Environment

- [x] Migrations run
- [x] Seed data loaded
- [x] Test credentials work
- [ ] Development tools configured

### Staging Environment

- [ ] Migrations run
- [ ] RLS verified
- [ ] Performance tested
- [ ] Security tested
- [ ] Monitoring enabled
- [ ] Backup configured
- ⚠️ NO seed data

### Production Environment

- [ ] Database backup taken BEFORE migration
- [ ] Migrations run during maintenance window
- [ ] All tables verified
- [ ] RLS verified
- [ ] Performance tested with production data
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Backup configured and tested
- [ ] Recovery plan documented
- ⚠️ NO seed data
- ⚠️ NO test credentials

## Rollback Procedure

If something goes wrong:

```bash
# Development only - complete rollback
npm run db:rollback

# Then re-run migrations
npm run db:migrate
```

For production, use backup restoration:

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup_file.dump
```

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution:**
```bash
# Run rollback first
npm run db:rollback

# Then re-run migrations
npm run db:migrate
```

### Issue: RLS prevents all queries

**Solution:**
```bash
# Check if user context is set
psql $DATABASE_URL -c "SELECT auth.user_id();"

# If null, set it for testing
psql $DATABASE_URL -c "
SET request.jwt.claims = '{\"sub\": \"user-uuid\"}';
SELECT * FROM clients;
"
```

### Issue: Slow queries

**Solution:**
```bash
# Update statistics
psql $DATABASE_URL -c "ANALYZE;"

# Check if indexes are being used
psql $DATABASE_URL -c "
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0;
"
```

### Issue: Audit logs not created

**Solution:**
```bash
# Check if triggers exist
psql $DATABASE_URL -c "
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
"
```

## Success Criteria

Migration is successful when:

- ✅ All migrations executed without errors
- ✅ All expected tables created
- ✅ RLS enabled on all tables
- ✅ All indexes created
- ✅ Triggers functioning correctly
- ✅ Test queries execute successfully
- ✅ Authentication works (if seeded)
- ✅ Performance meets expectations
- ✅ Audit logging works

## Next Steps

After successful migration:

1. [ ] Configure application connection string
2. [ ] Set up database monitoring
3. [ ] Configure automated backups
4. [ ] Document recovery procedures
5. [ ] Set up CI/CD for future migrations
6. [ ] Train team on database usage
7. [ ] Start application development

## Support

For issues or questions:
- Review migration logs
- Check PostgreSQL logs
- Consult database/README.md
- Contact Dana Querymaster (Database Engineer)

---

**Last Updated**: 2024-11-07
**Version**: 1.0.0
