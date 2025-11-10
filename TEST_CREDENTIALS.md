# PACSUM ERP - Test Credentials & Setup

## Local Development Setup

Since the app uses **local Supabase** in development mode, you need to create test accounts through the sign-up flow.

### Quick Start Testing

#### Option 1: Create a Test Account (Recommended)
1. Open http://localhost:3000
2. Click **"Sign Up"**
3. Enter test credentials:
   - **Email:** `test@example.com`
   - **Password:** `TestPassword123!`
   - **First Name:** Test User
   - **Last Name:** Account
4. Click **Sign Up**
5. You'll be prompted to verify email (in dev mode, skip or use mock verification)
6. Login with those credentials

#### Option 2: Use Pre-configured Test Account
If you have Supabase running locally, here are test accounts:

```
Email:    admin@pacsum.local
Password: AdminPassword123!

Email:    user@pacsum.local
Password: UserPassword456!

Email:    test@example.com
Password: TestPassword123!
```

### Password Requirements
- **Minimum 8 characters**
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

### Example Valid Passwords
- `TestPassword123!`
- `SecurePass@2024`
- `MyP@ssw0rd!`
- `Demo#Test123`

### Testing the App

#### 1. Authentication Flow
- ✅ Sign up with new account
- ✅ Verify email (in dev, click verification link or skip)
- ✅ Login with email/password
- ✅ View "Me" page showing your profile
- ✅ Logout

#### 2. Dashboard Features
- Navigate to `/dashboard`
- View Organization Overview
- Create a new Client:
  - Name: "Test Client"
  - Email: "client@test.com"
  - Status: Active
- Add a Transaction:
  - Type: Income
  - Amount: 1000
  - Category: Sales
- View Financial Health Score

#### 3. Test Different Scenarios
- **Try wrong password:** Login with wrong credentials (should fail)
- **Try nonexistent email:** (should show error)
- **Create multiple clients:** Test CRUD operations
- **Add multiple transactions:** Test calculations

### API Testing with curl

```bash
# 1. Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!",
    "firstName":"Test",
    "lastName":"User"
  }'

# 2. Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPassword123!"
  }'

# 3. Use token to access protected route
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Database Notes (Local Development)

- **Database:** PostgreSQL (via Supabase)
- **Connection:** `postgresql://postgres:postgres@localhost:5432/pacsum_erp_dev`
- **Data persists:** Between server restarts
- **Email verification:** In dev mode, emails are not actually sent

### Troubleshooting

#### "Email already in use"
- Use a different email address
- Or reset the local database

#### "Invalid password"
- Check it meets requirements (8+ chars, upper, lower, number, special char)
- See examples above

#### "Email verification failed"
- In development mode, check the server logs
- Click the verification link in the signup flow
- Or use the skip option if available

#### Can't access dashboard after login
- Make sure you're logged in (token should be in localStorage)
- Try refreshing the page
- Check browser console for errors (F12)

### Development Mode Features

- ✅ Hot reload on file changes
- ✅ Fast refresh for React components
- ✅ No email actually sent (mock service)
- ✅ All data stored in local PostgreSQL
- ✅ Mock third-party services (Stripe, SendGrid, QuickBooks)

### Moving to Production

Update `.env.local` with real credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_real_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_real_service_key
SENDGRID_API_KEY=real_sendgrid_key
STRIPE_SECRET_KEY=real_stripe_key
```

---

**Ready to test? Start with "Option 1: Create a Test Account" above!**
