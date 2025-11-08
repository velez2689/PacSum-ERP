# 🚀 PACSUM ERP - RAPID BUILD SPRINT

**Strategy:** Build non-stop until MVP is complete (skip week-by-week planning)
**Team Lead:** GOD MODE v4.1 (me)
**Development Lead:** Devin Codex
**Target:** Working MVP with all core features

---

## 🎯 BUILD SEQUENCE (Do This Now)

### Step 1: Install Dependencies
```bash
cd C:\Users\velez\Projects\pacsum-erp
npm install
```

This installs all 30+ packages needed for development.

### Step 2: Create Directory Structure
```bash
# Create all src directories
mkdir -p src/{app,components,lib,hooks,types,utils,styles}
mkdir -p src/components/{ui,layout,forms,dashboard}
mkdir -p src/app/{api,auth,dashboard}
mkdir -p src/app/api/{auth,clients,transactions,fhs,integrations}

# Create database directories
mkdir -p database/{migrations,seeds,policies}

# Create test directories
mkdir -p tests/{unit,integration,e2e}

# Create public directory
mkdir -p public/{images,icons}
```

### Step 3: Create Environment File
```bash
cp .env.example .env.local
# Edit .env.local with your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - STRIPE_PUBLIC_KEY
# - Etc.
```

---

## 📝 BUILD PLAN (In Parallel)

### PARALLEL TRACK 1: Frontend Components (Devin Codex)
Generate EVERYTHING at once:
```bash
claude-code "As Devin Codex, generate the COMPLETE Next.js application including:

1. Root Layout (with Tailwind + global styles + provider setup)
2. Authentication Pages:
   - Login page with form validation
   - Signup page with form validation
   - Password reset page
   - Email verification page
3. Dashboard Layout with navigation
4. Dashboard Pages:
   - Overview/home page with stats
   - Clients list page
   - Transactions page
   - Documents page
   - Settings page
5. Reusable Components:
   - All Shadcn/ui components (button, card, input, form, table, dialog, tabs)
   - Layout components (Navbar, Sidebar, Footer)
   - Form components (LoginForm, SignupForm, ClientForm, TransactionForm)
   - Dashboard components (Overview, ClientsList, TransactionsList, FHSCard)
6. Auth Context and useAuth hook
7. Protected Route component
8. Global CSS with Tailwind

All code must:
- Use TypeScript strict mode
- Have proper type definitions
- Include error handling
- Be production-ready
- Follow the architecture from Alex Structure
- Support the database schema from Dana

Generate ALL files in src/app and src/components directories." \
  --file agents/profiles/development/06_devin_codex.md
```

---

### PARALLEL TRACK 2: Database (Dana Querymaster)
```bash
claude-code "As Dana Querymaster, generate the COMPLETE database setup including:

1. SQL Migration Files (4 files):
   - 001_init.sql (organizations, users, clients, transactions, documents, fhs_scores tables)
   - 002_rls_policies.sql (all Row Level Security policies)
   - 003_audit_tables.sql (audit_logs table)
   - 004_indexes.sql (all performance indexes)

2. Table Designs:
   - organizations (id, name, created_at, updated_at)
   - users (id, email, organization_id, role, created_at)
   - clients (id, org_id, name, email, phone, industry, status, created_at, updated_at)
   - transactions (id, client_id, amount, date, category, description, created_at)
   - documents (id, client_id, filename, type, url, uploaded_at)
   - invoices (id, client_id, amount, status, created_at)
   - fhs_scores (id, client_id, score, components, calculated_at)
   - audit_logs (id, user_id, action, resource_type, resource_id, changes, created_at)

3. RLS Policies for:
   - Organizations (users only see their org)
   - Users (only see org users)
   - Clients (only see org clients)
   - Transactions (only see org transactions)
   - Audit logs (only admins)

4. Indexes for Performance:
   - clients.organization_id
   - transactions.client_id
   - transactions.date
   - fhs_scores.client_id
   - audit_logs.user_id
   - audit_logs.created_at

All SQL must be production-ready and Supabase-compatible." \
  --file agents/profiles/development/07_dana_querymaster.md
```

---

### PARALLEL TRACK 3: Authentication & Security (Serena Shield)
```bash
claude-code "As Serena Shield, generate the COMPLETE authentication system including:

1. Authentication API Routes:
   - POST /api/auth/signup (register new user)
   - POST /api/auth/login (login with email/password)
   - POST /api/auth/logout (logout)
   - POST /api/auth/refresh (refresh JWT token)
   - POST /api/auth/mfa (setup 2FA)
   - POST /api/auth/verify-mfa (verify MFA code)
   - POST /api/auth/reset-password (password reset)

2. Security Implementations:
   - JWT token generation and validation
   - Password hashing (bcrypt)
   - MFA/2FA setup
   - Session management
   - Rate limiting
   - CORS configuration
   - Security headers (CSP, X-Frame-Options, etc.)
   - Input validation and sanitization

3. Middleware:
   - Authentication middleware
   - Authorization middleware
   - Rate limiting middleware
   - Logging middleware

4. Utilities:
   - Password validation
   - Email validation
   - Token utilities
   - Error handling

All code must follow security best practices and be production-ready." \
  --file agents/profiles/development/09_serena_shield.md
```

---

### PARALLEL TRACK 4: API Routes & Business Logic (Devin)
```bash
claude-code "As Devin Codex, generate ALL API routes:

1. Organization Routes:
   - GET /api/organizations (list user's orgs)
   - POST /api/organizations (create org)
   - PATCH /api/organizations/[id] (update org)

2. Client Routes:
   - GET /api/clients (list clients)
   - POST /api/clients (create client)
   - GET /api/clients/[id] (get client details)
   - PATCH /api/clients/[id] (update client)
   - DELETE /api/clients/[id] (delete client)

3. Transaction Routes:
   - GET /api/transactions (list transactions)
   - POST /api/transactions (create transaction)
   - GET /api/transactions/[id]
   - PATCH /api/transactions/[id]
   - DELETE /api/transactions/[id]

4. Document Routes:
   - GET /api/documents (list documents)
   - POST /api/documents (upload)
   - GET /api/documents/[id]
   - DELETE /api/documents/[id]

5. FHS Routes:
   - POST /api/fhs/calculate (calculate FHS)
   - GET /api/fhs/[clientId] (get FHS history)

All routes must:
- Validate user authorization
- Return proper status codes
- Handle errors gracefully
- Be RESTful
- Have proper TypeScript types
- Include error responses" \
  --file agents/profiles/development/06_devin_codex.md
```

---

### PARALLEL TRACK 5: FHS Algorithm (Felix Auditor + Devin)
```bash
claude-code "As Felix Auditor, generate the Financial Health Score algorithm:

The FHS should evaluate:
1. Revenue Trend (30%) - is revenue growing or declining?
2. Profit Margin (25%) - what % of revenue is profit?
3. Cash Flow (20%) - do they have positive cash flow?
4. Debt Ratio (15%) - how much debt vs assets?
5. Expense Management (10%) - are expenses controlled?

Score Range: 0-100
- 80-100: Excellent financial health
- 60-79: Good financial health
- 40-59: Fair financial health
- 20-39: Poor financial health
- 0-19: Critical financial health

Must include:
- Clear calculation methodology
- Edge case handling
- Validation of inputs
- TypeScript types
- Unit tests
- Example calculations" \
  --file agents/profiles/qa/13_felix_auditor.md
```

---

### PARALLEL TRACK 6: Tests (Quincy Validator)
```bash
claude-code "As Quincy Validator, generate comprehensive tests for:

1. Unit Tests:
   - Authentication functions
   - FHS calculation
   - Input validation
   - Utility functions

2. Integration Tests:
   - Login flow
   - Create client flow
   - Create transaction flow
   - FHS calculation flow

3. API Tests:
   - All API endpoints
   - Error responses
   - Authorization checks

Must have:
- >90% code coverage
- All tests passing
- Jest configuration
- Test utilities and mocks
- Clear test names
- Proper assertions" \
  --file agents/profiles/qa/11_quincy_validator.md
```

---

### PARALLEL TRACK 7: Integrations (Isaac Connector)
```bash
claude-code "As Isaac Connector, generate integration wrappers for:

1. Stripe Integration:
   - Create payment intent
   - Confirm payment
   - List payments
   - Refund payment
   - Webhook handler
   - Error handling

2. QuickBooks Integration:
   - OAuth flow
   - Sync transactions
   - Sync customers
   - Webhook handler
   - Error handling

3. SendGrid Integration:
   - Send verification email
   - Send reset password email
   - Send notifications

All must be:
- Fully typed
- Error handled
- Production ready
- With proper logging" \
  --file agents/profiles/development/10_isaac_connector.md
```

---

## 📦 COMMAND TO RUN NOW

After creating directories and .env.local:

```bash
# Start development server
npm run dev
```

This starts the dev server on http://localhost:3000

---

## 🎯 BUILDING CHECKLIST

Track progress:
- [ ] npm install complete
- [ ] Directories created
- [ ] .env.local configured
- [ ] Devin generates frontend (components + pages)
- [ ] Dana generates database (migrations + RLS)
- [ ] Serena generates auth system
- [ ] Devin generates API routes
- [ ] Felix generates FHS algorithm
- [ ] Quincy generates tests
- [ ] Isaac generates integrations
- [ ] npm run dev works
- [ ] Routes accessible
- [ ] Database connected
- [ ] Tests passing
- [ ] Ready for GitHub

---

## 🚀 BUILD MODE ACTIVATED

**No more week-by-week planning.**

**Just:**
1. Generate code
2. Integrate
3. Test
4. Commit
5. Repeat until done

All agents are standing by. Ready to invoke them?

---

## 📞 NEXT COMMAND

Tell me: **"START BUILDING"** and I'll invoke all agents in parallel to generate the complete MVP.

Or run:
```bash
npm install
# Then tell me when ready
```
