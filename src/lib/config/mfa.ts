/**
 * MFA Configuration
 * Settings for Two-Factor Authentication (2FA) using TOTP
 */

export const MFA_CONFIG = {
  // TOTP settings
  TOTP_WINDOW: 1, // Allow 1 time step before and after current time (30 seconds window)
  TOTP_STEP: 30, // Time step in seconds
  TOTP_DIGITS: 6, // Number of digits in TOTP code
  TOTP_ALGORITHM: 'SHA1' as const,

  // Issuer name (shown in authenticator apps)
  ISSUER_NAME: 'PACSUM ERP',

  // Recovery codes
  RECOVERY_CODES_COUNT: 10, // Number of recovery codes to generate
  RECOVERY_CODE_LENGTH: 8, // Length of each recovery code

  // MFA session
  MFA_SESSION_EXPIRY: 5 * 60 * 1000, // 5 minutes for completing MFA after password verification

  // Rate limiting for MFA attempts
  MAX_MFA_ATTEMPTS: 5,
  MFA_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

export interface MFASetupData {
  secret: string;
  qrCodeUrl: string;
  recoveryCodes: string[];
}

export interface MFAVerificationData {
  userId: string;
  code: string;
  rememberDevice?: boolean;
}

export interface MFAStatus {
  enabled: boolean;
  verified: boolean;
  backupCodesRemaining?: number;
}

export type MFAMethod = 'totp' | 'recovery-code';
