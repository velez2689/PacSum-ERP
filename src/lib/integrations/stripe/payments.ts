/**
 * Stripe Payments Module
 * CRUD operations for payment management
 */

import Stripe from 'stripe';
import { executeStripeRequest } from './client';
import {
  StripeCustomer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  StripePaymentMethod,
  StripeInvoice,
  CreateInvoiceRequest,
} from './types';
import { InvalidRequestError } from '../integration-errors';
import { generateIdempotencyKey } from '../utils';

/**
 * Create a customer
 */
export async function createCustomer(
  request: CreateCustomerRequest,
  organizationId: string
): Promise<StripeCustomer> {
  const idempotencyKey = generateIdempotencyKey(
    'create_customer',
    organizationId,
    request.email || 'no-email'
  );

  const customer = await executeStripeRequest<Stripe.Customer>(
    async (stripe) => {
      const params: Stripe.CustomerCreateParams = {
        metadata: {
          organization_id: organizationId,
          ...(request.metadata || {}),
        },
      };

      if (request.email) params.email = request.email;
      if (request.name) params.name = request.name;
      if (request.phone) params.phone = request.phone;
      if (request.description) params.description = request.description;
      if (request.paymentMethod) params.payment_method = request.paymentMethod;
      if (request.invoiceSettings) params.invoice_settings = request.invoiceSettings;

      return stripe.customers.create(params);
    },
    { idempotencyKey }
  );

  return mapStripeCustomer(customer);
}

/**
 * Retrieve a customer
 */
export async function getCustomer(customerId: string): Promise<StripeCustomer> {
  if (!customerId) {
    throw new InvalidRequestError('Customer ID is required');
  }

  const customer = await executeStripeRequest<Stripe.Customer>(
    async (stripe) => stripe.customers.retrieve(customerId)
  );

  return mapStripeCustomer(customer);
}

/**
 * Update a customer
 */
export async function updateCustomer(
  request: UpdateCustomerRequest
): Promise<StripeCustomer> {
  if (!request.customerId) {
    throw new InvalidRequestError('Customer ID is required');
  }

  const customer = await executeStripeRequest<Stripe.Customer>(
    async (stripe) => {
      const params: Stripe.CustomerUpdateParams = {};

      if (request.email) params.email = request.email;
      if (request.name) params.name = request.name;
      if (request.phone) params.phone = request.phone;
      if (request.description) params.description = request.description;
      if (request.metadata) params.metadata = request.metadata;
      if (request.defaultSource) params.default_source = request.defaultSource;

      return stripe.customers.update(request.customerId, params);
    }
  );

  return mapStripeCustomer(customer);
}

/**
 * Delete a customer
 */
export async function deleteCustomer(customerId: string): Promise<{ deleted: boolean }> {
  if (!customerId) {
    throw new InvalidRequestError('Customer ID is required');
  }

  const result = await executeStripeRequest<Stripe.DeletedCustomer>(
    async (stripe) => stripe.customers.del(customerId)
  );

  return { deleted: result.deleted };
}

/**
 * List customers
 */
export async function listCustomers(options: {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  email?: string;
  created?: {
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
  };
}): Promise<{
  data: StripeCustomer[];
  hasMore: boolean;
}> {
  const result = await executeStripeRequest<Stripe.ApiList<Stripe.Customer>>(
    async (stripe) => {
      const params: Stripe.CustomerListParams = {
        limit: options.limit || 100,
      };

      if (options.startingAfter) params.starting_after = options.startingAfter;
      if (options.endingBefore) params.ending_before = options.endingBefore;
      if (options.email) params.email = options.email;
      if (options.created) params.created = options.created;

      return stripe.customers.list(params);
    }
  );

  return {
    data: result.data.map(mapStripeCustomer),
    hasMore: result.has_more,
  };
}

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<StripePaymentMethod> {
  if (!paymentMethodId || !customerId) {
    throw new InvalidRequestError('Payment method ID and customer ID are required');
  }

  const paymentMethod = await executeStripeRequest<Stripe.PaymentMethod>(
    async (stripe) =>
      stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
  );

  return mapStripePaymentMethod(paymentMethod);
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<StripePaymentMethod> {
  if (!paymentMethodId) {
    throw new InvalidRequestError('Payment method ID is required');
  }

  const paymentMethod = await executeStripeRequest<Stripe.PaymentMethod>(
    async (stripe) => stripe.paymentMethods.detach(paymentMethodId)
  );

  return mapStripePaymentMethod(paymentMethod);
}

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: 'card' | 'us_bank_account' = 'card'
): Promise<StripePaymentMethod[]> {
  if (!customerId) {
    throw new InvalidRequestError('Customer ID is required');
  }

  const result = await executeStripeRequest<Stripe.ApiList<Stripe.PaymentMethod>>(
    async (stripe) =>
      stripe.paymentMethods.list({
        customer: customerId,
        type,
      })
  );

  return result.data.map(mapStripePaymentMethod);
}

/**
 * Create an invoice
 */
export async function createInvoice(
  request: CreateInvoiceRequest,
  organizationId: string
): Promise<StripeInvoice> {
  if (!request.customerId) {
    throw new InvalidRequestError('Customer ID is required');
  }

  if (!request.lineItems || request.lineItems.length === 0) {
    throw new InvalidRequestError('At least one line item is required');
  }

  const idempotencyKey = generateIdempotencyKey(
    'create_invoice',
    organizationId,
    request.customerId
  );

  // First, create invoice items
  for (const item of request.lineItems) {
    await executeStripeRequest<Stripe.InvoiceItem>(
      async (stripe) =>
        stripe.invoiceItems.create({
          customer: request.customerId,
          description: item.description,
          amount: item.amount,
          quantity: item.quantity || 1,
          currency: item.currency || 'usd',
        })
    );
  }

  // Then create the invoice
  const invoice = await executeStripeRequest<Stripe.Invoice>(
    async (stripe) => {
      const params: Stripe.InvoiceCreateParams = {
        customer: request.customerId,
      };

      if (request.description) params.description = request.description;
      if (request.metadata) params.metadata = request.metadata;
      if (request.dueDate) params.due_date = request.dueDate;
      if (request.collectionMethod) params.collection_method = request.collectionMethod;

      return stripe.invoices.create(params);
    },
    { idempotencyKey }
  );

  return mapStripeInvoice(invoice);
}

/**
 * Retrieve an invoice
 */
export async function getInvoice(invoiceId: string): Promise<StripeInvoice> {
  if (!invoiceId) {
    throw new InvalidRequestError('Invoice ID is required');
  }

  const invoice = await executeStripeRequest<Stripe.Invoice>(
    async (stripe) => stripe.invoices.retrieve(invoiceId)
  );

  return mapStripeInvoice(invoice);
}

/**
 * Finalize an invoice (make it payable)
 */
export async function finalizeInvoice(invoiceId: string): Promise<StripeInvoice> {
  if (!invoiceId) {
    throw new InvalidRequestError('Invoice ID is required');
  }

  const invoice = await executeStripeRequest<Stripe.Invoice>(
    async (stripe) => stripe.invoices.finalizeInvoice(invoiceId)
  );

  return mapStripeInvoice(invoice);
}

/**
 * Pay an invoice
 */
export async function payInvoice(
  invoiceId: string,
  paymentMethod?: string
): Promise<StripeInvoice> {
  if (!invoiceId) {
    throw new InvalidRequestError('Invoice ID is required');
  }

  const invoice = await executeStripeRequest<Stripe.Invoice>(
    async (stripe) => {
      const params: Stripe.InvoicePayParams = {};
      if (paymentMethod) params.payment_method = paymentMethod;

      return stripe.invoices.pay(invoiceId, params);
    }
  );

  return mapStripeInvoice(invoice);
}

/**
 * Void an invoice
 */
export async function voidInvoice(invoiceId: string): Promise<StripeInvoice> {
  if (!invoiceId) {
    throw new InvalidRequestError('Invoice ID is required');
  }

  const invoice = await executeStripeRequest<Stripe.Invoice>(
    async (stripe) => stripe.invoices.voidInvoice(invoiceId)
  );

  return mapStripeInvoice(invoice);
}

/**
 * List invoices
 */
export async function listInvoices(options: {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  customer?: string;
  status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  created?: {
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
  };
}): Promise<{
  data: StripeInvoice[];
  hasMore: boolean;
}> {
  const result = await executeStripeRequest<Stripe.ApiList<Stripe.Invoice>>(
    async (stripe) => {
      const params: Stripe.InvoiceListParams = {
        limit: options.limit || 100,
      };

      if (options.startingAfter) params.starting_after = options.startingAfter;
      if (options.endingBefore) params.ending_before = options.endingBefore;
      if (options.customer) params.customer = options.customer;
      if (options.status) params.status = options.status;
      if (options.created) params.created = options.created;

      return stripe.invoices.list(params);
    }
  );

  return {
    data: result.data.map(mapStripeInvoice),
    hasMore: result.has_more,
  };
}

/**
 * Map Stripe Customer to our type
 */
function mapStripeCustomer(customer: Stripe.Customer): StripeCustomer {
  return {
    id: customer.id,
    email: customer.email || undefined,
    name: customer.name || undefined,
    phone: customer.phone || undefined,
    description: customer.description || undefined,
    metadata: customer.metadata || undefined,
    created: customer.created,
    balance: customer.balance,
    currency: customer.currency || undefined,
    defaultSource: typeof customer.default_source === 'string' ? customer.default_source : undefined,
  };
}

/**
 * Map Stripe PaymentMethod to our type
 */
function mapStripePaymentMethod(pm: Stripe.PaymentMethod): StripePaymentMethod {
  return {
    id: pm.id,
    type: pm.type as StripePaymentMethod['type'],
    customer: typeof pm.customer === 'string' ? pm.customer : pm.customer?.id,
    metadata: pm.metadata || undefined,
    billingDetails: pm.billing_details
      ? {
          name: pm.billing_details.name || undefined,
          email: pm.billing_details.email || undefined,
          phone: pm.billing_details.phone || undefined,
          address: pm.billing_details.address
            ? {
                line1: pm.billing_details.address.line1 || undefined,
                line2: pm.billing_details.address.line2 || undefined,
                city: pm.billing_details.address.city || undefined,
                state: pm.billing_details.address.state || undefined,
                postalCode: pm.billing_details.address.postal_code || undefined,
                country: pm.billing_details.address.country || undefined,
              }
            : undefined,
        }
      : undefined,
    card: pm.card
      ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
          funding: pm.card.funding as 'credit' | 'debit' | 'prepaid' | 'unknown',
        }
      : undefined,
    created: pm.created,
  };
}

/**
 * Map Stripe Invoice to our type
 */
function mapStripeInvoice(invoice: Stripe.Invoice): StripeInvoice {
  return {
    id: invoice.id,
    customer: typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || '',
    number: invoice.number || undefined,
    status: invoice.status || 'draft',
    currency: invoice.currency,
    description: invoice.description || undefined,
    metadata: invoice.metadata || undefined,
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    amountRemaining: invoice.amount_remaining,
    subtotal: invoice.subtotal,
    tax: invoice.tax || undefined,
    total: invoice.total,
    dueDate: invoice.due_date || undefined,
    created: invoice.created,
    invoicePdf: invoice.invoice_pdf || undefined,
    hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
    lines: {
      data: invoice.lines.data.map((line) => ({
        id: line.id,
        amount: line.amount,
        currency: line.currency,
        description: line.description || undefined,
        quantity: line.quantity || undefined,
        unitAmount: line.unit_amount || undefined,
        metadata: line.metadata || undefined,
      })),
    },
    paid: invoice.paid,
    paymentIntent: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
  };
}
