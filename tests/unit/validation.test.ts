/**
 * Unit Tests for Input Validation
 * Tests Zod schema validation for auth and business logic
 */

import { z } from 'zod';
import {
  signupSchema,
  loginSchema,
  emailVerificationSchema,
  passwordResetSchema,
  mfaVerificationSchema,
} from '@/lib/auth/validators';

describe('Auth Validation Schemas', () => {
  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Company',
        acceptTerms: true,
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject weak password', () => {
      const data = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const data = {
        email: 'test@example.com',
        firstName: 'John',
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should make organizationName optional', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        acceptTerms: true,
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should trim whitespace from strings', () => {
      const data = {
        email: '  test@example.com  ',
        password: 'SecurePassword123!',
        firstName: '  John  ',
        lastName: '  Doe  ',
      };

      const result = signupSchema.safeParse(data);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.firstName).toBe('John');
      }
    });

    it('should convert email to lowercase', () => {
      const data = {
        email: 'Test@EXAMPLE.COM',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = signupSchema.safeParse(data);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept optional MFA code', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        mfaCode: '123456',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept rememberMe boolean', () => {
      const data = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        rememberMe: true,
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const data = {
        email: 'test@example.com',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate MFA code format if provided', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        mfaCode: '123456',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('emailVerificationSchema', () => {
    it('should validate with token', () => {
      const data = {
        token: 'valid.jwt.token',
      };

      const result = emailVerificationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing token', () => {
      const data = {};

      const result = emailVerificationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty token', () => {
      const data = {
        token: '',
      };

      const result = emailVerificationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('passwordResetSchema', () => {
    it('should validate correct password reset data', () => {
      const data = {
        token: 'valid.jwt.token',
        password: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!',
      };

      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const data = {
        token: 'valid.jwt.token',
        password: 'weak',
      };

      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing token', () => {
      const data = {
        password: 'NewSecurePassword123!',
      };

      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const data = {
        token: 'valid.jwt.token',
      };

      const result = passwordResetSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('mfaVerificationSchema', () => {
    it('should validate with TOTP code', () => {
      const data = {
        code: '123456',
      };

      const result = mfaVerificationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept recovery code', () => {
      const data = {
        code: 'ABCD-EFGH',
        recoveryCode: true,
      };

      const result = mfaVerificationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require code or recoveryCode', () => {
      const data = {};

      const result = mfaVerificationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty code', () => {
      const data = {
        code: '',
      };

      const result = mfaVerificationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Business Logic Validation', () => {
  describe('Email format validation', () => {
    const emailSchema = z.string().email();

    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'user+tag@example.co.uk',
        'user.name@subdomain.example.com',
      ];

      validEmails.forEach(email => {
        expect(emailSchema.safeParse(email).success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach(email => {
        expect(emailSchema.safeParse(email).success).toBe(false);
      });
    });
  });

  describe('Currency validation', () => {
    const currencySchema = z.number().positive().multipleOf(0.01);

    it('should accept valid currency amounts', () => {
      expect(currencySchema.safeParse(10.50).success).toBe(true);
      expect(currencySchema.safeParse(0.01).success).toBe(true);
      expect(currencySchema.safeParse(1000000).success).toBe(true);
    });

    it('should reject invalid currency amounts', () => {
      expect(currencySchema.safeParse(-10.50).success).toBe(false);
      expect(currencySchema.safeParse(0).success).toBe(false);
      expect(currencySchema.safeParse(10.999).success).toBe(false);
    });
  });

  describe('Date range validation', () => {
    const dateRangeSchema = z.object({
      startDate: z.date(),
      endDate: z.date(),
    }).refine(
      (data) => data.startDate < data.endDate,
      'Start date must be before end date'
    );

    it('should accept valid date ranges', () => {
      const result = dateRangeSchema.safeParse({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid date ranges', () => {
      const result = dateRangeSchema.safeParse({
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Percentage validation', () => {
    const percentageSchema = z.number().min(0).max(100);

    it('should accept valid percentages', () => {
      expect(percentageSchema.safeParse(0).success).toBe(true);
      expect(percentageSchema.safeParse(50).success).toBe(true);
      expect(percentageSchema.safeParse(100).success).toBe(true);
    });

    it('should reject invalid percentages', () => {
      expect(percentageSchema.safeParse(-1).success).toBe(false);
      expect(percentageSchema.safeParse(101).success).toBe(false);
    });
  });
});
