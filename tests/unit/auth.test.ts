/**
 * Unit Tests for Authentication Utilities
 * Tests password hashing, JWT creation, and security functions
 */

import {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateSecurePassword,
  needsRehash,
} from '@/lib/auth/password-utils';
import {
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyEmailVerificationToken,
  verifyPasswordResetToken,
  isTokenExpired,
  getTokenExpiration,
  extractBearerToken,
} from '@/lib/auth/token-manager';
import {
  generateMFASecret,
  verifyTOTP,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  validateTOTPFormat,
  validateRecoveryCodeFormat,
  formatRecoveryCode,
} from '@/lib/auth/mfa-utils';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should create different hashes for the same password', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'SecurePassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    it('should handle empty strings', async () => {
      const hash = await hashPassword('SecurePassword123!');
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const result = validatePasswordStrength('SecurePassword123!');
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject passwords that are too short', () => {
      const result = validatePasswordStrength('Pass12!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('at least'))).toBe(true);
    });

    it('should reject passwords without uppercase', () => {
      const result = validatePasswordStrength('securepassword123!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should reject passwords without lowercase', () => {
      const result = validatePasswordStrength('SECUREPASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
    });

    it('should reject passwords without numbers', () => {
      const result = validatePasswordStrength('SecurePassword!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('number'))).toBe(true);
    });

    it('should reject passwords without special characters', () => {
      const result = validatePasswordStrength('SecurePassword123');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('special'))).toBe(true);
    });

    it('should reject common passwords', () => {
      const result = validatePasswordStrength('Password123!');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('common'))).toBe(true);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate a password', () => {
      const password = generateSecurePassword();
      expect(password).toBeDefined();
      expect(password.length).toBeGreaterThanOrEqual(16);
    });

    it('should generate a strong password', () => {
      const password = generateSecurePassword();
      const result = validatePasswordStrength(password);
      expect(result.valid).toBe(true);
    });

    it('should generate random passwords', () => {
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      expect(password1).not.toBe(password2);
    });

    it('should respect custom length', () => {
      const password = generateSecurePassword(20);
      expect(password.length).toBe(20);
    });
  });

  describe('needsRehash', () => {
    it('should return false for current bcrypt rounds', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const needs = await needsRehash(hash, 12);
      expect(needs).toBe(false);
    });

    it('should return true for invalid hash', async () => {
      const needs = await needsRehash('invalid-hash', 12);
      expect(needs).toBe(true);
    });
  });
});

describe('JWT Token Management', () => {
  const mockPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'user',
    organizationId: 'org-123',
    sessionId: 'session-123',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken({
        ...mockPayload,
        userId: 'user-456',
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.type).toBe('access');
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow();
    });

    it('should throw error for wrong token type', () => {
      const refreshToken = generateRefreshToken({
        ...mockPayload,
        tokenVersion: 1,
      });

      expect(() => verifyAccessToken(refreshToken)).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken({
        ...mockPayload,
        tokenVersion: 1,
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken({
        ...mockPayload,
        tokenVersion: 1,
      });

      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.tokenVersion).toBe(1);
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate a valid email verification token', () => {
      const token = generateEmailVerificationToken({
        userId: mockPayload.userId,
        email: mockPayload.email,
        role: mockPayload.role,
      });

      expect(token).toBeDefined();
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('should verify a valid email verification token', () => {
      const token = generateEmailVerificationToken({
        userId: mockPayload.userId,
        email: mockPayload.email,
        role: mockPayload.role,
      });

      const decoded = verifyEmailVerificationToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.type).toBe('email-verification');
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a valid password reset token', () => {
      const token = generatePasswordResetToken({
        userId: mockPayload.userId,
        email: mockPayload.email,
        role: mockPayload.role,
        passwordHash: 'old-hash',
      });

      expect(token).toBeDefined();
    });
  });

  describe('verifyPasswordResetToken', () => {
    it('should verify a valid password reset token', () => {
      const token = generatePasswordResetToken({
        userId: mockPayload.userId,
        email: mockPayload.email,
        role: mockPayload.role,
        passwordHash: 'old-hash',
      });

      const decoded = verifyPasswordResetToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.type).toBe('password-reset');
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const token = generateAccessToken(mockPayload);
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const token = generateAccessToken(mockPayload);
      const expiration = getTokenExpiration(token);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpiration('invalid-token')).toBeNull();
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from Bearer header', () => {
      const token = 'my-token-123';
      const header = `Bearer ${token}`;
      expect(extractBearerToken(header)).toBe(token);
    });

    it('should return null for invalid header', () => {
      expect(extractBearerToken('Invalid token')).toBeNull();
      expect(extractBearerToken(null)).toBeNull();
    });
  });
});

describe('MFA Utilities', () => {
  describe('generateMFASecret', () => {
    it('should generate MFA secret and QR code', async () => {
      const result = await generateMFASecret(
        'test@example.com',
        'Test User'
      );

      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.backupUrl).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(0);
    });

    it('should generate different secrets each time', async () => {
      const result1 = await generateMFASecret(
        'test@example.com',
        'Test User'
      );
      const result2 = await generateMFASecret(
        'test@example.com',
        'Test User'
      );

      expect(result1.secret).not.toBe(result2.secret);
    });
  });

  describe('generateRecoveryCodes', () => {
    it('should generate recovery codes', () => {
      const codes = generateRecoveryCodes();

      expect(codes).toBeDefined();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(0);
    });

    it('should generate properly formatted codes', () => {
      const codes = generateRecoveryCodes();

      codes.forEach(code => {
        expect(validateRecoveryCodeFormat(code)).toBe(true);
      });
    });

    it('should respect custom count', () => {
      const codes = generateRecoveryCodes(10);
      expect(codes.length).toBe(10);
    });
  });

  describe('hashRecoveryCode', () => {
    it('should hash a recovery code', async () => {
      const code = generateRecoveryCodes(1)[0];
      const hash = await hashRecoveryCode(code);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(code);
    });

    it('should create consistent hashes', async () => {
      const code = 'ABCD-EFGH';
      const hash1 = await hashRecoveryCode(code);
      const hash2 = await hashRecoveryCode(code);

      expect(hash1).toBe(hash2);
    });
  });

  describe('verifyRecoveryCode', () => {
    it('should verify a matching recovery code', async () => {
      const code = generateRecoveryCodes(1)[0];
      const hash = await hashRecoveryCode(code);

      const isValid = await verifyRecoveryCode(code, hash);
      expect(isValid).toBe(true);
    });

    it('should reject non-matching recovery code', async () => {
      const code = generateRecoveryCodes(1)[0];
      const otherCode = generateRecoveryCodes(1)[0];
      const hash = await hashRecoveryCode(code);

      const isValid = await verifyRecoveryCode(otherCode, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validateTOTPFormat', () => {
    it('should validate correct TOTP format', () => {
      expect(validateTOTPFormat('123456')).toBe(true);
    });

    it('should reject incorrect TOTP format', () => {
      expect(validateTOTPFormat('12345')).toBe(false);
      expect(validateTOTPFormat('1234567')).toBe(false);
      expect(validateTOTPFormat('abcdef')).toBe(false);
    });
  });

  describe('validateRecoveryCodeFormat', () => {
    it('should validate correct recovery code format', () => {
      const code = formatRecoveryCode('ABCDEFGH');
      expect(validateRecoveryCodeFormat(code)).toBe(true);
    });

    it('should reject incorrect format', () => {
      expect(validateRecoveryCodeFormat('123')).toBe(false);
      expect(validateRecoveryCodeFormat('INVALID')).toBe(false);
    });
  });

  describe('formatRecoveryCode', () => {
    it('should format recovery code with dashes', () => {
      const formatted = formatRecoveryCode('ABCDEFGH');
      expect(formatted).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should handle already formatted codes', () => {
      const formatted = formatRecoveryCode('ABCD-EFGH');
      expect(formatted).toBe('ABCD-EFGH');
    });
  });
});
