/**
 * Signup API Route
 * Handles user registration with email verification
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '@/lib/auth/password-utils';
import { generateEmailVerificationToken } from '@/lib/auth/token-manager';
import { signupSchema } from '@/lib/auth/validators';
import { handleError } from '@/lib/errors/error-handler';
import { UserAlreadyExistsError } from '@/lib/errors/auth-errors';
import { successResponse } from '@/utils/error-responses';
import { sendVerificationEmail } from '@/lib/email/email-service';
import { AUDIT_EVENTS } from '@/lib/config/security';
import { UserRole } from '@/types/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return handleError(validation.error);
    }

    const { email, password, firstName, lastName, organizationName } = validation.data;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization if provided
    let organizationId: string | undefined;

    if (organizationName) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orgError) {
        throw new Error('Failed to create organization');
      }

      organizationId = org.id;
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: organizationName ? UserRole.ADMIN : UserRole.USER,
        organization_id: organizationId,
        email_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (userError || !user) {
      throw new Error('Failed to create user');
    }

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, firstName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail signup if email fails
    }

    // Audit log
    await auditLog(user.id, AUDIT_EVENTS.SIGNUP_SUCCESS, {
      organization_id: organizationId,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          organizationId: user.organization_id,
          emailVerified: false,
        },
        message: 'Account created successfully. Please check your email to verify your account.',
      },
      'Signup successful',
      undefined,
      201
    );
  } catch (error) {
    return handleError(error, {
      endpoint: '/api/auth/signup',
      method: 'POST',
    });
  }
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
