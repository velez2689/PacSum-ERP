/**
 * Send Password Reset Email API Route
 * Sends password reset link to user's email
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePasswordResetToken } from '@/lib/auth/token-manager';
import { handleError } from '@/lib/errors/error-handler';
import { successResponse } from '@/utils/error-responses';
import { passwordResetRequestSchema } from '@/lib/auth/validators';
import { sendPasswordResetEmail } from '@/lib/email/email-service';
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
    const validation = passwordResetRequestSchema.safeParse(body);
    if (!validation.success) {
      return handleError(validation.error);
    }

    const { email } = validation.data;

    // Get user (always return success to prevent email enumeration)
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (user) {
      // Generate reset token
      const resetToken = generatePasswordResetToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        passwordHash: user.password_hash, // Include to invalidate token if password changes
      });

      // Send reset email
      try {
        await sendPasswordResetEmail(user.email, resetToken, user.first_name);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        // Don't reveal email sending failure
      }

      // Audit log
      await auditLog(user.id, AUDIT_EVENTS.PASSWORD_RESET_REQUESTED, {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
    }

    // Always return success to prevent email enumeration
    return successResponse(
      {
        message: 'If an account exists with this email, a password reset link has been sent.',
      },
      'Password reset email sent'
    );
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/auth/send-reset-email',
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
