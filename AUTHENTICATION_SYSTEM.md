# PACSUM ERP Authentication System

Complete, production-ready authentication system with JWT tokens, MFA, security middleware, and comprehensive error handling.

## Features

### Core Authentication
- Email/password login with bcrypt hashing
- JWT-based access and refresh tokens
- Token rotation and automatic refresh
- Session management with concurrent session limits
- Secure cookie handling (httpOnly, secure, sameSite)

### Multi-Factor Authentication (MFA)
- TOTP-based 2FA (compatible with Google Authenticator, Authy, etc.)
- QR code generation for easy setup
- Recovery codes for backup access
- Automatic MFA enforcement for high-privilege accounts

### Security Features
- Rate limiting to prevent brute force attacks
- Password strength validation
- Account lockout after failed attempts
- CORS protection
- CSRF token validation
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- SQL injection prevention (prepared statements)
- XSS protection
- Audit logging of all auth events

### User Management
- Email verification flow
- Password reset flow
- User profile management
- Role-based access control (ADMIN, ACCOUNTANT, USER)
- Organization-based access control

### Email Notifications
- SendGrid integration
- Welcome emails
- Email verification
- Password reset emails
- MFA enabled notifications
- Password change alerts
- Beautiful HTML email templates

## File Structure

```
src/
├── app/api/auth/
│   ├── login/route.ts              # Email/password login
│   ├── signup/route.ts             # User registration
│   ├── logout/route.ts             # Session termination
│   ├── refresh/route.ts            # Token refresh
│   ├── verify-email/route.ts       # Email verification
│   ├── send-reset-email/route.ts   # Password reset request
│   ├── reset-password/route.ts     # Password reset completion
│   ├── me/route.ts                 # Get current user
│   └── mfa/
│       ├── setup/route.ts          # MFA setup
│       └── verify/route.ts         # MFA verification
│
├── lib/
│   ├── auth/
│   │   ├── token-manager.ts        # JWT generation/validation
│   │   ├── password-utils.ts       # Password hashing/validation
│   │   ├── mfa-utils.ts            # TOTP/2FA handling
│   │   ├── session-manager.ts      # Session management
│   │   └── validators.ts           # Input validation (Zod)
│   │
│   ├── config/
│   │   ├── jwt.ts                  # JWT configuration
│   │   ├── mfa.ts                  # MFA configuration
│   │   └── security.ts             # Security settings
│   │
│   ├── email/
│   │   ├── email-service.ts        # SendGrid integration
│   │   └── templates.ts            # Email templates
│   │
│   ├── errors/
│   │   ├── auth-errors.ts          # Custom error classes
│   │   └── error-handler.ts        # Centralized error handling
│   │
│   └── middleware/
│       ├── auth.ts                 # Authentication middleware
│       ├── authorization.ts        # Role-based access control
│       ├── rate-limiter.ts         # Request rate limiting
│       └── security-headers.ts     # CORS, CSP, security headers
│
├── middleware.ts                    # Next.js middleware (route protection)
└── utils/error-responses.ts         # Standardized API responses
```

## Installation

1. **Install dependencies:**
```bash
npm install
```

New dependencies added:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token generation/validation
- `speakeasy` - TOTP/2FA
- `qrcode` - QR code generation for MFA
- `@sendgrid/mail` - Email service
- `uuid` - Unique ID generation

2. **Set up environment variables:**
Copy `.env.example` to `.env.local` and fill in your values:

```env
# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EMAIL_VERIFICATION_SECRET=your-email-verification-secret
JWT_PASSWORD_RESET_SECRET=your-password-reset-secret

# SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=PACSUM ERP

# Security
ALLOWED_ORIGINS=http://localhost:3000
COOKIE_DOMAIN=localhost
```

3. **Database tables required:**
The system expects these Supabase tables:
- `users` - User accounts
- `sessions` - Active sessions
- `audit_logs` - Security audit trail
- `rate_limits` - Rate limiting data
- `mfa_setups` - Temporary MFA setup data
- `mfa_sessions` - Temporary MFA verification sessions

## API Routes

### Authentication

#### POST /api/auth/signup
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "Acme Corp",
  "acceptTerms": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADMIN",
      "emailVerified": false
    },
    "message": "Account created successfully. Please check your email to verify your account."
  }
}
```

#### POST /api/auth/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresAt": "2025-11-07T12:00:00.000Z"
  }
}
```

**MFA Response (if enabled):**
```json
{
  "success": false,
  "error": {
    "message": "MFA verification required",
    "code": "MFA_REQUIRED",
    "statusCode": 403,
    "details": {
      "mfaToken": "..."
    }
  }
}
```

#### POST /api/auth/logout
Invalidate current session.

#### POST /api/auth/refresh
Refresh access token using refresh token.

#### POST /api/auth/verify-email
Verify email address.

**Request:**
```json
{
  "token": "verification-token-from-email"
}
```

#### POST /api/auth/send-reset-email
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/auth/reset-password
Reset password using token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

#### GET /api/auth/me
Get current authenticated user.

### Multi-Factor Authentication

#### POST /api/auth/mfa/setup
Generate MFA secret and QR code.

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "recoveryCodes": [
      "ABCD-EFGH",
      "IJKL-MNOP",
      ...
    ]
  }
}
```

#### POST /api/auth/mfa/verify
Verify MFA code (enable MFA or verify during login).

**Request:**
```json
{
  "code": "123456",
  "recoveryCode": false
}
```

## Middleware Usage

### Protect API Routes

```typescript
import { requireAuth } from '@/lib/middleware/auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    // user is authenticated
    return Response.json({ userId: user.id });
  });
}
```

### Require Specific Role

```typescript
import { requireAuth } from '@/lib/middleware/auth';
import { requireAdmin } from '@/lib/middleware/authorization';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req, user) => {
    return requireAdmin(req, user, async (req, user) => {
      // user is authenticated and is an admin
      return Response.json({ success: true });
    });
  });
}
```

### Rate Limiting

```typescript
import { RateLimiters } from '@/lib/middleware/rate-limiter';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  await RateLimiters.api(request);

  // Handle request
  return Response.json({ success: true });
}
```

## Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not a common password

### Token Expiration
- Access tokens: 15 minutes
- Refresh tokens: 7 days
- Email verification: 24 hours
- Password reset: 1 hour

### Rate Limiting
- Login: 5 attempts per 15 minutes
- Signup: 3 attempts per hour
- Password reset: 3 requests per hour
- MFA verification: 5 attempts per 15 minutes

### Session Management
- Maximum 5 concurrent sessions per user
- 24-hour inactivity timeout
- 7-day absolute timeout
- 30 days with "remember me"

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": { ... },
    "timestamp": "2025-11-07T12:00:00.000Z"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `INVALID_CREDENTIALS` - Wrong email/password
- `EMAIL_NOT_VERIFIED` - Email needs verification
- `MFA_REQUIRED` - MFA code needed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `VALIDATION_ERROR` - Invalid input

## Audit Logging

All authentication events are logged:
- Login success/failure
- Logout
- Password changes
- Email verification
- MFA enable/disable
- Token refresh
- Session creation/termination
- Account lockout

## Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type checking
npm run type-check
```

## Production Deployment Checklist

- [ ] Generate secure JWT secrets (min 32 chars)
- [ ] Set up SendGrid account and API key
- [ ] Configure CORS allowed origins
- [ ] Set secure cookie domain
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Set up error monitoring (Sentry)
- [ ] Configure database backups
- [ ] Test email delivery
- [ ] Test MFA flow
- [ ] Review rate limits
- [ ] Set up audit log monitoring
- [ ] Test password reset flow
- [ ] Verify session management
- [ ] Test all error scenarios

## Support

For issues or questions, contact the development team or refer to the main project documentation.

---

**Security Notice:** This authentication system implements industry-standard security practices, but security is an ongoing process. Regular security audits, dependency updates, and monitoring are essential for production deployments.
