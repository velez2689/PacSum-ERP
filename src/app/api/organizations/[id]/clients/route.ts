/**
 * Organization Clients API Route
 * GET /api/organizations/[id]/clients - List clients for organization
 * POST /api/organizations/[id]/clients - Create new client
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { handleError } from '@/lib/errors/error-handler';
import { successResponse, ErrorResponses } from '@/utils/error-responses';
import { queryDb, executeDb } from '@/lib/db/postgres';

interface Client {
  id: string;
  organization_id: string;
  name: string;
  legal_name: string | null;
  client_code: string | null;
  industry: string | null;
  entity_type: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  status: string;
  current_fhs_score: number | null;
  fhs_last_calculated_at: string | null;
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

      // Fetch clients for the organization
      const clients = await queryDb<Client>(
        `SELECT
          id,
          organization_id,
          name,
          legal_name,
          client_code,
          industry,
          entity_type,
          primary_contact_name,
          primary_contact_email,
          primary_contact_phone,
          status,
          current_fhs_score,
          fhs_last_calculated_at,
          created_at,
          updated_at
        FROM clients
        WHERE organization_id = $1
        AND deleted_at IS NULL
        ORDER BY name ASC`,
        [id]
      );

      return successResponse({
        clients: clients || [],
        count: clients?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching clients:', error);

      // Return empty array on error as fallback
      return successResponse({
        clients: [],
        count: 0,
      });
    }
  });
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return requireAuth(request, async (req: NextRequest, user) => {
    try {
      const { id } = context.params;

      // Check if user has access to this organization
      if (user.organizationId !== id) {
        return ErrorResponses.forbidden('You do not have access to this organization');
      }

      // Parse request body
      const body = await req.json();

      const {
        name,
        legal_name,
        client_code,
        industry,
        entity_type,
        primary_contact_name,
        primary_contact_email,
        primary_contact_phone,
        website,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country,
        tax_id_number,
        tax_id_type,
        business_start_date,
        fiscal_year_end,
        status,
        billing_rate,
        billing_frequency,
        notes,
      } = body;

      // Validate required fields
      if (!name) {
        return ErrorResponses.badRequest('Client name is required');
      }

      // Insert new client
      await executeDb(
        `INSERT INTO clients (
          organization_id,
          name,
          legal_name,
          client_code,
          industry,
          entity_type,
          primary_contact_name,
          primary_contact_email,
          primary_contact_phone,
          website,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          country,
          tax_id_number,
          tax_id_type,
          business_start_date,
          fiscal_year_end,
          status,
          billing_rate,
          billing_frequency,
          notes,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25
        )`,
        [
          id, // organization_id
          name,
          legal_name || null,
          client_code || null,
          industry || null,
          entity_type || null,
          primary_contact_name || null,
          primary_contact_email || null,
          primary_contact_phone || null,
          website || null,
          address_line1 || null,
          address_line2 || null,
          city || null,
          state || null,
          postal_code || null,
          country || 'US',
          tax_id_number || null,
          tax_id_type || null,
          business_start_date || null,
          fiscal_year_end || null,
          status || 'active',
          billing_rate || null,
          billing_frequency || null,
          notes || null,
          user.id, // created_by
        ]
      );

      // Fetch the created client (we can use RETURNING clause in PostgreSQL)
      const clients = await queryDb<Client>(
        `SELECT
          id,
          organization_id,
          name,
          legal_name,
          client_code,
          industry,
          entity_type,
          primary_contact_name,
          primary_contact_email,
          primary_contact_phone,
          status,
          current_fhs_score,
          created_at,
          updated_at
        FROM clients
        WHERE organization_id = $1
        AND name = $2
        AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1`,
        [id, name]
      );

      const client = clients?.[0] || null;

      return successResponse(
        { client },
        'Client created successfully',
        undefined,
        201
      );
    } catch (error) {
      return handleError(error, {
        endpoint: '/api/organizations/[id]/clients',
        method: 'POST',
        userId: user.id,
        organizationId: context.params.id,
      });
    }
  });
}
