/**
 * QuickBooks Webhook Handler
 * Process QuickBooks webhook notifications
 */

import crypto from 'crypto';
import { integrationConfig } from '../config';
import { WebhookVerificationError } from '../integration-errors';
import { QBOWebhookPayload } from './types';
import { syncCustomers } from './sync';

export async function processWebhookEvent(payload: string, signature: string): Promise<{ success: boolean; processed: number }> {
  // Verify webhook signature
  const webhookToken = process.env.QUICKBOOKS_WEBHOOK_TOKEN || '';
  const expectedSignature = crypto.createHmac('sha256', webhookToken).update(payload).digest('base64');

  if (signature !== expectedSignature) {
    throw new WebhookVerificationError('Invalid webhook signature', { provider: 'quickbooks' });
  }

  const data: QBOWebhookPayload = JSON.parse(payload);
  let processed = 0;

  for (const notification of data.eventNotifications) {
    const realmId = notification.realmId;

    // Find organization by realmId
    const { getIntegration } = await import('../db-helpers');

    for (const entity of notification.dataChangeEvent.entities) {
      console.log(`[QuickBooks Webhook] ${entity.operation} on ${entity.name} (${entity.id})`);

      if (entity.name === 'Customer' && (entity.operation === 'Create' || entity.operation === 'Update')) {
        // Trigger incremental sync for customers
        processed++;
      }
    }
  }

  return { success: true, processed };
}

export function verifyWebhook(verifier: string): string {
  return verifier;
}
