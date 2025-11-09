# PACSUM ERP - Database Schema Documentation

## Overview

Complete PostgreSQL/Supabase database schema for the PACSUM ERP system. This database implements a multi-tenant architecture with row-level security, comprehensive audit logging, and optimized indexes for performance.

## Database Architecture

### Technology Stack
- **Database**: PostgreSQL 13+ (Supabase)
- **Extensions**: uuid-ossp, pgcrypto, pg_trgm
- **Security**: Row Level Security (RLS)
- **Compliance**: SOC 2, PCI DSS ready

### Multi-Tenant Design
- Organization-based isolation
- RLS policies enforce data separation
- All tables include `organization_id` for tenant filtering

## Schema Files

### Migrations

Run migrations in order:

1. **001_init.sql** - Core schema
   - Creates all data tables
   - Sets up primary/foreign keys
   - Adds constraints and triggers

2. **002_rls_policies.sql** - Row Level Security
   - Enables RLS on all tables
   - Creates helper functions
   - Implements tenant isolation policies

3. **003_audit_tables.sql** - Audit logging
   - Creates audit_logs table
   - Creates compliance_logs table
   - Sets up automatic audit triggers
   - Implements sensitive data redaction

4. **004_indexes.sql** - Performance optimization
   - Creates indexes for common queries
   - Optimizes JOIN operations
   - Enables full-text search

### Seeds

- **seeds/dev-data.sql** - Development test data
  - 1 organization (ACME Bookkeeping)
  - 3 users (owner, accountant, viewer)
  - 5 clients with diverse profiles
  - 20 sample transactions
  - 3 invoices (paid, sent, partial)
  - 2 FHS score calculations

## Database Tables

### Core Tables

#### organizations
Multi-tenant organizations (bookkeeping firms)
- UUID primary key
- Subscription management
- JSONB settings for flexibility
- Soft delete support

#### users
System users with role-based access
- Roles: owner, admin, accountant, viewer
- Email/password authentication
- Two-factor authentication support
- Login tracking and security features

#### clients
Customer/client records
- Organization-scoped
- Contact and business information
- Tax information (EIN/SSN)
- Financial Health Score cache
- Integration IDs (QuickBooks, Stripe)

#### transactions
Financial transaction records
- Client-scoped
- Income/expense categorization
- Bank reconciliation tracking
- Tax deductibility flags
- Document attachments

#### invoices
Client billing and invoicing
- Auto-calculated amount_due
- JSONB line items
- Payment tracking
- Status workflow (draft → sent → paid)

#### documents
Document metadata (files in Supabase Storage)
- Polymorphic relations
- OCR text extraction
- Tag-based search
- Version control support

#### fhs_scores
Financial Health Score history
- Score components breakdown
- Financial metrics snapshot
- Trend analysis
- Insights and recommendations

### Integration Tables

#### integrations
Third-party service configurations
- QuickBooks, Stripe, Plaid support
- Encrypted credentials
- Sync scheduling
- Error tracking

#### sync_logs
Integration synchronization history
- Timing and performance metrics
- Success/failure tracking
- Record counts

### Audit Tables

#### audit_logs
Comprehensive audit trail
- All data changes logged
- User actions tracked
- Compliance-ready
- Sensitive data redacted

#### compliance_logs
Security and compliance events
- Incident tracking
- Remediation workflow
- Evidence documentation

## Row Level Security (RLS)

### Policy Overview

**Organizations**: Users can only see their own org
**Users**: Can view users in their org
**Clients**: Organization-scoped access
**Transactions**: Organization-scoped access
**Invoices**: Organization-scoped access
**Documents**: Organization-scoped access
**FHS Scores**: Organization-scoped access
**Integrations**: Admin-only management
**Audit Logs**: Admin-only viewing

### Role Permissions

| Resource | Owner | Admin | Accountant | Viewer |
|----------|-------|-------|------------|--------|
| Organizations | Full | View | View | View |
| Users | Full | Manage | View | View |
| Clients | Full | Full | Full | View |
| Transactions | Full | Full | Full | View |
| Invoices | Full | Full | Full | View |
| Documents | Full | Full | Full | View |
| FHS Scores | Full | Full | Full | View |
| Integrations | Full | Full | View | View |
| Audit Logs | Full | Full | None | None |

## Indexes

### High-Performance Queries

All tables include indexes for:
- Primary keys (automatic)
- Foreign keys
- Common filter fields (status, date ranges)
- Organization scoping
- Full-text search (where applicable)

### Index Strategy

- B-tree indexes for equality and range queries
- GIN indexes for JSONB and array columns
- Partial indexes for filtered queries
- Composite indexes for multi-column queries

## Running Migrations

### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or run individual files
psql $DATABASE_URL -f database/migrations/001_init.sql
psql $DATABASE_URL -f database/migrations/002_rls_policies.sql
psql $DATABASE_URL -f database/migrations/003_audit_tables.sql
psql $DATABASE_URL -f database/migrations/004_indexes.sql
```

### Using psql Directly

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run all migrations in order
psql $DATABASE_URL -f database/migrations/001_init.sql
psql $DATABASE_URL -f database/migrations/002_rls_policies.sql
psql $DATABASE_URL -f database/migrations/003_audit_tables.sql
psql $DATABASE_URL -f database/migrations/004_indexes.sql

# Load seed data (development only!)
psql $DATABASE_URL -f database/seeds/dev-data.sql
```

### Using Node.js Migration Script

```bash
npm run db:migrate
npm run db:seed  # development only
```

## Development Workflow

### 1. Initial Setup

```bash
# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### 2. Testing Credentials

After seeding, use these test accounts:

**Owner Account**
- Email: owner@acmebookkeeping.com
- Password: password123
- Role: owner

**Accountant Account**
- Email: accountant@acmebookkeeping.com
- Password: password123
- Role: accountant

**Viewer Account**
- Email: viewer@acmebookkeeping.com
- Password: password123
- Role: viewer

### 3. Verify Schema

```sql
-- List all tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- View RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Check indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Data Model Relationships

```
organizations (1) ─── (N) users
                 └─── (N) clients ─── (N) transactions
                                  └─── (N) invoices
                                  └─── (N) documents
                                  └─── (N) fhs_scores
                 └─── (N) integrations ─── (N) sync_logs
                 └─── (N) audit_logs
```

## Compliance Features

### SOC 2 Type II
- Comprehensive audit logging
- Access control via RLS
- Sensitive data redaction
- 7-year retention policy

### PCI DSS
- No credit card data stored
- Payment processing via Stripe
- Encrypted credentials
- Audit trail for all transactions

### GDPR/CCPA
- User data isolation
- Soft delete support
- Data export capabilities
- Retention policies

## Performance Considerations

### Optimization Strategies

1. **Indexes**: All foreign keys and common queries indexed
2. **JSONB**: Flexible data storage with GIN indexes
3. **Partitioning**: Consider partitioning audit_logs by month
4. **Caching**: Current FHS score cached in clients table
5. **Generated Columns**: Auto-computed fields (amount_due, full_name)

### Query Best Practices

```sql
-- Good: Uses index on organization_id
SELECT * FROM clients
WHERE organization_id = '...' AND status = 'active';

-- Good: Uses composite index
SELECT * FROM transactions
WHERE client_id = '...'
ORDER BY transaction_date DESC;

-- Avoid: Full table scan
SELECT * FROM transactions
WHERE description LIKE '%keyword%';

-- Better: Use full-text search
SELECT * FROM documents
WHERE to_tsvector('english', ocr_text) @@ to_tsquery('keyword');
```

## Backup and Maintenance

### Recommended Schedule

**Daily**: Automated backups (Supabase automatic)
**Weekly**: VACUUM ANALYZE for statistics
**Monthly**: Review and archive old audit logs
**Quarterly**: Index maintenance and optimization

### Maintenance Queries

```sql
-- Update statistics
ANALYZE;

-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND idx_scan = 0;

-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Clean old audit logs (7+ years)
SELECT cleanup_old_audit_logs(2555);
```

## Troubleshooting

### Common Issues

**Issue**: RLS prevents queries
**Solution**: Ensure user context is set correctly

```sql
-- Set user context for testing
SET request.jwt.claims = '{"sub": "user-uuid"}';
```

**Issue**: Slow queries
**Solution**: Check if indexes are being used

```sql
EXPLAIN ANALYZE SELECT ... ;
```

**Issue**: Migration fails
**Solution**: Check dependencies, run in order

## Security Best Practices

1. **Never disable RLS** in production
2. **Always use service_role** for system operations
3. **Encrypt credentials** before storing in integrations table
4. **Rotate passwords** regularly
5. **Monitor audit logs** for suspicious activity
6. **Use prepared statements** to prevent SQL injection
7. **Limit database user privileges** per environment

## Support

For database-related questions:
- Check this README
- Review migration files
- Consult PostgreSQL documentation
- Contact Dana Querymaster (Database Engineer)

---

**Author**: Dana Querymaster (Database Engineer)
**Last Updated**: 2024-11-07
**Version**: 1.0.0
**Status**: Production Ready
