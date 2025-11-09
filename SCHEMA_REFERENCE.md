# PACSUM ERP - Database Schema Technical Reference

## Table of Contents
1. [Core Entity Diagram](#core-entity-diagram)
2. [Table Reference](#table-reference)
3. [Column Specifications](#column-specifications)
4. [Relationships](#relationships)
5. [Constraints](#constraints)
6. [Trigger Functions](#trigger-functions)
7. [Query Examples](#query-examples)

---

## Core Entity Diagram

```
                          organizations
                                │
                ┌───────────────┼───────────────┐
                │               │               │
              users          clients       integrations
                │               │               │
                │       ┌───────┼───────┐      │
                │       │       │       │      │
            sessions  transactions invoices  sync_logs
                       │       │
                       │   documents
                       │
                   fhs_scores

        ┌─────────────────────────────────┐
        │   Audit & Compliance Tables     │
        │  (connected to all above)       │
        ├─────────────────────────────────┤
        │  • audit_logs                   │
        │  • compliance_logs              │
        │  • api_logs                     │
        │  • data_access_logs             │
        └─────────────────────────────────┘
```

---

## Table Reference

### 1. organizations
**Purpose:** Multi-tenant organization management
**Type:** Master table
**Rows:** ~1-100 per deployment
**Partitioning:** Not needed (small table)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | - | Organization legal name |
| slug | TEXT | NO | - | URL-friendly identifier (UNIQUE) |
| settings | JSONB | YES | Default settings | Flexible configuration |
| subscription_tier | TEXT | NO | 'starter' | Tier level (starter/professional/enterprise) |
| subscription_status | TEXT | NO | 'active' | Active/trial/suspended/cancelled |
| subscription_expires_at | TIMESTAMPTZ | YES | - | Subscription expiration |
| contact_email | TEXT | YES | - | Main contact email (validated) |
| contact_phone | TEXT | YES | - | Main contact phone |
| billing_address | JSONB | YES | - | Billing address structure |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |

**Indexes:**
- `idx_organizations_slug` (UNIQUE)
- `idx_organizations_status` (partial)

**Constraints:**
- `valid_email` (regex validation)
- `valid_slug` (regex validation)

**RLS Policies:**
- SELECT: Users can view their own org
- UPDATE: Only owners can update
- INSERT/DELETE: Only owners can manage

---

### 2. users
**Purpose:** Authentication, authorization, user management
**Type:** Core operational table
**Rows:** ~10-1000s depending on org size
**Partitioning:** By organization_id (optional)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| email | TEXT | NO | - | Login email (UNIQUE, validated) |
| password_hash | TEXT | YES | - | bcrypt hash (NULL for SSO) |
| email_verified | BOOLEAN | NO | false | Email verification flag |
| email_verified_at | TIMESTAMPTZ | YES | - | When email was verified |
| first_name | TEXT | NO | - | User first name |
| last_name | TEXT | NO | - | User last name |
| full_name | TEXT | GENERATED | - | Computed full_name |
| avatar_url | TEXT | YES | - | Profile picture URL |
| phone | TEXT | YES | - | Contact phone number |
| role | TEXT | NO | - | owner/admin/accountant/viewer |
| permissions | JSONB | YES | [] | Additional granular permissions |
| status | TEXT | NO | 'active' | active/inactive/suspended |
| last_login_at | TIMESTAMPTZ | YES | - | Last successful login |
| last_login_ip | INET | YES | - | Last login IP address |
| failed_login_attempts | INTEGER | NO | 0 | Count of failed attempts |
| locked_until | TIMESTAMPTZ | YES | - | Account lock expiration |
| two_factor_enabled | BOOLEAN | NO | false | 2FA status |
| two_factor_secret | TEXT | YES | - | TOTP secret (encrypted) |
| reset_token | TEXT | YES | - | Password reset token |
| reset_token_expires_at | TIMESTAMPTZ | YES | - | Reset token expiration |
| preferences | JSONB | YES | Default prefs | User preferences |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |

**Indexes:**
- `idx_users_email` (UNIQUE)
- `idx_users_organization_id`
- `idx_users_organization_role`
- `idx_users_last_login`
- `idx_users_locked`
- `idx_users_reset_token`

**Constraints:**
- `valid_email` (regex validation)
- `valid_failed_attempts` (>= 0)
- `FK organization_id`

---

### 3. clients
**Purpose:** Customer/client record management
**Type:** Core operational table
**Rows:** ~10s-1000s per organization
**Partitioning:** By organization_id

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| name | TEXT | NO | - | Client business name |
| legal_name | TEXT | YES | - | Legal entity name |
| client_code | TEXT | YES | - | Org-specific code |
| industry | TEXT | YES | - | Industry classification |
| entity_type | TEXT | YES | - | Business structure |
| primary_contact_name | TEXT | YES | - | Main contact person |
| primary_contact_email | TEXT | YES | - | Contact email (validated) |
| primary_contact_phone | TEXT | YES | - | Contact phone |
| website | TEXT | YES | - | Business website URL |
| address_line1 | TEXT | YES | - | Street address line 1 |
| address_line2 | TEXT | YES | - | Street address line 2 |
| city | TEXT | YES | - | City |
| state | TEXT | YES | - | State/province |
| postal_code | TEXT | YES | - | ZIP/postal code |
| country | TEXT | YES | 'US' | Country code |
| tax_id_number | TEXT | YES | - | EIN or SSN |
| tax_id_type | TEXT | YES | - | EIN or SSN |
| business_start_date | DATE | YES | - | Business start date |
| fiscal_year_end | TEXT | YES | - | MM-DD format |
| status | TEXT | NO | 'active' | active/inactive/archived/prospect |
| risk_level | TEXT | NO | 'low' | low/medium/high |
| current_fhs_score | NUMERIC(5,2) | YES | - | Latest FHS (0-100) |
| fhs_last_calculated_at | TIMESTAMPTZ | YES | - | When FHS was last calculated |
| billing_rate | NUMERIC(10,2) | YES | - | Monthly or hourly rate |
| billing_frequency | TEXT | YES | - | monthly/quarterly/annually/hourly |
| billing_day_of_month | INTEGER | YES | - | Billing day (1-31) |
| quickbooks_id | TEXT | YES | - | QB customer ID |
| stripe_customer_id | TEXT | YES | - | Stripe customer ID |
| notes | TEXT | YES | - | Internal notes |
| metadata | JSONB | YES | {} | Flexible metadata |
| assigned_accountant_id | UUID | YES | - | FK to assigned user |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |
| created_by | UUID | YES | - | FK to user who created |

**Indexes:**
- `idx_clients_organization_id`
- `idx_clients_organization_status`
- `idx_clients_assigned_accountant`
- `idx_clients_org_code` (UNIQUE)
- `idx_clients_fhs_score`
- `idx_clients_risk_level`
- `idx_clients_quickbooks_id`
- `idx_clients_stripe_id`
- `idx_clients_name_trgm` (GIN for full-text search)

---

### 4. transactions
**Purpose:** Financial transaction recording and tracking
**Type:** High-volume operational table
**Rows:** 1000s-100000s depending on org size
**Partitioning:** By organization_id AND date range (recommended)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| client_id | UUID | NO | - | FK to clients |
| transaction_date | DATE | NO | - | Transaction date |
| post_date | DATE | YES | - | Posted date (if different) |
| description | TEXT | NO | - | Transaction description |
| amount | NUMERIC(15,2) | NO | - | Transaction amount |
| category | TEXT | YES | - | Custom category |
| subcategory | TEXT | YES | - | Subcategory |
| transaction_type | TEXT | NO | - | income/expense/transfer/adjustment |
| payment_method | TEXT | YES | - | cash/check/card/ach/wire/other |
| check_number | TEXT | YES | - | Check number if applicable |
| reference_number | TEXT | YES | - | Reference/confirmation number |
| payee | TEXT | YES | - | Payment recipient |
| payer | TEXT | YES | - | Payment source |
| vendor_id | UUID | YES | - | FK to future vendors table |
| bank_account | TEXT | YES | - | Bank account identifier |
| reconciled | BOOLEAN | NO | false | Reconciliation flag |
| reconciled_at | TIMESTAMPTZ | YES | - | When reconciled |
| reconciled_by | UUID | YES | - | FK to reconciling user |
| tax_deductible | BOOLEAN | NO | false | Tax deductible flag |
| tax_category | TEXT | YES | - | Tax category |
| status | TEXT | NO | 'pending' | pending/posted/reconciled/void/disputed |
| is_billable | BOOLEAN | NO | false | Billable to client flag |
| is_reimbursable | BOOLEAN | NO | false | Reimbursable flag |
| quickbooks_id | TEXT | YES | - | QB transaction ID |
| stripe_transaction_id | TEXT | YES | - | Stripe transaction ID |
| receipt_url | TEXT | YES | - | Receipt document URL |
| notes | TEXT | YES | - | Transaction notes |
| metadata | JSONB | YES | {} | Flexible metadata |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |
| created_by | UUID | YES | - | FK to user who created |

**Indexes:**
- `idx_transactions_organization_id`
- `idx_transactions_client_id`
- `idx_transactions_date`
- `idx_transactions_status`
- `idx_transactions_amount`
- `idx_transactions_type_date` (composite)
- `idx_transactions_reconciled`

**Constraints:**
- `valid_amount` (!=0)
- `valid_dates` (post_date >= transaction_date)

---

### 5. invoices
**Purpose:** Invoice and billing management
**Type:** Operational table
**Rows:** 100s-10000s per organization
**Partitioning:** By organization_id (optional)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| client_id | UUID | NO | - | FK to clients |
| invoice_number | TEXT | NO | - | Human-readable invoice #(UNIQUE per org) |
| invoice_date | DATE | NO | - | Invoice creation date |
| due_date | DATE | NO | - | Payment due date |
| period_start_date | DATE | YES | - | Service period start |
| period_end_date | DATE | YES | - | Service period end |
| subtotal | NUMERIC(15,2) | NO | - | Amount before tax/discount |
| tax_amount | NUMERIC(15,2) | NO | 0 | Tax amount |
| discount_amount | NUMERIC(15,2) | NO | 0 | Discount amount |
| total_amount | NUMERIC(15,2) | NO | - | Final invoice total |
| amount_paid | NUMERIC(15,2) | NO | 0 | Amount paid to date |
| amount_due | NUMERIC(15,2) | GENERATED | - | Computed: total - paid |
| status | TEXT | NO | 'draft' | draft/sent/viewed/partial/paid/overdue/void |
| payment_terms | TEXT | NO | 'net_30' | due_on_receipt/net_15/30/60/90 |
| payment_method | TEXT | YES | - | Payment method if known |
| paid_at | TIMESTAMPTZ | YES | - | When paid |
| line_items | JSONB | NO | [] | Invoice line items JSON |
| notes | TEXT | YES | - | Invoice notes |
| terms_and_conditions | TEXT | YES | - | Payment terms text |
| quickbooks_id | TEXT | YES | - | QB invoice ID |
| stripe_invoice_id | TEXT | YES | - | Stripe invoice ID |
| sent_at | TIMESTAMPTZ | YES | - | When sent to client |
| last_viewed_at | TIMESTAMPTZ | YES | - | When client last viewed |
| last_reminder_sent_at | TIMESTAMPTZ | YES | - | Last reminder email |
| reminder_count | INTEGER | NO | 0 | Reminders sent count |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |
| created_by | UUID | YES | - | FK to user who created |

**Indexes:**
- `idx_invoices_organization_id`
- `idx_invoices_client_id`
- `idx_invoices_status`
- `idx_invoices_due_date`
- `idx_invoices_invoice_date`
- `idx_invoices_amount_due`
- `idx_invoices_stripe_id`
- `idx_invoices_paid_at`

**Line Items JSON Structure:**
```json
[
  {
    "description": "Bookkeeping services",
    "quantity": 10,
    "rate": 150.00,
    "amount": 1500.00,
    "category": "labor"
  }
]
```

---

### 6. documents
**Purpose:** Document metadata and versioning
**Type:** Metadata table
**Rows:** 1000s-100000s depending on org size
**Partitioning:** By organization_id

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| client_id | UUID | YES | - | FK to clients |
| related_type | TEXT | YES | - | transaction/invoice/client/etc |
| related_id | UUID | YES | - | ID of related entity |
| filename | TEXT | NO | - | Stored filename |
| original_filename | TEXT | NO | - | Original uploaded filename |
| file_size | BIGINT | NO | - | File size in bytes |
| mime_type | TEXT | NO | - | File MIME type |
| storage_path | TEXT | NO | - | Supabase Storage path (UNIQUE) |
| storage_bucket | TEXT | NO | 'documents' | Storage bucket name |
| document_type | TEXT | YES | - | receipt/invoice/contract/tax_form/etc |
| category | TEXT | YES | - | Document category |
| tags | TEXT[] | YES | - | Search tags array |
| ocr_text | TEXT | YES | - | Extracted OCR text |
| ocr_processed | BOOLEAN | NO | false | OCR completion flag |
| ocr_processed_at | TIMESTAMPTZ | YES | - | When OCR completed |
| is_confidential | BOOLEAN | NO | true | Confidentiality flag |
| encryption_key_id | TEXT | YES | - | Encryption key reference |
| version | INTEGER | NO | 1 | Version number |
| parent_document_id | UUID | YES | - | FK to parent version |
| status | TEXT | NO | 'active' | active/archived/deleted |
| metadata | JSONB | YES | {} | Flexible metadata |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |
| uploaded_by | UUID | YES | - | FK to uploading user |

**Indexes:**
- `idx_documents_organization_id`
- `idx_documents_client_id`
- `idx_documents_type`
- `idx_documents_created_at`
- `idx_documents_storage_path`
- `idx_documents_content_trgm` (GIN)

---

### 7. fhs_scores
**Purpose:** Financial Health Score history and trends
**Type:** Analytical table
**Rows:** 10s-1000s per organization
**Partitioning:** By created_at (quarterly)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| client_id | UUID | NO | - | FK to clients |
| score | NUMERIC(5,2) | NO | - | Overall score (0-100) |
| score_date | DATE | NO | - | Score date |
| components | JSONB | NO | Default | Score components breakdown |
| metrics | JSONB | NO | Default | Financial metrics used |
| calculation_method | TEXT | NO | 'standard_v1' | Calculation method version |
| calculation_period_start | DATE | NO | - | Period start date |
| calculation_period_end | DATE | NO | - | Period end date |
| previous_score | NUMERIC(5,2) | YES | - | Previous score for comparison |
| score_change | NUMERIC(5,2) | YES | - | Change from previous |
| score_trend | TEXT | YES | - | improving/stable/declining |
| insights | TEXT[] | YES | - | Generated insights array |
| recommendations | TEXT[] | YES | - | Recommendations array |
| alerts | TEXT[] | YES | - | Alerts array |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| calculated_by | UUID | YES | - | FK to calculating user |

**Components JSON:**
```json
{
  "cash_flow_health": 85.0,
  "profitability": 75.0,
  "debt_to_equity": 70.0,
  "working_capital": 80.0,
  "revenue_growth": 90.0
}
```

**Indexes:**
- `idx_fhs_scores_organization_id`
- `idx_fhs_scores_client_id`
- `idx_fhs_scores_score`
- `idx_fhs_scores_created_at`

---

### 8. integrations
**Purpose:** Third-party service connection management
**Type:** Configuration table
**Rows:** 10-100 per organization
**Partitioning:** Not needed

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| provider | TEXT | NO | - | Service provider (quickbooks/stripe/plaid/sendgrid) |
| provider_name | TEXT | NO | - | Human-readable provider name |
| status | TEXT | NO | 'pending' | pending/connected/disconnected/error |
| is_active | BOOLEAN | NO | true | Active/inactive flag |
| credentials | JSONB | YES | - | Encrypted API credentials |
| config | JSONB | YES | {} | Provider-specific configuration |
| scopes | TEXT[] | YES | - | OAuth scopes or permissions |
| connected_at | TIMESTAMPTZ | YES | - | Connection timestamp |
| last_sync_at | TIMESTAMPTZ | YES | - | Last sync timestamp |
| next_sync_at | TIMESTAMPTZ | YES | - | Scheduled next sync |
| sync_frequency | TEXT | NO | 'daily' | realtime/hourly/daily/weekly/manual |
| last_error | TEXT | YES | - | Last error message |
| last_error_at | TIMESTAMPTZ | YES | - | When last error occurred |
| error_count | INTEGER | NO | 0 | Error count |
| created_at | TIMESTAMPTZ | NO | NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update time |
| created_by | UUID | YES | - | FK to creator |

**UNIQUE CONSTRAINT:** organization_id + provider

---

### 9. sync_logs
**Purpose:** Integration synchronization history
**Type:** Audit/log table
**Rows:** 100s-1000s per integration
**Partitioning:** By organization_id + started_at

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| integration_id | UUID | NO | - | FK to integrations |
| sync_type | TEXT | NO | - | full/incremental/manual |
| status | TEXT | NO | - | started/in_progress/completed/failed/partial |
| started_at | TIMESTAMPTZ | NO | NOW() | Sync start time |
| completed_at | TIMESTAMPTZ | YES | - | Sync completion time |
| duration_seconds | INTEGER | GENERATED | - | Computed: duration in seconds |
| records_processed | INTEGER | NO | 0 | Records processed |
| records_created | INTEGER | NO | 0 | New records created |
| records_updated | INTEGER | NO | 0 | Records updated |
| records_failed | INTEGER | NO | 0 | Failed records |
| error_message | TEXT | YES | - | Error details |
| error_details | JSONB | YES | - | Full error JSON |
| metadata | JSONB | YES | {} | Flexible metadata |

---

### 10. audit_logs
**Purpose:** Comprehensive audit trail for compliance
**Type:** High-volume log table
**Rows:** 10000s-1000000s
**Partitioning:** By organization_id AND created_at (MONTHLY)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | YES | - | FK to user |
| organization_id | UUID | NO | - | FK to organizations |
| action | TEXT | NO | - | INSERT/UPDATE/DELETE/SELECT/LOGIN/etc |
| resource_type | TEXT | NO | - | Table name or resource type |
| resource_id | UUID | YES | - | ID of affected resource |
| resource_name | TEXT | YES | - | Human-readable resource name |
| old_values | JSONB | YES | - | Previous row values |
| new_values | JSONB | YES | - | New row values |
| changes | JSONB | YES | - | Computed diff |
| ip_address | INET | YES | - | Request IP |
| user_agent | TEXT | YES | - | Browser/client user agent |
| request_path | TEXT | YES | - | API path |
| request_method | TEXT | YES | - | HTTP method |
| status | TEXT | NO | 'success' | success/failure/partial |
| error_message | TEXT | YES | - | Error if failed |
| duration_ms | INTEGER | YES | - | Request duration |
| created_at | TIMESTAMPTZ | NO | NOW() | Log timestamp |
| compliance_category | TEXT | YES | - | soc2/pci/gdpr/etc |
| retention_required_until | DATE | YES | - | Legal hold date |
| metadata | JSONB | YES | {} | Additional metadata |

**Indexes:**
- `idx_audit_logs_organization_id`
- `idx_audit_logs_user_id`
- `idx_audit_logs_created_at DESC`
- `idx_audit_logs_resource` (composite)
- `idx_audit_logs_action`
- `idx_audit_logs_status` (partial)

---

### 11. compliance_logs
**Purpose:** Specialized compliance event logging
**Type:** Compliance log table
**Rows:** 100s-10000s per organization
**Partitioning:** By created_at (quarterly)

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| organization_id | UUID | NO | - | FK to organizations |
| event_type | TEXT | NO | - | data_access/export/deletion/permission_change/etc |
| event_category | TEXT | NO | - | security/privacy/audit/backup/incident |
| severity | TEXT | NO | 'info' | info/warning/error/critical |
| user_id | UUID | YES | - | FK to user performing action |
| affected_user_id | UUID | YES | - | FK to affected user |
| description | TEXT | NO | - | Event description |
| details | JSONB | YES | {} | Event details |
| compliance_framework | TEXT[] | YES | - | SOC2/GDPR/PCI/etc |
| control_id | TEXT | YES | - | Control identifier |
| evidence_urls | TEXT[] | YES | - | Supporting evidence |
| remediation_status | TEXT | YES | - | not_required/pending/in_progress/completed |
| resolved_at | TIMESTAMPTZ | YES | - | Resolution timestamp |
| created_at | TIMESTAMPTZ | NO | NOW() | Log timestamp |

---

### 12. sessions
**Purpose:** User session management
**Type:** Session table
**Rows:** 10-100 per user
**Partitioning:** By user_id

| Column | Type | Nullable | Default | Purpose |
|--------|------|----------|---------|---------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | - | FK to users |
| refresh_token_hash | TEXT | NO | - | Hashed refresh token |
| ip_address | VARCHAR(45) | YES | - | Session IP |
| user_agent | TEXT | YES | - | Browser/client info |
| expires_at | TIMESTAMPTZ | NO | - | Token expiration |
| created_at | TIMESTAMPTZ | NO | NOW() | Session creation |

**Indexes:**
- `idx_sessions_user_id`
- `idx_sessions_expires_at`

---

## Relationships

### Primary Foreign Key Relationships

```sql
-- Organization relationships
users → organizations (organization_id)
clients → organizations (organization_id)
transactions → organizations (organization_id)
invoices → organizations (organization_id)
documents → organizations (organization_id)
fhs_scores → organizations (organization_id)
integrations → organizations (organization_id)
audit_logs → organizations (organization_id)
compliance_logs → organizations (organization_id)

-- User relationships
users → organizations (organization_id)
clients → users (created_by, assigned_accountant_id)
transactions → users (created_by, reconciled_by)
invoices → users (created_by)
documents → users (uploaded_by)
fhs_scores → users (calculated_by)
sessions → users (user_id)
audit_logs → users (user_id)

-- Client relationships
transactions → clients (client_id)
invoices → clients (client_id)
documents → clients (client_id)
fhs_scores → clients (client_id)

-- Document relationships
documents → documents (parent_document_id) [self-referencing]

-- Integration relationships
sync_logs → integrations (integration_id)

-- Transaction relationships
documents → transactions (polymorphic)

-- Invoice relationships
documents → invoices (polymorphic)
```

---

## Constraints

### Unique Constraints
- `organizations.slug` (UNIQUE)
- `users.email` (UNIQUE, with deleted_at filter)
- `clients.organization_id + client_code` (UNIQUE)
- `invoices.organization_id + invoice_number` (UNIQUE)
- `documents.storage_path` (UNIQUE)
- `integrations.organization_id + provider` (UNIQUE)

### Check Constraints
- `organizations.subscription_tier IN ('starter', 'professional', 'enterprise')`
- `organizations.subscription_status IN ('active', 'trial', 'suspended', 'cancelled')`
- `organizations.contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'`
- `organizations.slug ~* '^[a-z0-9-]+$'`
- `users.role IN ('owner', 'admin', 'accountant', 'viewer')`
- `users.status IN ('active', 'inactive', 'suspended')`
- `users.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'`
- `users.failed_login_attempts >= 0`
- `clients.entity_type IN ('sole_proprietor', 'llc', 'corporation', 's_corp', 'partnership', 'non_profit')`
- `clients.status IN ('active', 'inactive', 'archived', 'prospect')`
- `clients.risk_level IN ('low', 'medium', 'high')`
- `clients.current_fhs_score >= 0 AND current_fhs_score <= 100`
- `transactions.transaction_type IN ('income', 'expense', 'transfer', 'adjustment')`
- `transactions.payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'ach', 'wire', 'other')`
- `transactions.status IN ('pending', 'posted', 'reconciled', 'void', 'disputed')`
- `transactions.amount != 0`
- `invoices.status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'cancelled')`
- `invoices.payment_terms IN ('due_on_receipt', 'net_15', 'net_30', 'net_60', 'net_90')`
- `invoices.due_date >= invoice_date`
- `invoices.period_end_date >= period_start_date`
- `documents.file_size > 0`
- `documents.version > 0`
- `documents.status IN ('active', 'archived', 'deleted')`
- `fhs_scores.score >= 0 AND score <= 100`
- `audit_logs.duration_ms >= 0`

---

## Trigger Functions

### 1. update_updated_at_column()
```sql
TRIGGER update_organizations_updated_at    ON organizations
TRIGGER update_users_updated_at            ON users
TRIGGER update_clients_updated_at          ON clients
TRIGGER update_transactions_updated_at     ON transactions
TRIGGER update_invoices_updated_at         ON invoices
TRIGGER update_documents_updated_at        ON documents
TRIGGER update_integrations_updated_at     ON integrations
```

**Function:** Automatically updates `updated_at` timestamp on row modification

---

### 2. audit_changes()
```sql
TRIGGER audit_clients_changes       ON clients      AFTER INSERT|UPDATE|DELETE
TRIGGER audit_transactions_changes  ON transactions AFTER INSERT|UPDATE|DELETE
TRIGGER audit_invoices_changes      ON invoices     AFTER INSERT|UPDATE|DELETE
TRIGGER audit_users_changes         ON users        AFTER INSERT|UPDATE|DELETE
TRIGGER audit_documents_changes     ON documents    AFTER INSERT|UPDATE|DELETE
```

**Function:** Automatically records changes in `audit_logs` table

**Captured:** old values, new values, computed diff, user, IP, timestamp

---

## Query Examples

### 1. Get all clients for an organization
```sql
SELECT * FROM clients
WHERE organization_id = $1
AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 2. Get overdue invoices
```sql
SELECT i.*
FROM invoices i
JOIN clients c ON i.client_id = c.id
WHERE i.organization_id = $1
AND i.status = 'overdue'
AND i.due_date < CURRENT_DATE
AND i.deleted_at IS NULL
ORDER BY i.due_date ASC;
```

### 3. Get transaction summary by category
```sql
SELECT
  category,
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total,
  AVG(amount) as average
FROM transactions
WHERE organization_id = $1
AND client_id = $2
AND transaction_date BETWEEN $3 AND $4
AND deleted_at IS NULL
GROUP BY category, transaction_type
ORDER BY total DESC;
```

### 4. Get recent audit changes for a client
```sql
SELECT *
FROM audit_logs
WHERE organization_id = $1
AND resource_type = 'clients'
AND resource_id = $2
AND action IN ('INSERT', 'UPDATE', 'DELETE')
AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

### 5. Get users by role in organization
```sql
SELECT * FROM users
WHERE organization_id = $1
AND role = $2
AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### 6. Get FHS score trend for client
```sql
SELECT
  score_date,
  score,
  previous_score,
  score_change,
  score_trend
FROM fhs_scores
WHERE client_id = $1
AND organization_id = $2
ORDER BY score_date DESC
LIMIT 12; -- Last 12 scores (e.g., 12 months)
```

### 7. Get integration sync status
```sql
SELECT
  i.provider,
  i.status,
  i.last_sync_at,
  i.next_sync_at,
  sl.status as last_sync_status,
  sl.records_processed,
  sl.error_message
FROM integrations i
LEFT JOIN sync_logs sl ON i.id = sl.integration_id
WHERE i.organization_id = $1
AND i.is_active = TRUE
ORDER BY i.provider;
```

### 8. Get login activity for audit
```sql
SELECT
  u.email,
  u.first_name,
  u.last_name,
  u.last_login_at,
  u.last_login_ip,
  u.failed_login_attempts
FROM users u
WHERE u.organization_id = $1
AND u.deleted_at IS NULL
ORDER BY u.last_login_at DESC;
```

### 9. Get high-risk clients
```sql
SELECT
  name,
  risk_level,
  current_fhs_score,
  status,
  assigned_accountant_id
FROM clients
WHERE organization_id = $1
AND risk_level IN ('medium', 'high')
AND deleted_at IS NULL
ORDER BY risk_level DESC, current_fhs_score ASC;
```

### 10. Get invoice payment status summary
```sql
SELECT
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_amount,
  SUM(amount_due) as total_due,
  SUM(amount_paid) as total_paid
FROM invoices
WHERE organization_id = $1
AND deleted_at IS NULL
GROUP BY status
ORDER BY total_amount DESC;
```

---

## Performance Tuning Notes

### Query Optimization Tips
1. Always filter by `organization_id` first (used in RLS)
2. Always include `deleted_at IS NULL` for soft deletes
3. Use indexes for common WHERE clauses
4. Avoid full table scans on high-volume tables (transactions, documents, audit_logs)
5. Use `LIMIT` when fetching lists
6. Consider partitioning for very large tables

### Index Selection
- Date range queries: Use date indexes
- Status filtering: Use partial indexes (WHERE status = ...)
- Multi-column filtering: Use composite indexes
- Text search: Use GIN indexes with pg_trgm
- Lookups: Use unique indexes

### Monitoring
- Track slow query logs (log_min_duration_statement = 1000ms)
- Monitor table sizes (transaction, document, audit_logs)
- Check index usage (pg_stat_user_indexes)
- Monitor cache hit ratio (should be > 99%)

---

End of Schema Reference
