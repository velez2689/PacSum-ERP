/**
 * MFA Verify API Route
 * Verifies MFA code and enables/completes MFA authentication
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/middleware/auth';
import { verifyTOTP, verifyRecoveryCode } from '@/lib/auth/mfa-utils';
import { handleError } from '@/lib/errors/error-handler';
import { InvalidMFACodeError, MFANotEnabledError } from '@/lib/errors/auth-errors';
import { successResponse } from '@/utils/error-responses';
import { mfaVerificationSchema } from '@/lib/auth/validators';
import { sendMFAEnabledEmail } from '@/lib/email/email-service';
import { AUDIT_EVENTS } from '@/lib/config/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: _, user) => {
    try {
      // Parse request body
      const body = await req.json();

      // Validate input
      const validation = mfaVerificationSchema.safeParse(body);
      if (!validation.success) {
        return handleError(validation.error);
      }

      const { code, recoveryCode } = validation.data;

      // Get user MFA data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('mfa_enabled, mfa_secret, email, first_name')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Case 1: Completing MFA setup (enabling MFA for first time)
      if (!userData.mfa_enabled) {
        // Get pending MFA setup
        const { data: mfaSetup } = await supabase
          .from('mfa_setups')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!mfaSetup) {
          throw new Error('No pending MFA setup found. Please start setup again.');
        }

        // Verify the code
        const isValid = verifyTOTP(mfaSetup.secret, code);
        if (!isValid) {
          throw new InvalidMFACodeError();
        }

        // Enable MFA
        await supabase
          .from('users')
          .update({
            mfa_enabled: true,
            mfa_secret: mfaSetup.secret,
            mfa_recovery_codes: mfaSetup.recovery_codes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Clean up setup
        await supabase.from('mfa_setups').delete().eq('user_id', user.id);

        // Send notification email
        try {
          await sendMFAEnabledEmail(userData.email, userData.first_name);
        } catch (emailError) {
          console.error('Failed to send MFA enabled email:', emailError);
        }

        // Audit log
        await auditLog(user.id, AUDIT_EVENTS.MFA_ENABLED);

        return successResponse({
          message: 'Two-factor authentication enabled successfully',
          mfaEnabled: true,
        });
      }

      // Case 2: Using MFA during login (MFA already enabled)
      if (recoveryCode) {
        // Verify using recovery code
        const recoveryCodes = userData.mfa_recovery_codes || [];
        let codeValid = false;
        let usedCodeIndex = -1;

        for (let i = 0; i < recoveryCodes.length; i++) {
          const isMatch = await verifyRecoveryCode(code, recoveryCodes[i]);
          if (isMatch) {
            codeValid = true;
            usedCodeIndex = i;
            break;
          }
        }

        if (!codeValid) {
          throw new InvalidMFACodeError('Invalid recovery code');
        }

        // Remove used recovery code
        recoveryCodes.splice(usedCodeIndex, 1);
        await supabase
          .from('users')
          .update({
            mfa_recovery_codes: recoveryCodes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Audit log
        await auditLog(user.id, AUDIT_EVENTS.MFA_VERIFIED, {
          method: 'recovery_code',
          remaining_codes: recoveryCodes.length,
        });

        return successResponse({
          message: 'Recovery code verified successfully',
          remainingCodes: recoveryCodes.length,
        });
      } else {
        // Verify using TOTP
        if (!userData.mfa_secret) {
          throw new MFANotEnabledError();
        }

        const isValid = verifyTOTP(userData.mfa_secret, code);
        if (!isValid) {
          // Audit failed attempt
          await auditLog(user.id, AUDIT_EVENTS.MFA_FAILED);
          throw new InvalidMFACodeError();
        }

        // Audit log
        await auditLog(user.id, AUDIT_EVENTS.MFA_VERIFIED, {
          method: 'totp',
        });

        return successResponse({
          message: 'MFA code verified successfully',
        });
      }
    } catch (error) {
      return handleError(error, {
        endpoint: '/api/auth/mfa/verify',
        method: 'POST',
        userId: user.id,
      });
    }
  });
}

async function auditLog(
  userId: string,
  event: string,
  metadata?: Record<string, any>
): Promise<void> {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    event,
    metadata,
    created_at: new Date().toISOString(),
  });
}
