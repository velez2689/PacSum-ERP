/**
 * Verify Email API Route
 * Verifies user email address using token
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyEmailVerificationToken } from '@/lib/auth/token-manager';
import { handleError } from '@/lib/errors/error-handler';
import { EmailVerificationTokenInvalidError } from '@/lib/errors/auth-errors';
import { successResponse } from '@/utils/error-responses';
import { emailVerificationSchema } from '@/lib/auth/validators';
import { sendWelcomeEmail } from '@/lib/email/email-service';
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
    const validation = emailVerificationSchema.safeParse(body);
    if (!validation.success) {
      return handleError(validation.error);
    }

    const { token } = validation.data;

    // Verify token
    let payload;
    try {
      payload = verifyEmailVerificationToken(token);
    } catch (_error) {
      throw new EmailVerificationTokenInvalidError();
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      throw new EmailVerificationTokenInvalidError('User not found');
    }

    // Check if already verified
    if (user.email_verified) {
      return successResponse(
        { message: 'Email already verified' },
        'Email already verified'
      );
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('Failed to verify email');
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.first_name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if welcome email fails
    }

    // Audit log
    await auditLog(user.id, AUDIT_EVENTS.EMAIL_VERIFIED);

    return successResponse(
      {
        message: 'Email verified successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: true,
        },
      },
      'Email verified successfully'
    );
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/auth/verify-email',
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
