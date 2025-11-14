/**
 * MFA Setup API Route
 * Generates MFA secret and QR code for user to set up 2FA
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/middleware/auth';
import { generateMFASecret, generateRecoveryCodes, hashRecoveryCode } from '@/lib/auth/mfa-utils';
import { handleError } from '@/lib/errors/error-handler';
import { MFAAlreadyEnabledError } from '@/lib/errors/auth-errors';
import { successResponse } from '@/utils/error-responses';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: _, user) => {
    try {
      // Get user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('mfa_enabled, email, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Check if MFA is already enabled
      if (userData.mfa_enabled) {
        throw new MFAAlreadyEnabledError();
      }

      // Generate MFA secret and QR code
      const userName = `${userData.first_name} ${userData.last_name}`;
      const { secret, qrCodeUrl } = await generateMFASecret(userData.email, userName);

      // Generate recovery codes
      const recoveryCodes = generateRecoveryCodes();

      // Hash recovery codes for storage
      const hashedCodes = await Promise.all(
        recoveryCodes.map((code) => hashRecoveryCode(code))
      );

      // Store MFA setup temporarily (not enabled until verified)
      await supabase.from('mfa_setups').upsert({
        user_id: user.id,
        secret,
        recovery_codes: hashedCodes,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

      return successResponse({
        qrCodeUrl,
        secret,
        recoveryCodes,
        message: 'Scan the QR code with your authenticator app and verify with a code to enable MFA.',
      });
    } catch (error) {
      return handleError(error, {
        endpoint: '/api/auth/mfa/setup',
        method: 'POST',
        userId: user.id,
      });
    }
  });
}
