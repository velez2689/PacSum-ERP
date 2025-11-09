/**
 * QuickBooks Sync Module
 * Sync data between QuickBooks and PACSUM
 */

import { createQuickBooksClient } from './client';
import { QBOCustomer, QBOInvoice, QBOCustomerSyncResult } from './types';
import { getClientByExternalId, updateClientExternalId, createTransactionFromIntegration, createSyncLog, updateSyncLog, getIntegration } from '../db-helpers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function syncCustomers(organizationId: string, syncType: 'full' | 'incremental' = 'full'): Promise<QBOCustomerSyncResult> {
  const client = await createQuickBooksClient(organizationId);
  const integration = await getIntegration(organizationId, 'quickbooks');

  if (!integration) throw new Error('QuickBooks integration not found');

  const syncLogId = await createSyncLog(integration.id, syncType === 'full' ? 'full' : 'incremental', 'started');

  try {
    let query = "SELECT * FROM Customer WHERE Active = true MAXRESULTS 1000";

    if (syncType === 'incremental' && integration.lastSyncAt) {
      const lastSync = new Date(integration.lastSyncAt).toISOString().split('T')[0];
      query = `SELECT * FROM Customer WHERE MetaData.LastUpdatedTime >= '${lastSync}' MAXRESULTS 1000`;
    }

    const response = await client.query<QBOCustomer>(query);
    const customers = response.QueryResponse?.Customer || [];

    let created = 0, updated = 0, linked = 0;
    const errors: Array<{ customer: Partial<QBOCustomer>; error: string }> = [];

    for (const qbCustomer of customers) {
      try {
        const existing = await getClientByExternalId(organizationId, 'quickbooks', qbCustomer.Id);

        if (existing) {
          linked++;
        } else {
          const { data, error } = await supabase.from('clients').insert({
            organization_id: organizationId,
            name: qbCustomer.DisplayName,
            primary_contact_name: qbCustomer.GivenName && qbCustomer.FamilyName
              ? `${qbCustomer.GivenName} ${qbCustomer.FamilyName}`
              : undefined,
            primary_contact_email: qbCustomer.PrimaryEmailAddr?.Address,
            primary_contact_phone: qbCustomer.PrimaryPhone?.FreeFormNumber,
            quickbooks_id: qbCustomer.Id,
            status: qbCustomer.Active ? 'active' : 'inactive',
            metadata: { syncedFrom: 'quickbooks', qboSyncToken: qbCustomer.SyncToken },
          }).select().single();

          if (error) throw error;
          created++;
        }
      } catch (error) {
        errors.push({ customer: qbCustomer, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    await updateSyncLog(syncLogId, {
      status: 'completed',
      recordsProcessed: customers.length,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsFailed: errors.length,
    });

    return { customers, created, updated, linked, errors };
  } catch (error) {
    await updateSyncLog(syncLogId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Sync failed',
    });
    throw error;
  }
}

export async function syncTransactions(organizationId: string, startDate: string, endDate: string): Promise<{ created: number; errors: number }> {
  const client = await createQuickBooksClient(organizationId);

  const query = `SELECT * FROM Invoice WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' MAXRESULTS 1000`;
  const response = await client.query<QBOInvoice>(query);
  const invoices = response.QueryResponse?.Invoice || [];

  let created = 0, errors = 0;

  for (const invoice of invoices) {
    try {
      const qbClient = await getClientByExternalId(organizationId, 'quickbooks', invoice.CustomerRef.value);

      if (qbClient) {
        await createTransactionFromIntegration(organizationId, qbClient.id, 'quickbooks', {
          externalId: invoice.Id,
          transactionDate: invoice.TxnDate,
          description: `Invoice ${invoice.DocNumber}`,
          amount: invoice.TotalAmt,
          transactionType: 'income',
          category: 'SALES',
          reference: invoice.DocNumber,
          metadata: { qboSyncToken: invoice.SyncToken },
        });
        created++;
      }
    } catch (error) {
      errors++;
    }
  }

  return { created, errors };
}
