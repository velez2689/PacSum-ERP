/**
 * Reset Password API Route
 * Completes password reset using token
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPasswordResetToken } from '@/lib/auth/token-manager';
import { hashPassword } from '@/lib/auth/password-utils';
import { invalidateAllUserSessions } from '@/lib/auth/session-manager';
import { handleError } from '@/lib/errors/error-handler';
import { PasswordResetTokenInvalidError } from '@/lib/errors/auth-errors';
import { successResponse } from '@/utils/error-responses';
import { passwordResetSchema } from '@/lib/auth/validators';
import { sendPasswordChangedEmail } from '@/lib/email/email-service';
import { AUDIT_EVENTS } from '@/lib/config/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = passwordResetSchema.safeParse(body);
    if (!validation.success) {
      return handleError(validation.error);
    }

    const { token, password } = validation.data;

    // Verify token
    let payload;
    try {
      payload = verifyPasswordResetToken(token);
    } catch (_error) {
      throw new PasswordResetTokenInvalidError();
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      throw new PasswordResetTokenInvalidError('User not found');
    }

    // Verify token is still valid (password hasn't been changed)
    if (user.password_hash !== payload.passwordHash) {
      throw new PasswordResetTokenInvalidError('Token is no longer valid');
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to update password');
    }

    // Invalidate all existing sessions for security
    await invalidateAllUserSessions(user.id);

    // Send notification email
    try {
      await sendPasswordChangedEmail(user.email, user.first_name);
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError);
      // Don't fail password reset if email fails
    }

    // Audit log
    await auditLog(user.id, AUDIT_EVENTS.PASSWORD_RESET_COMPLETED, {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return successResponse(
      {
        message: 'Password reset successfully. Please log in with your new password.',
      },
      'Password reset successfully'
    );
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/auth/reset-password',
      method: 'POST',
    });
  }
}

async function auditLog(
  userId: string,
  event: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    event,
    metadata,
    created_at: new Date().toISOString(),
  });
}
