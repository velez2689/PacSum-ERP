/**
 * GET /api/integrations/quickbooks/oauth-callback
 * Handle QuickBooks OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeOAuthFlow } from '@/lib/integrations/quickbooks/oauth';
import { IntegrationErrorHandler } from '@/lib/integrations/integration-errors';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const realmId = searchParams.get('realmId');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      const errorDescription = searchParams.get('error_description');
      return NextResponse.redirect(
        new URL(`/integrations/error?message=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }

    if (!code || !realmId || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await completeOAuthFlow(code, realmId, state);

    const redirectUrl = result.returnUrl || '/integrations/quickbooks/success';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    const integrationError = IntegrationErrorHandler.parseError(error, { provider: 'quickbooks' });
    IntegrationErrorHandler.logError(integrationError);

    return NextResponse.redirect(
      new URL(`/integrations/error?message=${encodeURIComponent(integrationError.message)}`, request.url)
    );
  }
}
