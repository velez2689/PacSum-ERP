/**
 * QuickBooks OAuth 2.0 Flow
 * Handle OAuth authorization and token management
 */

import axios from 'axios';
import { integrationConfig } from '../config';
import { AuthenticationError, AuthorizationError } from '../integration-errors';
import { QBOAuthTokens, QBOAuthState } from './types';
import { upsertIntegration, updateIntegrationCredentials } from '../db-helpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate OAuth authorization URL
 */
export function generateAuthorizationUrl(
  organizationId: string,
  userId?: string,
  returnUrl?: string
): { url: string; state: string } {
  const config = integrationConfig.quickbooks;

  // Generate state for CSRF protection
  const nonce = uuidv4();
  const state: QBOAuthState = {
    organizationId,
    userId,
    returnUrl,
    nonce,
  };

  const stateParam = Buffer.from(JSON.stringify(state)).toString('base64');

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state: stateParam,
  });

  const url = `${config.authBaseUrl}/authorize?${params.toString()}`;

  return { url, state: stateParam };
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeAuthorizationCode(
  code: string,
  realmId: string
): Promise<QBOAuthTokens> {
  const config = integrationConfig.quickbooks;

  try {
    const response = await axios.post(
      `${config.authBaseUrl}/tokens/bearer`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        },
      }
    );

    const tokens: QBOAuthTokens = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
      x_refresh_token_expires_in: response.data.x_refresh_token_expires_in,
      realmId,
    };

    return tokens;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error_description || error.response?.data?.error || 'Failed to exchange authorization code';
      throw new AuthenticationError(
        message,
        { provider: 'quickbooks', statusCode: error.response?.status }
      );
    }

    throw new AuthenticationError(
      'Failed to exchange authorization code',
      { provider: 'quickbooks' }
    );
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<QBOAuthTokens> {
  const config = integrationConfig.quickbooks;

  try {
    const response = await axios.post(
      `${config.authBaseUrl}/tokens/bearer`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        },
      }
    );

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
      x_refresh_token_expires_in: response.data.x_refresh_token_expires_in,
      realmId: '', // Will be preserved from existing credentials
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error_description || error.response?.data?.error || 'Failed to refresh access token';
      throw new AuthenticationError(
        message,
        { provider: 'quickbooks', statusCode: error.response?.status }
      );
    }

    throw new AuthenticationError(
      'Failed to refresh access token',
      { provider: 'quickbooks' }
    );
  }
}

/**
 * Revoke refresh token (disconnect)
 */
export async function revokeToken(refreshToken: string): Promise<void> {
  const config = integrationConfig.quickbooks;

  try {
    await axios.post(
      `${config.authBaseUrl}/tokens/revoke`,
      new URLSearchParams({
        token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
        },
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.warn('[QuickBooks OAuth] Failed to revoke token:', error.response?.data);
    }
    // Don't throw error - token revocation is best effort
  }
}

/**
 * Complete OAuth flow and save credentials
 */
export async function completeOAuthFlow(
  code: string,
  realmId: string,
  stateParam: string
): Promise<{
  success: boolean;
  organizationId: string;
  returnUrl?: string;
}> {
  // Parse and validate state
  let state: QBOAuthState;
  try {
    const stateJson = Buffer.from(stateParam, 'base64').toString('utf-8');
    state = JSON.parse(stateJson);
  } catch (error) {
    throw new AuthorizationError(
      'Invalid state parameter',
      { provider: 'quickbooks' }
    );
  }

  if (!state.organizationId || !state.nonce) {
    throw new AuthorizationError(
      'Invalid state parameter',
      { provider: 'quickbooks' }
    );
  }

  // Exchange code for tokens
  const tokens = await exchangeAuthorizationCode(code, realmId);

  // Calculate token expiry
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Save credentials to database
  await upsertIntegration(
    state.organizationId,
    'quickbooks',
    {
      providerName: 'QuickBooks Online',
      status: 'connected',
      isActive: true,
      credentials: {
        provider: 'quickbooks',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type,
        expiresAt: expiresAt.toISOString(),
        realmId,
      },
      config: {
        environment: integrationConfig.quickbooks.environment,
      },
      scopes: integrationConfig.quickbooks.scopes,
      connectedAt: new Date().toISOString(),
    },
    state.userId
  );

  console.log('[QuickBooks OAuth] Successfully connected:', {
    organizationId: state.organizationId,
    realmId,
  });

  return {
    success: true,
    organizationId: state.organizationId,
    returnUrl: state.returnUrl,
  };
}

/**
 * Disconnect QuickBooks integration
 */
export async function disconnectQuickBooks(
  organizationId: string
): Promise<void> {
  const { getIntegration, updateIntegrationStatus } = await import('../db-helpers');

  const integration = await getIntegration(organizationId, 'quickbooks');

  if (integration?.credentials?.refreshToken) {
    await revokeToken(integration.credentials.refreshToken as string);
  }

  await updateIntegrationStatus(organizationId, 'quickbooks', 'disconnected');

  console.log('[QuickBooks OAuth] Disconnected:', { organizationId });
}

/**
 * Validate state parameter
 */
export function validateState(stateParam: string): QBOAuthState | null {
  try {
    const stateJson = Buffer.from(stateParam, 'base64').toString('utf-8');
    const state = JSON.parse(stateJson) as QBOAuthState;

    if (!state.organizationId || !state.nonce) {
      return null;
    }

    return state;
  } catch (error) {
    return null;
  }
}

/**
 * Get OAuth scopes
 */
export function getRequiredScopes(): string[] {
  return integrationConfig.quickbooks.scopes;
}

/**
 * Check if token needs refresh
 */
export function needsTokenRefresh(expiresAt: string | Date): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const timeUntilExpiry = expiry.getTime() - now.getTime();

  // Refresh if expires in less than 5 minutes
  return timeUntilExpiry < 5 * 60 * 1000;
}
