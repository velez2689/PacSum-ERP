/**
 * POST /api/integrations/quickbooks/sync
 * Trigger QuickBooks data synchronization
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncCustomers, syncTransactions } from '@/lib/integrations/quickbooks/sync';
import { IntegrationErrorHandler } from '@/lib/integrations/integration-errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, syncType, entityTypes, startDate, endDate } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const results: Record<string, unknown> = {};

    if (!entityTypes || entityTypes.includes('customers')) {
      const customerResult = await syncCustomers(organizationId, syncType || 'full');
      results.customers = {
        synced: customerResult.customers.length,
        created: customerResult.created,
        updated: customerResult.updated,
        linked: customerResult.linked,
        errors: customerResult.errors.length,
      };
    }

    if (entityTypes?.includes('transactions') && startDate && endDate) {
      const transactionResult = await syncTransactions(organizationId, startDate, endDate);
      results.transactions = transactionResult;
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const integrationError = IntegrationErrorHandler.parseError(error, { provider: 'quickbooks' });
    IntegrationErrorHandler.logError(integrationError);

    return NextResponse.json(
      {
        success: false,
        error: integrationError.message,
        code: integrationError.code,
      },
      { status: integrationError.statusCode }
    );
  }
}
