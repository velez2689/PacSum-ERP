# 🚀 PHASE 2 EXECUTION GUIDE - DEVIN CODEX LEADS

**Phase:** Development & Implementation (Weeks 3-6)
**Lead Agent:** Devin Codex
**Support:** Dana, Serena, Isaac, Quincy, Uma, Felix, Ian

---

## 📋 Configuration Files Created ✅

The following configuration files are now in place:

✅ **package.json** - All 30+ dependencies defined
✅ **tsconfig.json** - Strict TypeScript configuration
✅ **next.config.js** - Security headers, optimization
✅ **jest.config.js** - Test framework with 70% coverage threshold
✅ **tailwind.config.js** - Styling framework
✅ **.eslintrc.json** - Code quality standards
✅ **.prettierrc** - Code formatting
✅ **.env.example** - Environment variables template

---

## 🎯 NEXT IMMEDIATE STEPS

### Step 1: Create Directory Structure

```bash
cd C:\Users\velez\Projects\pacsum-erp

# Create all necessary directories
mkdir -p src/{app,components,lib,hooks,types,utils,styles}
mkdir -p src/components/{ui,layout,forms,dashboard,common}
mkdir -p src/app/api/auth src/app/api/clients src/app/api/transactions
mkdir -p src/app/{dashboard,clients,documents,settings}
mkdir -p database/{migrations,seeds,policies}
mkdir -p public/{images,icons}
mkdir -p tests/{unit,integration,e2e}
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Set Up Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# (Supabase keys, Stripe keys, etc.)
```

---

## 📁 COMPLETE DIRECTORY STRUCTURE TO CREATE

```
pacsum-erp/
│
├── src/
│   ├── app/                           ← Next.js App Router
│   │   ├── layout.tsx                 ← Root layout
│   │   ├── page.tsx                   ← Home page
│   │   ├── error.tsx                  ← Error boundary
│   │   │
│   │   ├── auth/                      ← Authentication pages
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── verify/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── dashboard/                 ← Main application
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               ← Dashboard home
│   │   │   ├── [orgId]/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── clients/
│   │   │   │   ├── transactions/
│   │   │   │   ├── documents/
│   │   │   │   ├── reporting/
│   │   │   │   └── settings/
│   │   │   └── error.tsx
│   │   │
│   │   ├── api/                       ← API Routes
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── signup/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── refresh/route.ts
│   │   │   │
│   │   │   ├── organizations/
│   │   │   │   ├── route.ts           ← CRUD operations
│   │   │   │   └── [id]/route.ts
│   │   │   │
│   │   │   ├── clients/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── upload/route.ts
│   │   │   │
│   │   │   ├── fhs/
│   │   │   │   └── calculate/route.ts
│   │   │   │
│   │   │   └── integrations/
│   │   │       ├── quickbooks/route.ts
│   │   │       └── stripe/route.ts
│   │   │
│   │   └── globals.css               ← Global styles
│   │
│   ├── components/
│   │   ├── ui/                        ← Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   └── DocumentUploadForm.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── Overview.tsx
│   │   │   ├── FHSCard.tsx
│   │   │   ├── ClientsList.tsx
│   │   │   ├── RecentTransactions.tsx
│   │   │   └── Charts.tsx
│   │   │
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ProtectedRoute.tsx
│   │       └── NotFound.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              ← Supabase client setup
│   │   │   ├── auth.ts                ← Authentication logic
│   │   │   ├── organizations.ts       ← Org CRUD
│   │   │   ├── clients.ts             ← Client CRUD
│   │   │   ├── transactions.ts        ← Transaction CRUD
│   │   │   └── documents.ts           ← Document operations
│   │   │
│   │   ├── integrations/
│   │   │   ├── stripe.ts              ← Stripe API wrapper
│   │   │   ├── quickbooks.ts          ← QB API wrapper
│   │   │   └── sendgrid.ts            ← Email wrapper
│   │   │
│   │   ├── calculations/
│   │   │   └── fhs.ts                 ← FHS algorithm
│   │   │
│   │   ├── api-client.ts              ← HTTP client
│   │   ├── auth-context.ts            ← Auth state
│   │   └── utils.ts                   ← Utility functions
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 ← Authentication hook
│   │   ├── useOrganization.ts         ← Org context hook
│   │   ├── useClients.ts              ← Clients query hook
│   │   ├── useTransactions.ts         ← Transactions query hook
│   │   └── useFHS.ts                  ← FHS calculation hook
│   │
│   ├── types/
│   │   ├── index.ts                   ← All type exports
│   │   ├── auth.ts                    ← Auth types
│   │   ├── organizations.ts           ← Org types
│   │   ├── clients.ts                 ← Client types
│   │   ├── transactions.ts            ← Transaction types
│   │   ├── documents.ts               ← Document types
│   │   └── fhs.ts                     ← FHS types
│   │
│   ├── utils/
│   │   ├── validation.ts              ← Zod schemas
│   │   ├── formatting.ts              ← Format helpers
│   │   ├── date-utils.ts              ← Date helpers
│   │   └── error-handler.ts           ← Error handling
│   │
│   └── styles/
│       ├── globals.css
│       ├── variables.css              ← CSS variables
│       └── animations.css
│
├── database/
│   ├── migrations/
│   │   ├── 001_init.sql              ← Initial schema
│   │   ├── 002_rls_policies.sql       ← RLS policies
│   │   ├── 003_audit_tables.sql       ← Audit logging
│   │   └── 004_indexes.sql            ← Performance indexes
│   │
│   ├── seeds/
│   │   └── dev-data.sql               ← Development data
│   │
│   └── policies/
│       ├── organizations.sql          ← Org RLS
│       ├── clients.sql                ← Client RLS
│       ├── transactions.sql           ← Transaction RLS
│       ├── users.sql                  ← User RLS
│       └── audit_logs.sql             ← Audit RLS
│
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── fhs.test.ts
│   │   ├── validation.test.ts
│   │   └── formatters.test.ts
│   │
│   ├── integration/
│   │   ├── api.test.ts
│   │   ├── auth-flow.test.ts
│   │   ├── client-crud.test.ts
│   │   └── transactions.test.ts
│   │
│   └── e2e/
│       ├── auth.e2e.ts
│       ├── client-management.e2e.ts
│       └── dashboard.e2e.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── docs/
│   ├── API.md                        ← API documentation
│   ├── DATABASE.md                   ← Database schema
│   ├── SECURITY.md                   ← Security architecture
│   ├── INTEGRATIONS.md               ← Integration guides
│   └── DEPLOYMENT.md                 ← Deployment guide
│
└── .supabase/
    ├── config.toml                   ← Supabase config
    └── migrations/                   ← Local migrations
```

---

## 🎬 WEEK 1 EXECUTION PLAN

### Day 1-2: Devin Creates Foundation

1. **Create directory structure** (above)
2. **Install dependencies**: `npm install`
3. **Create basic layout components** (Navbar, Sidebar, MainLayout)
4. **Create authentication pages** (Login, Signup, Verify)
5. **Create dashboard layout** with tab navigation
6. **Commit**: "feat: Create Next.js project structure and layout foundation"

### Day 3-4: Dana Creates Database

1. **Create database migration files** (001-004)
2. **Design organizations table** with multi-tenant setup
3. **Design clients table** with organization FK
4. **Design transactions table** with categorization
5. **Design users/roles table** for RBAC
6. **Commit**: "feat: Create database schema and migrations"

### Day 5-6: Serena Implements Auth

1. **Create auth API routes** (login, signup, logout, refresh)
2. **Implement JWT token generation**
3. **Create authentication context/hook**
4. **Implement MFA setup**
5. **Create protected route component**
6. **Commit**: "feat: Implement authentication system with JWT + MFA"

### Day 7: Integration & Testing

1. **Wire auth to API routes**
2. **Test login/signup flow**
3. **Set up basic Supabase integration**
4. **Verify RLS policies working**
5. **Commit**: "feat: Integrate auth with database and RLS"

---

## 🚀 TO CONTINUE PHASE 2

After creating the directory structure and installing dependencies:

1. **Run development server**:
   ```bash
   npm run dev
   ```

2. **Invoke Devin Codex for next component**:
   ```bash
   claude-code "As Devin Codex, generate the complete authentication system including login page, signup page, and auth context" \
     --file agents/profiles/development/06_devin_codex.md
   ```

3. **Invoke Dana for database**:
   ```bash
   claude-code "As Dana Querymaster, design the complete database schema for PACSUM ERP with RLS policies" \
     --file agents/profiles/development/07_dana_querymaster.md
   ```

4. **Invoke Serena for security**:
   ```bash
   claude-code "As Serena Shield, implement the authentication middleware and security controls" \
     --file agents/profiles/development/09_serena_shield.md
   ```

---

## ✅ SUCCESS CRITERIA FOR WEEK 1

- [ ] Directory structure created
- [ ] Dependencies installed
- [ ] Basic layout components working
- [ ] Auth pages created (login, signup)
- [ ] Database migrations ready
- [ ] Authentication system implemented
- [ ] Protected routes working
- [ ] All TypeScript compiles without errors
- [ ] Git commit made

---

## 📊 METRICS TRACKING

Track these as you develop:
- **TypeScript Errors**: Target = 0
- **ESLint Warnings**: Target = 0
- **Test Coverage**: Target = >90%
- **Build Time**: Target = <30s
- **Bundle Size**: Target = <300KB (initial)

---

## 🔗 AGENT COLLABORATION

**Use these commands to invoke agents**:

```bash
# Get architecture decisions
claude-code "As Alex Structure, confirm the Week 1 foundation approach aligns with architecture"

# Database design
claude-code "As Dana Querymaster, review the database schema and suggest optimizations"

# Security review
claude-code "As Serena Shield, review the authentication implementation for security issues"

# Quality check
claude-code "As Dr. Athena Criticus, review the code quality and identify critical issues"
```

---

## 📝 DOCUMENTATION TO CREATE ALONGSIDE CODE

As you build, create documentation:

1. **docs/API.md** - API endpoint documentation
2. **docs/DATABASE.md** - Database schema diagram
3. **docs/SETUP.md** - Local development setup
4. **docs/SECURITY.md** - Security implementation details

---

## 🎯 REMEMBER

- **Commit frequently** - Small, logical commits
- **Write tests** - At least unit tests for core logic
- **Check TypeScript** - Run `npm run type-check` regularly
- **Ask agents** - Invoke agents when stuck
- **Quality first** - Dr. Athena will review everything

---

**You're ready to start! Next step: Create the directory structure and install dependencies.**

```bash
cd C:\Users\velez\Projects\pacsum-erp
npm install
# Then follow the Day 1-2 plan above
```

Let me know when you're ready to invoke the development agents to generate specific components!
