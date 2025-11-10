# PACSUM ERP - Quick Start Testing Guide

## Local Development Setup

### 1. Install Dependencies (if needed)
```bash
npm install
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm test -- --watch

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- auth.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="login"
```

### 3. Type Checking
```bash
# Check TypeScript compilation
npm run type-check
```

### 4. Linting
```bash
# Check ESLint issues
npm run lint

# Fix ESLint issues automatically
npm run lint -- --fix
```

### 5. Build for Production
```bash
# Build Next.js application
npm run build

# If build succeeds, you'll see:
# ✓ Compiled successfully
```

### 6. Start Development Server
```bash
# Run in development mode
npm run dev

# Server will start at http://localhost:3000
```

## Testing Scenarios

### Scenario 1: Authentication Testing
**What to test:**
- Sign up with new email
- Login with valid credentials
- Try invalid password (should fail)
- Check email verification flow
- Test password reset
- Enable MFA and test 2FA flow

**Files involved:**
- src/app/api/auth/ - API routes
- src/app/auth/ - UI components

### Scenario 2: Dashboard Functionality
**What to test:**
- Navigate to /dashboard
- View organization overview
- Create new client
- Add transactions
- Check financial health score (FHS)
- Generate reports

**Files involved:**
- src/app/dashboard/ - Dashboard pages
- src/components/dashboard/ - Dashboard components

### Scenario 3: API Integration
**What to test:**
- Login endpoint returns token
- Protected routes require token
- RLS policies prevent data leakage
- Rate limiting works
- Error handling is consistent

**Test with curl:**
```bash
# Get login token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'

# Use token to access protected route
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Available npm Scripts

```bash
npm run dev          # Start development server
npm run build        # Build production bundle
npm run start        # Run production server
npm test             # Run test suite
npm run type-check   # TypeScript type checking
npm run lint         # ESLint validation
npm run lint:fix     # Auto-fix ESLint issues
```

## Environment Variables

Create `.env.local` for local development:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_secret_min_32_chars
SENDGRID_API_KEY=your_sendgrid_key
STRIPE_PUBLIC_KEY=your_stripe_public
STRIPE_SECRET_KEY=your_stripe_secret
```

## Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Tests timing out
```bash
# Increase timeout in jest.config.js
npm test -- --testTimeout=10000
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build fails with TypeScript errors
```bash
# Check for type errors
npm run type-check

# Full rebuild
rm -rf .next
npm run build
```

## Key Files to Review

- **TESTING_GUIDE.md** - Comprehensive testing documentation
- **PROJECT_PLAN.md** - Project overview and architecture
- **DEPLOYMENT_GUIDE.md** - Database setup and deployment
- **src/types/index.ts** - Type definitions
- **src/app/api/** - API routes
- **src/components/** - React components

## Performance Testing

Check Lighthouse score:
```bash
# Build first
npm run build

# Start production server
npm run start

# Then run Lighthouse audit (requires lighthouse-cli)
lighthouse http://localhost:3000
```

## Next Steps

1. Start dev server: `npm run dev`
2. Open browser: http://localhost:3000
3. Try signing up with a test email
4. Test the authentication flow
5. Explore dashboard features
6. Review test files in `tests/` directory

Happy testing!
