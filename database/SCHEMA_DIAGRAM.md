# PACSUM ERP - Database Schema Diagram

## Entity Relationship Diagram (ERD)

### Core Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORGANIZATIONS                            │
│─────────────────────────────────────────────────────────────────│
│ id (UUID, PK)                                                   │
│ name (TEXT)                                                     │
│ slug (TEXT, UNIQUE)                                             │
│ subscription_tier (TEXT)                                        │
│ subscription_status (TEXT)                                      │
│ settings (JSONB)                                                │
│ created_at, updated_at, deleted_at (TIMESTAMPTZ)                │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ├──────────────────────────────────────────────┐
         │                                              │
         ▼                                              ▼
┌───────────────────────────┐                  ┌──────────────────────┐
│         USERS             │                  │      CLIENTS         │
│───────────────────────────│                  │──────────────────────│
│ id (UUID, PK)             │                  │ id (UUID, PK)        │
│ organization_id (FK) ─────┤                  │ organization_id (FK)─┤
│ email (TEXT, UNIQUE)      │                  │ name (TEXT)          │
│ password_hash (TEXT)      │                  │ client_code (TEXT)   │
│ first_name (TEXT)         │                  │ industry (TEXT)      │
│ last_name (TEXT)          │                  │ entity_type (TEXT)   │
│ role (TEXT)               │                  │ status (TEXT)        │
│ status (TEXT)             │                  │ current_fhs_score    │
│ preferences (JSONB)       │                  │ assigned_accountant  │
│ created_at, updated_at    │                  │   (FK → users.id)    │
└───────────────────────────┘                  └──────────────────────┘
         │                                              │
         │                                              │ 1:N
         │                                              ├──────────┬──────────┬───────────┐
         │                                              │          │          │           │
         │                                              ▼          ▼          ▼           ▼
         │                                      ┌─────────────┐ ┌────────┐ ┌──────────┐ ┌───────────┐
         │                                      │TRANSACTIONS │ │INVOICES│ │DOCUMENTS │ │FHS_SCORES │
         │                                      │─────────────│ │────────│ │──────────│ │───────────│
         │                                      │id (PK)      │ │id (PK) │ │id (PK)   │ │id (PK)    │
         │ Created/Modified By                  │client_id(FK)│ │client  │ │client_id │ │client_id  │
         └──────────────────────────────────────┤org_id (FK)  │ │_id(FK) │ │(FK)      │ │(FK)       │
                                                │date         │ │number  │ │filename  │ │score      │
                                                │amount       │ │total   │ │type      │ │date       │
                                                │category     │ │status  │ │storage   │ │components │
                                                │type         │ │paid_at │ │ocr_text  │ │metrics    │
                                                │status       │ │items   │ │tags[]    │ │insights[] │
                                                └─────────────┘ └────────┘ └──────────┘ └───────────┘
```

### Integration Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORGANIZATIONS                            │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌───────────────────────────────────────────────────────────────┐
│                      INTEGRATIONS                              │
│───────────────────────────────────────────────────────────────│
│ id (UUID, PK)                                                 │
│ organization_id (FK)                                          │
│ provider (TEXT) - 'quickbooks', 'stripe', 'plaid'             │
│ status (TEXT)                                                 │
│ credentials (JSONB) - encrypted                               │
│ config (JSONB)                                                │
│ last_sync_at, next_sync_at (TIMESTAMPTZ)                      │
└───────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌───────────────────────────────────────────────────────────────┐
│                      SYNC_LOGS                                 │
│───────────────────────────────────────────────────────────────│
│ id (UUID, PK)                                                 │
│ integration_id (FK)                                           │
│ sync_type (TEXT)                                              │
│ status (TEXT)                                                 │
│ started_at, completed_at (TIMESTAMPTZ)                        │
│ records_processed, records_created, records_updated (INT)     │
└───────────────────────────────────────────────────────────────┘
```

### Audit & Compliance Entities

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORGANIZATIONS                            │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ├──────────────────────────────────────────────┐
         │                                              │
         ▼                                              ▼
┌──────────────────────────┐              ┌────────────────────────────┐
│     AUDIT_LOGS           │              │   COMPLIANCE_LOGS          │
│──────────────────────────│              │────────────────────────────│
│ id (UUID, PK)            │              │ id (UUID, PK)              │
│ organization_id (FK)     │              │ organization_id (FK)       │
│ user_id (FK)             │              │ user_id (FK)               │
│ action (TEXT)            │              │ event_type (TEXT)          │
│ resource_type (TEXT)     │              │ event_category (TEXT)      │
│ resource_id (UUID)       │              │ severity (TEXT)            │
│ old_values (JSONB)       │              │ description (TEXT)         │
│ new_values (JSONB)       │              │ details (JSONB)            │
│ changes (JSONB)          │              │ compliance_framework[]     │
│ ip_address (INET)        │              │ remediation_status (TEXT)  │
│ created_at (TIMESTAMPTZ) │              │ created_at (TIMESTAMPTZ)   │
└──────────────────────────┘              └────────────────────────────┘
```

## Table Relationships Summary

### Primary Relationships

| Parent Table | Child Table | Relationship | Cascade |
|-------------|-------------|--------------|---------|
| organizations | users | 1:N | CASCADE |
| organizations | clients | 1:N | CASCADE |
| organizations | integrations | 1:N | CASCADE |
| organizations | audit_logs | 1:N | CASCADE |
| clients | transactions | 1:N | CASCADE |
| clients | invoices | 1:N | CASCADE |
| clients | documents | 1:N | CASCADE |
| clients | fhs_scores | 1:N | CASCADE |
| users | clients | 1:N (assigned) | SET NULL |
| integrations | sync_logs | 1:N | CASCADE |

### Key Constraints

**Unique Constraints:**
- organizations.slug
- users.email
- clients(organization_id, client_code)
- invoices(organization_id, invoice_number)
- documents.storage_path
- integrations(organization_id, provider)

**Check Constraints:**
- users.role IN ('owner', 'admin', 'accountant', 'viewer')
- clients.status IN ('active', 'inactive', 'archived', 'prospect')
- transactions.transaction_type IN ('income', 'expense', 'transfer', 'adjustment')
- invoices.status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'cancelled')
- fhs_scores.score BETWEEN 0 AND 100

## Data Types Reference

### Common Patterns

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary keys |
| *_id | UUID | Foreign keys |
| name, description | TEXT | Variable length text |
| email | TEXT | With regex validation |
| amount, price | NUMERIC(15,2) | Currency values |
| score | NUMERIC(5,2) | Percentages/scores |
| status | TEXT | Enumerated with CHECK |
| created_at | TIMESTAMPTZ | Auto-set on insert |
| updated_at | TIMESTAMPTZ | Auto-updated on change |
| deleted_at | TIMESTAMPTZ | Soft delete support |
| settings, metadata | JSONB | Flexible data storage |
| tags | TEXT[] | Array of strings |

## Index Strategy

### Primary Indexes (Automatic)
- All primary keys (id)
- All unique constraints (email, slug, etc.)

### Foreign Key Indexes
- organization_id on all multi-tenant tables
- client_id on all client-related tables
- user_id on audit and created_by fields

### Query Performance Indexes
- Date range queries (transaction_date, invoice_date, etc.)
- Status filtering (status columns)
- Full-text search (GIN indexes on TEXT fields)
- JSONB queries (GIN indexes on JSONB columns)

### Composite Indexes
- (organization_id, status) - filtered lists
- (client_id, transaction_date DESC) - client activity
- (organization_id, transaction_date DESC) - reporting
- (client_id, score_date DESC) - FHS history

## Security & Access Control

### Row Level Security (RLS)

All tables have RLS enabled with policies:

**SELECT**: Users can view records in their organization
**INSERT**: Role-based (accountant+ for most tables)
**UPDATE**: Role-based with ownership checks
**DELETE**: Admin+ only (or soft deletes via updated_at)

### Special Cases

- **audit_logs**: Read-only for admins, write-only for system
- **users**: Can update own profile, admins manage others
- **integrations**: Admin-only management
- **documents**: Can delete own uploads

## Audit Trail

### Automatic Audit Logging

All data changes are automatically logged via triggers:
- INSERT: Captures new_values
- UPDATE: Captures old_values, new_values, and changes (diff)
- DELETE: Captures old_values

### Sensitive Data Redaction

The following fields are automatically redacted in audit logs:
- users.password_hash
- users.two_factor_secret
- integrations.credentials

### Compliance Tracking

Separate compliance_logs table for:
- Security events
- Privacy requests (GDPR, CCPA)
- Access control changes
- Incident tracking

## Performance Considerations

### Optimizations

1. **Generated Columns**:
   - users.full_name (first_name + last_name)
   - invoices.amount_due (total_amount - amount_paid)
   - sync_logs.duration_seconds (completed_at - started_at)

2. **Cached Values**:
   - clients.current_fhs_score (from fhs_scores)
   - clients.fhs_last_calculated_at

3. **Partial Indexes**:
   - WHERE deleted_at IS NULL (soft deletes)
   - WHERE status = 'active' (active records)
   - WHERE reconciled = FALSE (pending work)

4. **JSONB Storage**:
   - Flexible schema for settings/metadata
   - GIN indexes for fast querying
   - Normalized data where performance matters

## Migration Order

```
1. Extensions (uuid-ossp, pgcrypto, pg_trgm)
   ↓
2. Core Tables (organizations, users, clients)
   ↓
3. Data Tables (transactions, invoices, documents, fhs_scores)
   ↓
4. Integration Tables (integrations, sync_logs)
   ↓
5. Audit Tables (audit_logs, compliance_logs)
   ↓
6. Triggers (updated_at, audit logging)
   ↓
7. RLS Policies (helper functions, policies)
   ↓
8. Indexes (performance optimization)
   ↓
9. Seed Data (development only)
```

## Backup & Recovery

### Recommended Strategy

- **Daily**: Full database backup (automated)
- **Hourly**: WAL archiving (point-in-time recovery)
- **Weekly**: Test restore procedure
- **Monthly**: Archive old audit logs

### Critical Tables (Priority Order)

1. organizations, users (authentication)
2. clients, transactions (business data)
3. invoices, documents (financial records)
4. fhs_scores (analytics)
5. integrations (configuration)
6. audit_logs (compliance)

---

**Note**: This diagram represents the logical schema. For actual SQL DDL, see migration files.
