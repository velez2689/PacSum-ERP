/**
 * Stripe Webhook Handler
 * Process Stripe webhook events
 */

import Stripe from 'stripe';
import { constructWebhookEvent } from './client';
import { StripeWebhookEvent, StripeWebhookHandlerResult, StripePaymentIntent, StripeRefund } from './types';
import { WebhookVerificationError, WebhookProcessingError } from '../integration-errors';
import {
  getClientByExternalId,
  createTransactionFromIntegration,
  getTransactionByExternalId,
} from '../db-helpers';
import { parseCurrencyFromApi } from '../utils';

/**
 * Webhook event handlers map
 */
type WebhookHandler = (event: Stripe.Event) => Promise<StripeWebhookHandlerResult>;

const webhookHandlers: Record<string, WebhookHandler> = {
  'payment_intent.succeeded': handlePaymentIntentSucceeded,
  'payment_intent.payment_failed': handlePaymentIntentFailed,
  'payment_intent.canceled': handlePaymentIntentCanceled,
  'charge.succeeded': handleChargeSucceeded,
  'charge.failed': handleChargeFailed,
  'charge.refunded': handleChargeRefunded,
  'customer.created': handleCustomerCreated,
  'customer.updated': handleCustomerUpdated,
  'customer.deleted': handleCustomerDeleted,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'refund.created': handleRefundCreated,
};

/**
 * Process webhook event
 */
export async function processWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret?: string
): Promise<StripeWebhookHandlerResult> {
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = constructWebhookEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook verification failed';
    throw new WebhookVerificationError(message, { provider: 'stripe' });
  }

  // Log webhook event
  console.log('[Stripe Webhook] Received event:', {
    id: event.id,
    type: event.type,
    created: new Date(event.created * 1000).toISOString(),
  });

  // Get handler for event type
  const handler = webhookHandlers[event.type];

  if (!handler) {
    // Event type not handled, but don't throw error
    console.log('[Stripe Webhook] Unhandled event type:', event.type);
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      processed: false,
    };
  }

  try {
    // Process event
    const result = await handler(event);

    console.log('[Stripe Webhook] Event processed successfully:', {
      eventId: event.id,
      type: event.type,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';

    console.error('[Stripe Webhook] Event processing failed:', {
      eventId: event.id,
      type: event.type,
      error: message,
    });

    throw new WebhookProcessingError(
      message,
      {
        provider: 'stripe',
        operation: 'webhook_processing',
        metadata: {
          eventId: event.id,
          eventType: event.type,
        },
      },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Handle payment_intent.succeeded
 */
async function handlePaymentIntentSucceeded(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  // Extract organization and client IDs from metadata
  const organizationId = paymentIntent.metadata?.organization_id;
  const clientId = paymentIntent.metadata?.client_id;

  if (!organizationId) {
    console.warn('[Stripe Webhook] Missing organization_id in payment intent metadata');
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      processed: false,
      error: 'Missing organization_id in metadata',
    };
  }

  // Check if transaction already exists
  const existingTransaction = await getTransactionByExternalId(
    organizationId,
    'stripe',
    paymentIntent.id
  );

  if (existingTransaction) {
    console.log('[Stripe Webhook] Transaction already exists:', existingTransaction.id);
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      processed: true,
      data: { transactionId: existingTransaction.id },
    };
  }

  // Create transaction in database
  let targetClientId = clientId;

  // If no client ID, try to find client by Stripe customer ID
  if (!targetClientId && paymentIntent.customer) {
    const customerId = typeof paymentIntent.customer === 'string'
      ? paymentIntent.customer
      : paymentIntent.customer.id;

    const client = await getClientByExternalId(organizationId, 'stripe', customerId);
    if (client) {
      targetClientId = client.id;
    }
  }

  if (!targetClientId) {
    console.warn('[Stripe Webhook] No client found for payment intent');
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      processed: false,
      error: 'No client found',
    };
  }

  const amount = parseCurrencyFromApi(paymentIntent.amount, paymentIntent.currency);

  const transactionId = await createTransactionFromIntegration(
    organizationId,
    targetClientId,
    'stripe',
    {
      externalId: paymentIntent.id,
      transactionDate: new Date(paymentIntent.created * 1000).toISOString(),
      description: paymentIntent.description || 'Stripe payment',
      amount,
      transactionType: 'income',
      category: 'SALES',
      paymentMethod: 'credit_card',
      reference: paymentIntent.id,
      metadata: paymentIntent.metadata || {},
    }
  );

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { transactionId, paymentIntentId: paymentIntent.id },
  };
}

/**
 * Handle payment_intent.payment_failed
 */
async function handlePaymentIntentFailed(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.error('[Stripe Webhook] Payment failed:', {
    paymentIntentId: paymentIntent.id,
    error: paymentIntent.last_payment_error?.message,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    },
  };
}

/**
 * Handle payment_intent.canceled
 */
async function handlePaymentIntentCanceled(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  console.log('[Stripe Webhook] Payment canceled:', {
    paymentIntentId: paymentIntent.id,
    reason: paymentIntent.cancellation_reason,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: {
      paymentIntentId: paymentIntent.id,
      reason: paymentIntent.cancellation_reason,
    },
  };
}

/**
 * Handle charge.succeeded
 */
async function handleChargeSucceeded(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const charge = event.data.object as Stripe.Charge;

  console.log('[Stripe Webhook] Charge succeeded:', {
    chargeId: charge.id,
    amount: charge.amount,
    currency: charge.currency,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { chargeId: charge.id },
  };
}

/**
 * Handle charge.failed
 */
async function handleChargeFailed(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const charge = event.data.object as Stripe.Charge;

  console.error('[Stripe Webhook] Charge failed:', {
    chargeId: charge.id,
    failureCode: charge.failure_code,
    failureMessage: charge.failure_message,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: {
      chargeId: charge.id,
      failureCode: charge.failure_code,
      failureMessage: charge.failure_message,
    },
  };
}

/**
 * Handle charge.refunded
 */
async function handleChargeRefunded(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const charge = event.data.object as Stripe.Charge;

  // Extract organization ID from metadata
  const organizationId = charge.metadata?.organization_id;

  if (!organizationId) {
    console.warn('[Stripe Webhook] Missing organization_id in charge metadata');
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      processed: false,
      error: 'Missing organization_id in metadata',
    };
  }

  // Get original transaction
  const originalTransaction = await getTransactionByExternalId(
    organizationId,
    'stripe',
    charge.payment_intent as string || charge.id
  );

  if (!originalTransaction) {
    console.warn('[Stripe Webhook] Original transaction not found');
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
      processed: false,
      error: 'Original transaction not found',
    };
  }

  // Create refund transaction
  const refundAmount = parseCurrencyFromApi(charge.amount_refunded, charge.currency);

  const refunds = charge.refunds?.data || [];

  for (const refund of refunds) {
    // Check if refund transaction already exists
    const existingRefund = await getTransactionByExternalId(
      organizationId,
      'stripe',
      refund.id
    );

    if (existingRefund) {
      continue;
    }

    const refundTransactionAmount = parseCurrencyFromApi(refund.amount, charge.currency);

    await createTransactionFromIntegration(
      organizationId,
      originalTransaction.id,
      'stripe',
      {
        externalId: refund.id,
        transactionDate: new Date(refund.created * 1000).toISOString(),
        description: `Refund: ${charge.description || 'Stripe payment'}`,
        amount: -refundTransactionAmount, // Negative for refund
        transactionType: 'expense',
        category: 'OTHER_EXPENSE',
        reference: refund.id,
        metadata: {
          original_charge_id: charge.id,
          refund_reason: refund.reason,
          ...(refund.metadata || {}),
        },
      }
    );
  }

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { chargeId: charge.id, refundCount: refunds.length },
  };
}

/**
 * Handle customer.created
 */
async function handleCustomerCreated(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const customer = event.data.object as Stripe.Customer;

  console.log('[Stripe Webhook] Customer created:', {
    customerId: customer.id,
    email: customer.email,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { customerId: customer.id },
  };
}

/**
 * Handle customer.updated
 */
async function handleCustomerUpdated(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const customer = event.data.object as Stripe.Customer;

  console.log('[Stripe Webhook] Customer updated:', {
    customerId: customer.id,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { customerId: customer.id },
  };
}

/**
 * Handle customer.deleted
 */
async function handleCustomerDeleted(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const customer = event.data.object as Stripe.Customer;

  console.log('[Stripe Webhook] Customer deleted:', {
    customerId: customer.id,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { customerId: customer.id },
  };
}

/**
 * Handle invoice.paid
 */
async function handleInvoicePaid(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const invoice = event.data.object as Stripe.Invoice;

  console.log('[Stripe Webhook] Invoice paid:', {
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { invoiceId: invoice.id },
  };
}

/**
 * Handle invoice.payment_failed
 */
async function handleInvoicePaymentFailed(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const invoice = event.data.object as Stripe.Invoice;

  console.error('[Stripe Webhook] Invoice payment failed:', {
    invoiceId: invoice.id,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { invoiceId: invoice.id },
  };
}

/**
 * Handle refund.created
 */
async function handleRefundCreated(
  event: Stripe.Event
): Promise<StripeWebhookHandlerResult> {
  const refund = event.data.object as Stripe.Refund;

  console.log('[Stripe Webhook] Refund created:', {
    refundId: refund.id,
    amount: refund.amount,
    status: refund.status,
  });

  return {
    success: true,
    eventType: event.type,
    eventId: event.id,
    processed: true,
    data: { refundId: refund.id },
  };
}

/**
 * Get list of supported webhook event types
 */
export function getSupportedWebhookEventTypes(): string[] {
  return Object.keys(webhookHandlers);
}

/**
 * Validate webhook event type
 */
export function isSupportedWebhookEventType(eventType: string): boolean {
  return eventType in webhookHandlers;
}
