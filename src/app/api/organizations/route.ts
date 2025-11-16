/**
 * Organizations API Route
 * GET /api/organizations - List user's organizations
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse } from '@/utils/error-responses';
import { queryDb } from '@/lib/db/postgres';

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  subscription_tier: string;
  subscription_status: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  return requireAuth(request, async (_req: NextRequest, user) => {
    try {
      // Query organizations where user has access
      // Since users belong to one organization via organization_id, we fetch that organization
      const organizations = await queryDb<Organization>(
        `SELECT
          id,
          name,
          slug,
          settings,
          subscription_tier,
          subscription_status,
          contact_email,
          contact_phone,
          created_at,
          updated_at
        FROM organizations
        WHERE id = $1
        AND deleted_at IS NULL`,
        [user.organizationId]
      );

      return successResponse({
        organizations: organizations || [],
        count: organizations?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);

      // Return empty array on error as fallback
      return successResponse({
        organizations: [],
        count: 0,
      });
    }
  });
}
