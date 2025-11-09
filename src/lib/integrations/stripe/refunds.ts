/**
 * Stripe Refunds Module
 * Handle refund operations
 */

import Stripe from 'stripe';
import { executeStripeRequest } from './client';
import { CreateRefundRequest, StripeRefund } from './types';
import { InvalidRequestError } from '../integration-errors';
import { generateIdempotencyKey, formatCurrencyForApi } from '../utils';

/**
 * Create a refund
 */
export async function createRefund(
  request: CreateRefundRequest
): Promise<StripeRefund> {
  // Validate request - must have either charge ID or payment intent ID
  if (!request.chargeId && !request.paymentIntentId) {
    throw new InvalidRequestError('Either charge ID or payment intent ID is required');
  }

  // Generate idempotency key
  const idempotencyKey = generateIdempotencyKey(
    'create_refund',
    request.organizationId,
    request.chargeId || request.paymentIntentId || 'unknown'
  );

  const refund = await executeStripeRequest<Stripe.Refund>(
    async (stripe) => {
      const params: Stripe.RefundCreateParams = {};

      // Set charge or payment intent
      if (request.chargeId) {
        params.charge = request.chargeId;
      } else if (request.paymentIntentId) {
        params.payment_intent = request.paymentIntentId;
      }

      // Add amount if partial refund
      if (request.amount !== undefined) {
        params.amount = request.amount;
      }

      // Add reason
      if (request.reason) {
        params.reason = request.reason;
      }

      // Add metadata
      if (request.metadata || request.userId) {
        params.metadata = {
          organization_id: request.organizationId,
          ...(request.userId && { user_id: request.userId }),
          ...(request.metadata || {}),
        };
      }

      return stripe.refunds.create(params);
    },
    { idempotencyKey }
  );

  return mapStripeRefund(refund);
}

/**
 * Retrieve a refund
 */
export async function getRefund(refundId: string): Promise<StripeRefund> {
  if (!refundId) {
    throw new InvalidRequestError('Refund ID is required');
  }

  const refund = await executeStripeRequest<Stripe.Refund>(
    async (stripe) => stripe.refunds.retrieve(refundId)
  );

  return mapStripeRefund(refund);
}

/**
 * Update a refund metadata
 */
export async function updateRefund(
  refundId: string,
  metadata: Record<string, string>
): Promise<StripeRefund> {
  if (!refundId) {
    throw new InvalidRequestError('Refund ID is required');
  }

  const refund = await executeStripeRequest<Stripe.Refund>(
    async (stripe) =>
      stripe.refunds.update(refundId, { metadata })
  );

  return mapStripeRefund(refund);
}

/**
 * Cancel a refund (only works for pending refunds)
 */
export async function cancelRefund(refundId: string): Promise<StripeRefund> {
  if (!refundId) {
    throw new InvalidRequestError('Refund ID is required');
  }

  const refund = await executeStripeRequest<Stripe.Refund>(
    async (stripe) => stripe.refunds.cancel(refundId)
  );

  return mapStripeRefund(refund);
}

/**
 * List refunds
 */
export async function listRefunds(options: {
  limit?: number;
  startingAfter?: string;
  endingBefore?: string;
  charge?: string;
  paymentIntent?: string;
  created?: {
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
  };
}): Promise<{
  data: StripeRefund[];
  hasMore: boolean;
}> {
  const result = await executeStripeRequest<Stripe.ApiList<Stripe.Refund>>(
    async (stripe) => {
      const params: Stripe.RefundListParams = {
        limit: options.limit || 100,
      };

      if (options.startingAfter) params.starting_after = options.startingAfter;
      if (options.endingBefore) params.ending_before = options.endingBefore;
      if (options.charge) params.charge = options.charge;
      if (options.paymentIntent) params.payment_intent = options.paymentIntent;
      if (options.created) params.created = options.created;

      return stripe.refunds.list(params);
    }
  );

  return {
    data: result.data.map(mapStripeRefund),
    hasMore: result.has_more,
  };
}

/**
 * Get refunds for a specific charge
 */
export async function getRefundsForCharge(chargeId: string): Promise<StripeRefund[]> {
  if (!chargeId) {
    throw new InvalidRequestError('Charge ID is required');
  }

  const result = await listRefunds({ charge: chargeId, limit: 100 });
  return result.data;
}

/**
 * Get refunds for a specific payment intent
 */
export async function getRefundsForPaymentIntent(
  paymentIntentId: string
): Promise<StripeRefund[]> {
  if (!paymentIntentId) {
    throw new InvalidRequestError('Payment intent ID is required');
  }

  const result = await listRefunds({ paymentIntent: paymentIntentId, limit: 100 });
  return result.data;
}

/**
 * Check if a charge is fully refunded
 */
export async function isChargeFullyRefunded(chargeId: string): Promise<boolean> {
  if (!chargeId) {
    throw new InvalidRequestError('Charge ID is required');
  }

  const charge = await executeStripeRequest<Stripe.Charge>(
    async (stripe) => stripe.charges.retrieve(chargeId)
  );

  return charge.refunded;
}

/**
 * Get total refunded amount for a charge
 */
export async function getTotalRefundedAmount(chargeId: string): Promise<number> {
  if (!chargeId) {
    throw new InvalidRequestError('Charge ID is required');
  }

  const charge = await executeStripeRequest<Stripe.Charge>(
    async (stripe) => stripe.charges.retrieve(chargeId)
  );

  return charge.amount_refunded;
}

/**
 * Create partial refund with specific amount
 */
export async function createPartialRefund(
  chargeOrPaymentIntentId: string,
  amount: number,
  currency: string,
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  organizationId: string,
  metadata?: Record<string, string>
): Promise<StripeRefund> {
  if (amount <= 0) {
    throw new InvalidRequestError('Refund amount must be greater than 0');
  }

  // Convert amount to cents
  const amountInCents = formatCurrencyForApi(amount, currency);

  // Determine if it's a charge or payment intent
  const isCharge = chargeOrPaymentIntentId.startsWith('ch_');
  const isPaymentIntent = chargeOrPaymentIntentId.startsWith('pi_');

  if (!isCharge && !isPaymentIntent) {
    throw new InvalidRequestError('Invalid charge or payment intent ID');
  }

  return createRefund({
    chargeId: isCharge ? chargeOrPaymentIntentId : undefined,
    paymentIntentId: isPaymentIntent ? chargeOrPaymentIntentId : undefined,
    amount: amountInCents,
    reason,
    organizationId,
    metadata,
  });
}

/**
 * Create full refund
 */
export async function createFullRefund(
  chargeOrPaymentIntentId: string,
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  organizationId: string,
  metadata?: Record<string, string>
): Promise<StripeRefund> {
  // Determine if it's a charge or payment intent
  const isCharge = chargeOrPaymentIntentId.startsWith('ch_');
  const isPaymentIntent = chargeOrPaymentIntentId.startsWith('pi_');

  if (!isCharge && !isPaymentIntent) {
    throw new InvalidRequestError('Invalid charge or payment intent ID');
  }

  return createRefund({
    chargeId: isCharge ? chargeOrPaymentIntentId : undefined,
    paymentIntentId: isPaymentIntent ? chargeOrPaymentIntentId : undefined,
    reason,
    organizationId,
    metadata,
  });
}

/**
 * Map Stripe Refund to our type
 */
function mapStripeRefund(refund: Stripe.Refund): StripeRefund {
  return {
    id: refund.id,
    amount: refund.amount,
    currency: refund.currency,
    charge: typeof refund.charge === 'string' ? refund.charge : refund.charge?.id || '',
    paymentIntent: typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id,
    status: refund.status,
    reason: refund.reason || undefined,
    metadata: refund.metadata || undefined,
    created: refund.created,
    receiptNumber: refund.receipt_number || undefined,
  };
}
