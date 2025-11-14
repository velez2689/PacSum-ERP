/**
 * Get Current User API Route
 * Returns authenticated user's information
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/middleware/auth';
import { handleError } from '@/lib/errors/error-handler';
import { successResponse } from '@/utils/error-responses';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  return requireAuth(request, async (_req: NextRequest, user) => {
    try {
      // Get full user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          organization_id,
          email_verified,
          mfa_enabled,
          avatar,
          created_at,
          updated_at
        `)
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Get organization details if user belongs to one
      let organization = null;
      if (userData.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id, name, created_at')
          .eq('id', userData.organization_id)
          .single();

        organization = orgData;
      }

      return successResponse({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          organizationId: userData.organization_id,
          emailVerified: userData.email_verified,
          mfaEnabled: userData.mfa_enabled,
          avatar: userData.avatar,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
        },
        organization,
      });
    } catch (error) {
      return handleError(error, {
        endpoint: '/api/auth/me',
        method: 'GET',
        userId: user.id,
      });
    }
  });
}
