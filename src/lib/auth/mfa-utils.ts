/**
 * MFA Utilities
 * Two-Factor Authentication using TOTP (Time-based One-Time Password)
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import crypto from 'crypto';
import { MFA_CONFIG } from '@/lib/config/mfa';

/**
 * Generate MFA secret and QR code
 */
export async function generateMFASecret(
  userEmail: string,
  userName: string
): Promise<{
  secret: string;
  qrCodeUrl: string;
  backupUrl: string;
}> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${MFA_CONFIG.ISSUER_NAME} (${userEmail})`,
    issuer: MFA_CONFIG.ISSUER_NAME,
    length: 32,
  });

  if (!secret.otpauth_url) {
    throw new Error('Failed to generate OTP auth URL');
  }

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupUrl: secret.otpauth_url,
  };
}

/**
 * Verify TOTP code
 */
export function verifyTOTP(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: MFA_CONFIG.TOTP_WINDOW,
    step: MFA_CONFIG.TOTP_STEP,
  });
}

/**
 * Generate recovery codes
 */
export function generateRecoveryCodes(count: number = MFA_CONFIG.RECOVERY_CODES_COUNT): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate random code
    const code = crypto
      .randomBytes(MFA_CONFIG.RECOVERY_CODE_LENGTH)
      .toString('hex')
      .substring(0, MFA_CONFIG.RECOVERY_CODE_LENGTH)
      .toUpperCase();

    // Format code with dashes (e.g., ABCD-EFGH)
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
    codes.push(formattedCode);
  }

  return codes;
}

/**
 * Hash recovery code for storage
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  // Remove dashes and convert to uppercase for consistency
  const normalizedCode = code.replace(/-/g, '').toUpperCase();

  return crypto
    .createHash('sha256')
    .update(normalizedCode)
    .digest('hex');
}

/**
 * Verify recovery code
 */
export async function verifyRecoveryCode(
  code: string,
  hashedCode: string
): Promise<boolean> {
  const hash = await hashRecoveryCode(code);
  return hash === hashedCode;
}

/**
 * Validate TOTP token format
 */
export function validateTOTPFormat(token: string): boolean {
  // TOTP codes should be 6 digits
  const pattern = new RegExp(`^\\d{${MFA_CONFIG.TOTP_DIGITS}}$`);
  return pattern.test(token);
}

/**
 * Validate recovery code format
 */
export function validateRecoveryCodeFormat(code: string): boolean {
  // Remove dashes for validation
  const cleanCode = code.replace(/-/g, '');

  // Should be exactly RECOVERY_CODE_LENGTH characters, alphanumeric
  const pattern = new RegExp(`^[A-Z0-9]{${MFA_CONFIG.RECOVERY_CODE_LENGTH}}$`, 'i');
  return pattern.test(cleanCode);
}

/**
 * Format recovery code for display
 */
export function formatRecoveryCode(code: string): string {
  // Remove existing dashes and convert to uppercase
  const cleanCode = code.replace(/-/g, '').toUpperCase();

  // Add dashes every 4 characters
  return cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;
}

/**
 * Generate MFA backup information
 */
export interface MFABackupInfo {
  secret: string;
  recoveryCodes: string[];
  createdAt: Date;
}

export async function generateMFABackup(
  userEmail: string,
  userName: string
): Promise<MFABackupInfo> {
  const { secret } = await generateMFASecret(userEmail, userName);
  const recoveryCodes = generateRecoveryCodes();

  return {
    secret,
    recoveryCodes,
    createdAt: new Date(),
  };
}

/**
 * Create a temporary MFA session token
 * Used to store MFA state between password verification and MFA verification
 */
export function generateMFASessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate MFA session token format
 */
export function validateMFASessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}
