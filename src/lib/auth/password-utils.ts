/**
 * Password Utilities
 * Secure password hashing and validation using bcrypt
 */

import bcrypt from 'bcryptjs';
import { PASSWORD_POLICY } from '@/lib/config/security';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters long`);
  }

  if (password.length > PASSWORD_POLICY.MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_POLICY.MAX_LENGTH} characters`);
  }

  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_POLICY.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_POLICY.REQUIRE_SPECIAL_CHARS) {
    const specialCharsRegex = new RegExp(
      `[${PASSWORD_POLICY.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`
    );
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    }
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', 'password123', 'password123!', '12345678', 'qwerty', 'abc123',
    'password1', '123456789', 'welcome', 'admin', 'letmein'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = PASSWORD_POLICY.SPECIAL_CHARS;

  const allChars = uppercase + lowercase + numbers + special;

  // Ensure at least one of each required type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if password needs to be rehashed (if bcrypt rounds have changed)
 */
export async function needsRehash(hash: string, rounds: number = 12): Promise<boolean> {
  try {
    const parts = hash.split('$');
    if (parts.length < 3) {
      return true; // Invalid bcrypt hash format
    }
    const hashRounds = parseInt(parts[2], 10);
    if (isNaN(hashRounds)) {
      return true; // Invalid rounds number
    }
    return hashRounds < rounds;
  } catch {
    return true;
  }
}

/**
 * Sanitize password for logging (never log actual passwords!)
 */
export function sanitizePasswordForLog(_password: string): string {
  return '********';
}
