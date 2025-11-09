/**
 * POST /api/integrations/stripe/webhooks
 * Handle Stripe webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWebhookEvent } from '@/lib/integrations/stripe/webhook-handler';
import { IntegrationErrorHandler } from '@/lib/integrations/integration-errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const result = await processWebhookEvent(body, signature);

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      eventType: result.eventType,
      processed: result.processed,
    });
  } catch (error) {
    const integrationError = IntegrationErrorHandler.parseError(error, { provider: 'stripe' });
    IntegrationErrorHandler.logError(integrationError);

    return NextResponse.json(
      {
        success: false,
        error: integrationError.message,
      },
      { status: integrationError.statusCode }
    );
  }
}
