/**
 * Input Validators
 * Zod schemas for validating authentication inputs
 */

import { z } from 'zod';
import { PASSWORD_POLICY, VALIDATION_CONFIG } from '@/lib/config/security';
import { UserRole } from '@/types/auth';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(VALIDATION_CONFIG.EMAIL_MAX_LENGTH, 'Email is too long')
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_POLICY.MIN_LENGTH, `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`)
  .max(PASSWORD_POLICY.MAX_LENGTH, `Password must not exceed ${PASSWORD_POLICY.MAX_LENGTH} characters`)
  .refine(
    (password) => {
      if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        return false;
      }
      if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        return false;
      }
      if (PASSWORD_POLICY.REQUIRE_NUMBERS && !/\d/.test(password)) {
        return false;
      }
      if (PASSWORD_POLICY.REQUIRE_SPECIAL_CHARS) {
        const specialCharsRegex = new RegExp(
          `[${PASSWORD_POLICY.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`
        );
        if (!specialCharsRegex.test(password)) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Password must contain uppercase, lowercase, numbers, and special characters',
    }
  );

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(VALIDATION_CONFIG.NAME_MIN_LENGTH, 'Name is required')
  .max(VALIDATION_CONFIG.NAME_MAX_LENGTH, 'Name is too long')
  .trim()
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Login credentials schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Signup schema
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  organizationName: z.string().min(1).max(200).trim().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset completion schema
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;

/**
 * MFA setup verification schema
 */
export const mfaSetupSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
});

export type MFASetupInput = z.infer<typeof mfaSetupSchema>;

/**
 * MFA verification schema
 */
export const mfaVerificationSchema = z.object({
  code: z.string().min(1, 'MFA code is required'),
  rememberDevice: z.boolean().optional(),
  recoveryCode: z.boolean().optional(),
});

export type MFAVerificationInput = z.infer<typeof mfaVerificationSchema>;

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * User role schema
 */
export const userRoleSchema = z.nativeEnum(UserRole);

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * IP address validation
 */
export const ipAddressSchema = z.string().ip({ version: 'v4' }).or(z.string().ip({ version: 'v6' }));

/**
 * User agent validation
 */
export const userAgentSchema = z.string().max(500);

/**
 * Generic validation helper
 */
export async function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for API responses
 */
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
}
