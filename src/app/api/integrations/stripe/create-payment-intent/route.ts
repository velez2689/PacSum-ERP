/**
 * POST /api/integrations/stripe/create-payment-intent
 * Create a Stripe payment intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/integrations/stripe/payment-intents';
import { IntegrationErrorHandler } from '@/lib/integrations/integration-errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { amount, currency, customerId, customerEmail, description, metadata, organizationId, clientId, userId } = body;

    if (!amount || !organizationId) {
      return NextResponse.json(
        { error: 'Amount and organizationId are required' },
        { status: 400 }
      );
    }

    const paymentIntent = await createPaymentIntent({
      amount,
      currency: currency || 'usd',
      customerId,
      customerEmail,
      description,
      metadata,
      organizationId,
      clientId,
      userId,
    });

    return NextResponse.json({
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.clientSecret,
    });
  } catch (error) {
    const integrationError = IntegrationErrorHandler.parseError(error, { provider: 'stripe' });
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
