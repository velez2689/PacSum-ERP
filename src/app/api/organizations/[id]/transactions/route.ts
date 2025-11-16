/**
 * Organization Transactions API Route
 * GET /api/organizations/[id]/transactions - List transactions for organization
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { successResponse, ErrorResponses } from '@/utils/error-responses';
import { queryDb } from '@/lib/db/postgres';

interface Transaction {
  id: string;
  organization_id: string;
  client_id: string;
  transaction_date: string;
  post_date: string | null;
  description: string;
  amount: number;
  category: string | null;
  subcategory: string | null;
  transaction_type: string;
  payment_method: string | null;
  payee: string | null;
  payer: string | null;
  bank_account: string | null;
  reconciled: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  // Client information for display
  client_name?: string;
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
  return requireAuth(request, async (req: NextRequest, user) => {
    try {
      const { id } = context.params;

      // Check if user has access to this organization
      if (user.organizationId !== id) {
        return ErrorResponses.forbidden('You do not have access to this organization');
      }

      // Get limit from query params (default 10)
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const clientId = searchParams.get('clientId');

      // Build query with optional client filter
      let query = `
        SELECT
          t.id,
          t.organization_id,
          t.client_id,
          t.transaction_date,
          t.post_date,
          t.description,
          t.amount,
          t.category,
          t.subcategory,
          t.transaction_type,
          t.payment_method,
          t.payee,
          t.payer,
          t.bank_account,
          t.reconciled,
          t.status,
          t.created_at,
          t.updated_at,
          c.name as client_name
        FROM transactions t
        LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.organization_id = $1
        AND t.deleted_at IS NULL
      `;

      const params: any[] = [id];

      // Add client filter if provided
      if (clientId) {
        query += ` AND t.client_id = $${params.length + 1}`;
        params.push(clientId);
      }

      query += `
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);

      // Fetch transactions
      const transactions = await queryDb<Transaction>(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) as total
        FROM transactions
        WHERE organization_id = $1
        AND deleted_at IS NULL
      `;

      const countParams: any[] = [id];

      if (clientId) {
        countQuery += ` AND client_id = $2`;
        countParams.push(clientId);
      }

      const countResult = await queryDb<{ total: string }>(countQuery, countParams);
      const total = parseInt(countResult?.[0]?.total || '0', 10);

      return successResponse({
        transactions: transactions || [],
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);

      // Return empty array on error as fallback
      return successResponse({
        transactions: [],
        pagination: {
          limit: 10,
          offset: 0,
          total: 0,
          hasMore: false,
        },
      });
    }
  });
}
