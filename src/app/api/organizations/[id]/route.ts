/**
 * Single Organization API Route
 * GET /api/organizations/[id] - Get organization by ID
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleError } from '@/lib/errors/error-handler';
import { successResponse, ErrorResponses } from '@/utils/error-responses';
import { queryDbSingle } from '@/lib/db/postgres';

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, any>;
  subscription_tier: string;
  subscription_status: string;
  subscription_expires_at: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_address: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return requireAuth(request, async (_req: NextRequest, user) => {
    try {
      const { id } = context.params;

      // Check if user has access to this organization
      if (user.organizationId !== id) {
        return ErrorResponses.forbidden('You do not have access to this organization');
      }

      // Fetch organization details
      const organization = await queryDbSingle<Organization>(
        `SELECT
          id,
          name,
          slug,
          settings,
          subscription_tier,
          subscription_status,
          subscription_expires_at,
          contact_email,
          contact_phone,
          billing_address,
          created_at,
          updated_at
        FROM organizations
        WHERE id = $1
        AND deleted_at IS NULL`,
        [id]
      );

      if (!organization) {
        return ErrorResponses.notFound('Organization');
      }

      return successResponse({ organization });
    } catch (error) {
      return handleError(error, {
        endpoint: '/api/organizations/[id]',
        method: 'GET',
        userId: user.id,
        organizationId: context.params.id,
      });
    }
  });
}
