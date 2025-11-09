/**
 * Stripe Payment Intents Module
 * Create and confirm payment intents
 */

import Stripe from 'stripe';
import { executeStripeRequest, getStripeClient } from './client';
import {
  CreatePaymentIntentRequest,
  ConfirmPaymentIntentRequest,
  StripePaymentIntent,
} from './types';
import { generateIdempotencyKey, formatCurrencyForApi } from '../utils';
import { InvalidRequestError } from '../integration-errors';

/**
 * Create a payment intent
 */
export async function createPaymentIntent(
  request: CreatePaymentIntentRequest
): Promise<StripePaymentIntent> {
  // Validate request
  if (!request.amount || request.amount <= 0) {
    throw new InvalidRequestError('Payment amount must be greater than 0');
  }

  const currency = request.currency || 'usd';
  const amount = formatCurrencyForApi(request.amount, currency);

  // Generate idempotency key for safe retries
  const idempotencyKey = generateIdempotencyKey(
    'create_payment_intent',
    request.organizationId,
    request.clientId || 'unknown',
    String(amount),
    currency
  );

  // Prepare metadata
  const metadata: Record<string, string> = {
    organization_id: request.organizationId,
    ...(request.clientId && { client_id: request.clientId }),
    ...(request.userId && { user_id: request.userId }),
    ...(request.metadata || {}),
  };

  // Create payment intent via Stripe API
  const paymentIntent = await executeStripeRequest<Stripe.PaymentIntent>(
    async (stripe) => {
      const params: Stripe.PaymentIntentCreateParams = {
        amount,
        currency,
        metadata,
      };

      // Add optional parameters
      if (request.customerId) {
        params.customer = request.customerId;
      }

      if (request.description) {
        params.description = request.description;
      }

      if (request.paymentMethod) {
        params.payment_method = request.paymentMethod;
        params.confirm = true; // Auto-confirm if payment method provided
      }

      if (request.setupFutureUsage) {
        params.setup_future_usage = request.setupFutureUsage;
      }

      if (request.captureMethod) {
        params.capture_method = request.captureMethod;
      }

      if (request.receiptEmail) {
        params.receipt_email = request.receiptEmail;
      }

      if (request.statementDescriptor) {
        params.statement_descriptor = request.statementDescriptor;
      }

      // Automatic payment methods for better UX
      params.automatic_payment_methods = {
        enabled: true,
      };

      return stripe.paymentIntents.create(params);
    },
    { idempotencyKey }
  );

  return mapStripePaymentIntent(paymentIntent);
}

/**
 * Confirm a payment intent
 */
export async function confirmPaymentIntent(
  request: ConfirmPaymentIntentRequest
): Promise<StripePaymentIntent> {
  if (!request.paymentIntentId) {
    throw new InvalidRequestError('Payment intent ID is required');
  }

  const paymentIntent = await executeStripeRequest<Stripe.PaymentIntent>(
    async (stripe) => {
      const params: Stripe.PaymentIntentConfirmParams = {};

      if (request.paymentMethod) {
        params.payment_method = request.paymentMethod;
      }

      if (request.returnUrl) {
        params.return_url = request.returnUrl;
      }

      return stripe.paymentIntents.confirm(request.paymentIntentId, params);
    }
  );

  return mapStripePaymentIntent(paymentIntent);
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<StripePaymentIntent> {
  if (!paymentIntentId) {
    throw new InvalidRequestError('Payment intent ID is required');
  }

  const paymentIntent = await executeStripeRequest<Stripe.PaymentIntent>(
    async (stripe) => stripe.paymentIntents.retrieve(paymentIntentId)
  );

  return mapStripePaymentIntent(paymentIntent);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  cancellationReason?: string
): Promise<StripePaymentIntent> {
  if (!paymentIntentId) {
    throw new InvalidRequestError('Payment intent ID is required');
  }

  const paymentIntent = await executeStripeRequest<Stripe.PaymentIntent>(
    async (stripe) => {
      const params: Stripe.PaymentIntentCancelParams = {};

      if (cancellationReason) {
        params.cancellation_reason = cancellationReason as Stripe.PaymentIntentCancelParams.CancellationReason;
      }

      return stripe.paymentIntents.cancel(paymentIntentId, params);
    }
  );

  return mapStripePaymentIntent(paymentIntent);
}

/**
 * Capture a payment intent (for manual capture)
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<StripePaymentIntent> {
  if (!paymentIntentId) {
    throw new InvalidRequestError('Payment intent ID is required');
  }

  const paymentIntent = await executeStripeRequest<Stripe.PaymentIntent>(
    async (stripe) => {
      const params: Stripe.PaymentIntentCaptureParams = {};

      if (amountToCapture !== undefined) {
        params.amount_to_capture = amountToCapture;
      }

      return stripe.paymentIntents.capture(paymentIntentId, params);
    }
  );

  return mapStripePaymentIntent(paymentIntent);
}

/**
 * Update a payment intent
 */
export async function updatePaymentIntent(
  paymentIntentId: string,
  updates: {
    amount?: number;
    currency?: string;
    customerId?: string;
    description?: string;
    metadata?: Record<string, string>;
    receiptEmail?: string;
  }
): Promise<StripePaymentIntent> {
  if (!paymentIntentId) {
    throw new InvalidRequestError('Payment intent ID is required');
  }

  const paymentIntent = await executeStripeRequest<Stripe.PaymentIntent>(
    async (stripe) => {
      const params: Stripe.PaymentIntentUpdateParams = {};

      if (updates.amount !== undefined && updates.currency) {
        params.amount = formatCurrencyForApi(updates.amount, updates.currency);
      }

      if (updates.customerId) {
        params.customer = updates.customerId;
      }

      if (updates.description) {
        params.description = updates.description;
      }

      if (updates.metadata) {
        params.metadata = updates.metadata;
      }

      if (updates.receiptEmail) {
        params.receipt_email = updates.receiptEmail;
      }

      return stripe.paymentIntents.update(paymentIntentId, params);
    }
  );

  return mapStripePaymentIntent(paymentIntent);
}

/**
 * List payment intents with filters
 */
export async function listPaymentIntents(options: {
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
}): Promise<{
  data: StripePaymentIntent[];
  hasMore: boolean;
}> {
  const result = await executeStripeRequest<Stripe.ApiList<Stripe.PaymentIntent>>(
    async (stripe) => {
      const params: Stripe.PaymentIntentListParams = {
        limit: options.limit || 100,
      };

      if (options.startingAfter) {
        params.starting_after = options.startingAfter;
      }

      if (options.endingBefore) {
        params.ending_before = options.endingBefore;
      }

      if (options.customer) {
        params.customer = options.customer;
      }

      if (options.created) {
        params.created = options.created;
      }

      return stripe.paymentIntents.list(params);
    }
  );

  return {
    data: result.data.map(mapStripePaymentIntent),
    hasMore: result.has_more,
  };
}

/**
 * Search payment intents (requires Stripe API 2020-08-27 or later)
 */
export async function searchPaymentIntents(
  query: string,
  options?: {
    limit?: number;
    page?: string;
  }
): Promise<{
  data: StripePaymentIntent[];
  hasMore: boolean;
  nextPage?: string;
}> {
  const stripe = getStripeClient();

  const params: Stripe.PaymentIntentSearchParams = {
    query,
    limit: options?.limit || 100,
  };

  if (options?.page) {
    params.page = options.page;
  }

  const result = await stripe.paymentIntents.search(params);

  return {
    data: result.data.map(mapStripePaymentIntent),
    hasMore: result.has_more,
    nextPage: result.next_page || undefined,
  };
}

/**
 * Map Stripe PaymentIntent to our type
 */
function mapStripePaymentIntent(pi: Stripe.PaymentIntent): StripePaymentIntent {
  return {
    id: pi.id,
    amount: pi.amount,
    currency: pi.currency,
    status: pi.status as StripePaymentIntent['status'],
    clientSecret: pi.client_secret || undefined,
    customer: typeof pi.customer === 'string' ? pi.customer : pi.customer?.id,
    description: pi.description || undefined,
    metadata: pi.metadata || undefined,
    paymentMethod: typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id,
    receiptEmail: pi.receipt_email || undefined,
    setupFutureUsage: pi.setup_future_usage || undefined,
    captureMethod: pi.capture_method,
    confirmationMethod: pi.confirmation_method,
    created: pi.created,
    charges: pi.charges
      ? {
          data: pi.charges.data.map((charge) => ({
            id: charge.id,
            amount: charge.amount,
            currency: charge.currency,
            status: charge.status as 'succeeded' | 'pending' | 'failed',
            customer: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
            description: charge.description || undefined,
            metadata: charge.metadata || undefined,
            paymentMethod: typeof charge.payment_method === 'string' ? charge.payment_method : undefined,
            receiptUrl: charge.receipt_url || undefined,
            receiptEmail: charge.receipt_email || undefined,
            refunded: charge.refunded,
            created: charge.created,
            paid: charge.paid,
            failureCode: charge.failure_code || undefined,
            failureMessage: charge.failure_message || undefined,
          })),
        }
      : undefined,
    canceledAt: pi.canceled_at || undefined,
    cancellationReason: pi.cancellation_reason || undefined,
    lastPaymentError: pi.last_payment_error
      ? {
          type: pi.last_payment_error.type as StripePaymentIntent['lastPaymentError']['type'],
          code: pi.last_payment_error.code || undefined,
          message: pi.last_payment_error.message || 'Payment error',
          param: pi.last_payment_error.param || undefined,
          declineCode: pi.last_payment_error.decline_code || undefined,
        }
      : undefined,
  };
}
