/**
 * Database Helpers for Integrations
 * Functions to save and retrieve integration data from the database
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * Integration credentials interface
 */
export interface IntegrationCredentials {
  provider: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: string;
  realmId?: string; // QuickBooks specific
  customerId?: string; // Stripe specific
  [key: string]: unknown;
}

/**
 * Get integration by organization and provider
 */
export async function getIntegration(
  organizationId: string,
  provider: 'stripe' | 'quickbooks' | 'plaid' | 'sendgrid'
): Promise<{
  id: string;
  organizationId: string;
  provider: string;
  providerName: string;
  status: string;
  isActive: boolean;
  credentials: IntegrationCredentials | null;
  config: Record<string, unknown>;
  scopes: string[];
  connectedAt: string | null;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  syncFrequency: string;
  lastError: string | null;
  lastErrorAt: string | null;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
} | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No integration found
    }
    throw new Error(`Failed to get integration: ${error.message}`);
  }

  return {
    id: data.id,
    organizationId: data.organization_id,
    provider: data.provider,
    providerName: data.provider_name,
    status: data.status,
    isActive: data.is_active,
    credentials: data.credentials,
    config: data.config || {},
    scopes: data.scopes || [],
    connectedAt: data.connected_at,
    lastSyncAt: data.last_sync_at,
    nextSyncAt: data.next_sync_at,
    syncFrequency: data.sync_frequency,
    lastError: data.last_error,
    lastErrorAt: data.last_error_at,
    errorCount: data.error_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create or update integration
 */
export async function upsertIntegration(
  organizationId: string,
  provider: 'stripe' | 'quickbooks' | 'plaid' | 'sendgrid',
  data: {
    providerName: string;
    status?: string;
    isActive?: boolean;
    credentials?: IntegrationCredentials;
    config?: Record<string, unknown>;
    scopes?: string[];
    connectedAt?: string;
    syncFrequency?: string;
  },
  createdBy?: string
): Promise<string> {
  const client = getSupabaseClient();

  const { data: result, error } = await client
    .from('integrations')
    .upsert(
      {
        organization_id: organizationId,
        provider,
        provider_name: data.providerName,
        status: data.status || 'connected',
        is_active: data.isActive ?? true,
        credentials: data.credentials,
        config: data.config || {},
        scopes: data.scopes || [],
        connected_at: data.connectedAt || new Date().toISOString(),
        sync_frequency: data.syncFrequency || 'daily',
        created_by: createdBy,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'organization_id,provider',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to upsert integration: ${error.message}`);
  }

  return result.id;
}

/**
 * Update integration credentials
 */
export async function updateIntegrationCredentials(
  organizationId: string,
  provider: string,
  credentials: IntegrationCredentials
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('integrations')
    .update({
      credentials,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .eq('provider', provider);

  if (error) {
    throw new Error(`Failed to update credentials: ${error.message}`);
  }
}

/**
 * Update integration status
 */
export async function updateIntegrationStatus(
  organizationId: string,
  provider: string,
  status: 'pending' | 'connected' | 'disconnected' | 'error',
  errorMessage?: string
): Promise<void> {
  const client = getSupabaseClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (errorMessage) {
    updateData.last_error = errorMessage;
    updateData.last_error_at = new Date().toISOString();
    updateData.error_count = client.rpc('increment', { row_id: organizationId });
  } else {
    updateData.error_count = 0;
  }

  const { error } = await client
    .from('integrations')
    .update(updateData)
    .eq('organization_id', organizationId)
    .eq('provider', provider);

  if (error) {
    throw new Error(`Failed to update integration status: ${error.message}`);
  }
}

/**
 * Update last sync timestamp
 */
export async function updateLastSync(
  organizationId: string,
  provider: string,
  nextSyncAt?: string
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      next_sync_at: nextSyncAt,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .eq('provider', provider);

  if (error) {
    throw new Error(`Failed to update last sync: ${error.message}`);
  }
}

/**
 * Create sync log entry
 */
export async function createSyncLog(
  integrationId: string,
  syncType: 'full' | 'incremental' | 'manual',
  status: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial'
): Promise<string> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('sync_logs')
    .insert({
      integration_id: integrationId,
      sync_type: syncType,
      status,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create sync log: ${error.message}`);
  }

  return data.id;
}

/**
 * Update sync log entry
 */
export async function updateSyncLog(
  syncLogId: string,
  data: {
    status?: 'started' | 'in_progress' | 'completed' | 'failed' | 'partial';
    recordsProcessed?: number;
    recordsCreated?: number;
    recordsUpdated?: number;
    recordsFailed?: number;
    errorMessage?: string;
    errorDetails?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const client = getSupabaseClient();

  const updateData: Record<string, unknown> = {};

  if (data.status) updateData.status = data.status;
  if (data.recordsProcessed !== undefined) updateData.records_processed = data.recordsProcessed;
  if (data.recordsCreated !== undefined) updateData.records_created = data.recordsCreated;
  if (data.recordsUpdated !== undefined) updateData.records_updated = data.recordsUpdated;
  if (data.recordsFailed !== undefined) updateData.records_failed = data.recordsFailed;
  if (data.errorMessage) updateData.error_message = data.errorMessage;
  if (data.errorDetails) updateData.error_details = data.errorDetails;
  if (data.metadata) updateData.metadata = data.metadata;

  if (data.status === 'completed' || data.status === 'failed' || data.status === 'partial') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await client
    .from('sync_logs')
    .update(updateData)
    .eq('id', syncLogId);

  if (error) {
    throw new Error(`Failed to update sync log: ${error.message}`);
  }
}

/**
 * Get client by external ID (QuickBooks or Stripe)
 */
export async function getClientByExternalId(
  organizationId: string,
  provider: 'quickbooks' | 'stripe',
  externalId: string
): Promise<{
  id: string;
  name: string;
  quickbooksId?: string;
  stripeCustomerId?: string;
} | null> {
  const client = getSupabaseClient();

  const column = provider === 'quickbooks' ? 'quickbooks_id' : 'stripe_customer_id';

  const { data, error } = await client
    .from('clients')
    .select('id, name, quickbooks_id, stripe_customer_id')
    .eq('organization_id', organizationId)
    .eq(column, externalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No client found
    }
    throw new Error(`Failed to get client by external ID: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    quickbooksId: data.quickbooks_id,
    stripeCustomerId: data.stripe_customer_id,
  };
}

/**
 * Update client external ID
 */
export async function updateClientExternalId(
  clientId: string,
  provider: 'quickbooks' | 'stripe',
  externalId: string
): Promise<void> {
  const client = getSupabaseClient();

  const column = provider === 'quickbooks' ? 'quickbooks_id' : 'stripe_customer_id';

  const { error } = await client
    .from('clients')
    .update({
      [column]: externalId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId);

  if (error) {
    throw new Error(`Failed to update client external ID: ${error.message}`);
  }
}

/**
 * Get transaction by external ID
 */
export async function getTransactionByExternalId(
  organizationId: string,
  provider: 'quickbooks' | 'stripe',
  externalId: string
): Promise<{ id: string } | null> {
  const client = getSupabaseClient();

  const column = provider === 'quickbooks' ? 'quickbooks_id' : 'stripe_transaction_id';

  const { data, error } = await client
    .from('transactions')
    .select('id')
    .eq('organization_id', organizationId)
    .eq(column, externalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get transaction by external ID: ${error.message}`);
  }

  return { id: data.id };
}

/**
 * Create transaction from integration
 */
export async function createTransactionFromIntegration(
  organizationId: string,
  clientId: string,
  provider: 'quickbooks' | 'stripe',
  data: {
    externalId: string;
    transactionDate: string;
    description: string;
    amount: number;
    transactionType: 'income' | 'expense' | 'transfer';
    category?: string;
    paymentMethod?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
  },
  createdBy?: string
): Promise<string> {
  const client = getSupabaseClient();

  const externalIdColumn = provider === 'quickbooks' ? 'quickbooks_id' : 'stripe_transaction_id';

  const { data: result, error } = await client
    .from('transactions')
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      transaction_date: data.transactionDate,
      description: data.description,
      amount: data.amount,
      transaction_type: data.transactionType,
      category: data.category,
      payment_method: data.paymentMethod,
      reference_number: data.reference,
      status: 'posted',
      [externalIdColumn]: data.externalId,
      metadata: data.metadata || {},
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return result.id;
}

/**
 * Get invoice by external ID
 */
export async function getInvoiceByExternalId(
  organizationId: string,
  provider: 'quickbooks' | 'stripe',
  externalId: string
): Promise<{ id: string } | null> {
  const client = getSupabaseClient();

  const column = provider === 'quickbooks' ? 'quickbooks_id' : 'stripe_invoice_id';

  const { data, error } = await client
    .from('invoices')
    .select('id')
    .eq('organization_id', organizationId)
    .eq(column, externalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get invoice by external ID: ${error.message}`);
  }

  return { id: data.id };
}

/**
 * Create invoice from integration
 */
export async function createInvoiceFromIntegration(
  organizationId: string,
  clientId: string,
  provider: 'quickbooks' | 'stripe',
  data: {
    externalId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    amountPaid: number;
    status: string;
    lineItems: Array<{ description: string; quantity: number; rate: number; amount: number }>;
    metadata?: Record<string, unknown>;
  },
  createdBy?: string
): Promise<string> {
  const client = getSupabaseClient();

  const externalIdColumn = provider === 'quickbooks' ? 'quickbooks_id' : 'stripe_invoice_id';

  const { data: result, error } = await client
    .from('invoices')
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      invoice_number: data.invoiceNumber,
      invoice_date: data.invoiceDate,
      due_date: data.dueDate,
      subtotal: data.subtotal,
      tax_amount: data.taxAmount,
      total_amount: data.totalAmount,
      amount_paid: data.amountPaid,
      status: data.status,
      line_items: data.lineItems,
      [externalIdColumn]: data.externalId,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create invoice: ${error.message}`);
  }

  return result.id;
}

/**
 * Update invoice external ID
 */
export async function updateInvoiceExternalId(
  invoiceId: string,
  provider: 'quickbooks' | 'stripe',
  externalId: string
): Promise<void> {
  const client = getSupabaseClient();

  const column = provider === 'quickbooks' ? 'quickbooks_id' : 'stripe_invoice_id';

  const { error } = await client
    .from('invoices')
    .update({
      [column]: externalId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  if (error) {
    throw new Error(`Failed to update invoice external ID: ${error.message}`);
  }
}
