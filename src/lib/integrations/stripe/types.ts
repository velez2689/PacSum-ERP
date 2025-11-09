/**
 * Stripe Integration Types
 * TypeScript interfaces for Stripe integration
 */

export interface StripeCustomer {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
  created: number;
  balance: number;
  currency?: string;
  defaultSource?: string;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: StripePaymentIntentStatus;
  clientSecret?: string;
  customer?: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethod?: string;
  receiptEmail?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
  captureMethod?: 'automatic' | 'manual';
  confirmationMethod?: 'automatic' | 'manual';
  created: number;
  charges?: {
    data: StripeCharge[];
  };
  canceledAt?: number;
  cancellationReason?: string;
  lastPaymentError?: StripeError;
}

export type StripePaymentIntentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  customer?: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethod?: string;
  receiptUrl?: string;
  receiptEmail?: string;
  refunded: boolean;
  refunds?: {
    data: StripeRefund[];
  };
  created: number;
  paid: boolean;
  failureCode?: string;
  failureMessage?: string;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: StripeAddress;
  };
}

export interface StripeRefund {
  id: string;
  amount: number;
  currency: string;
  charge: string;
  paymentIntent?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | null;
  metadata?: Record<string, string>;
  created: number;
  receiptNumber?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'us_bank_account' | 'sepa_debit' | 'ideal' | 'other';
  customer?: string;
  metadata?: Record<string, string>;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: StripeAddress;
  };
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    funding: 'credit' | 'debit' | 'prepaid' | 'unknown';
  };
  created: number;
}

export interface StripeInvoice {
  id: string;
  customer: string;
  number?: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  subtotal: number;
  tax?: number;
  total: number;
  dueDate?: number;
  created: number;
  invoicePdf?: string;
  hostedInvoiceUrl?: string;
  lines: {
    data: StripeInvoiceLineItem[];
  };
  paid: boolean;
  paymentIntent?: string;
}

export interface StripeInvoiceLineItem {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  quantity?: number;
  unitAmount?: number;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  canceledAt?: number;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, string>;
  items: {
    data: StripeSubscriptionItem[];
  };
}

export interface StripeSubscriptionItem {
  id: string;
  price: {
    id: string;
    currency: string;
    unitAmount: number;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount: number;
    };
  };
  quantity: number;
}

export interface StripeAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface StripeError {
  type: 'api_error' | 'card_error' | 'idempotency_error' | 'invalid_request_error' | 'rate_limit_error' | 'authentication_error';
  code?: string;
  message: string;
  param?: string;
  declineCode?: string;
  charge?: string;
  paymentIntent?: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: StripeWebhookEventType;
  data: {
    object: unknown;
    previousAttributes?: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
  apiVersion?: string;
  request?: {
    id?: string;
    idempotencyKey?: string;
  };
}

export type StripeWebhookEventType =
  // Payment Intents
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.canceled'
  | 'payment_intent.processing'
  | 'payment_intent.created'
  | 'payment_intent.amount_capturable_updated'
  // Charges
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded'
  | 'charge.captured'
  | 'charge.updated'
  // Customers
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  // Invoices
  | 'invoice.created'
  | 'invoice.finalized'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.voided'
  // Subscriptions
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  // Payment Methods
  | 'payment_method.attached'
  | 'payment_method.detached'
  // Refunds
  | 'refund.created'
  | 'refund.updated';

/**
 * Request/Response Types
 */

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  customerId?: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethod?: string;
  setupFutureUsage?: 'on_session' | 'off_session';
  captureMethod?: 'automatic' | 'manual';
  receiptEmail?: string;
  statementDescriptor?: string;
  organizationId: string;
  clientId?: string;
  userId?: string;
}

export interface ConfirmPaymentIntentRequest {
  paymentIntentId: string;
  paymentMethod?: string;
  returnUrl?: string;
}

export interface CreateRefundRequest {
  chargeId?: string;
  paymentIntentId?: string;
  amount?: number;
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
  organizationId: string;
  userId?: string;
}

export interface CreateCustomerRequest {
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
  paymentMethod?: string;
  invoiceSettings?: {
    defaultPaymentMethod?: string;
  };
}

export interface UpdateCustomerRequest {
  customerId: string;
  email?: string;
  name?: string;
  phone?: string;
  description?: string;
  metadata?: Record<string, string>;
  defaultSource?: string;
}

export interface CreateInvoiceRequest {
  customerId: string;
  description?: string;
  metadata?: Record<string, string>;
  dueDate?: number;
  collectionMethod?: 'charge_automatically' | 'send_invoice';
  lineItems: Array<{
    description: string;
    amount: number;
    quantity?: number;
    currency?: string;
  }>;
}

export interface ListPaymentsRequest {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  customer?: string;
  created?: {
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
  };
}

export interface ListPaymentsResponse {
  data: StripePaymentIntent[];
  hasMore: boolean;
  total?: number;
}

export interface StripeWebhookHandlerResult {
  success: boolean;
  eventType: string;
  eventId: string;
  processed: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Internal mapping types
 */

export interface StripePaymentRecord {
  id: string;
  organizationId: string;
  clientId?: string;
  stripePaymentIntentId: string;
  stripeCustomerId?: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface StripeRefundRecord {
  id: string;
  organizationId: string;
  stripeRefundId: string;
  stripeChargeId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface StripeErrorResponse {
  error: {
    type: string;
    code?: string;
    message: string;
    param?: string;
  };
}
