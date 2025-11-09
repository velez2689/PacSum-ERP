/**
 * QuickBooks Online API Client
 * HTTP client for making authenticated requests to QuickBooks API
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { integrationConfig } from '../config';
import { QuickBooksError, RateLimitError, AuthenticationError } from '../integration-errors';
import { RateLimiter, RequestQueue, retryWithBackoff } from '../utils';
import { getIntegration, updateIntegrationCredentials, updateIntegrationStatus } from '../db-helpers';
import { refreshAccessToken } from './oauth';
import { QBOResponse, QBOErrorResponse } from './types';

/**
 * Rate limiter for QuickBooks API
 */
const rateLimiter = new RateLimiter(
  integrationConfig.rateLimits.quickbooks.maxRequestsPerSecond,
  1000
);

/**
 * Request queue for concurrent requests
 */
const requestQueue = new RequestQueue(
  integrationConfig.rateLimits.quickbooks.maxConcurrentRequests
);

/**
 * QuickBooks API Client
 */
export class QuickBooksClient {
  private axiosInstance: AxiosInstance;
  private organizationId: string;
  private realmId: string;
  private accessToken: string;
  private refreshToken: string;
  private tokenExpiry: Date;

  constructor(
    organizationId: string,
    realmId: string,
    accessToken: string,
    refreshToken: string,
    tokenExpiry: Date
  ) {
    this.organizationId = organizationId;
    this.realmId = realmId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = tokenExpiry;

    const config = integrationConfig.quickbooks;
    this.axiosInstance = axios.create({
      baseURL: `${config.apiBaseUrl}/v3/company/${realmId}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Ensure token is valid
        await this.ensureValidToken();

        // Set authorization header
        config.headers.Authorization = `Bearer ${this.accessToken}`;

        // Add minor version
        config.params = {
          ...config.params,
          minorversion: integrationConfig.quickbooks.minorVersion,
        };

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          try {
            await this.refreshTokens();
            error.config.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.axiosInstance.request(error.config);
          } catch (refreshError) {
            throw new AuthenticationError(
              'Failed to refresh QuickBooks access token',
              { provider: 'quickbooks', organizationId: this.organizationId }
            );
          }
        }

        // Parse QuickBooks error
        throw this.parseQBOError(error);
      }
    );
  }

  /**
   * Ensure access token is valid
   */
  private async ensureValidToken(): Promise<void> {
    const now = new Date();
    const timeUntilExpiry = this.tokenExpiry.getTime() - now.getTime();

    // Refresh if token expires in less than 5 minutes
    if (timeUntilExpiry < 5 * 60 * 1000) {
      await this.refreshTokens();
    }
  }

  /**
   * Refresh access token
   */
  private async refreshTokens(): Promise<void> {
    try {
      const tokens = await refreshAccessToken(this.refreshToken);

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;
      this.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

      // Update credentials in database
      await updateIntegrationCredentials(this.organizationId, 'quickbooks', {
        provider: 'quickbooks',
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresAt: this.tokenExpiry.toISOString(),
        realmId: this.realmId,
      });
    } catch (error) {
      await updateIntegrationStatus(
        this.organizationId,
        'quickbooks',
        'error',
        'Token refresh failed'
      );
      throw error;
    }
  }

  /**
   * Make API request with rate limiting and retry
   */
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: unknown,
    options: AxiosRequestConfig = {}
  ): Promise<T> {
    // Acquire rate limit token
    await rateLimiter.acquire();

    // Add to request queue
    return requestQueue.add(async () => {
      return retryWithBackoff(
        async () => {
          const response = await this.axiosInstance.request<T>({
            method,
            url: path,
            data,
            ...options,
          });
          return response.data;
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          shouldRetry: (error) => {
            if (error instanceof QuickBooksError) {
              return error.isRetryable;
            }
            return false;
          },
        }
      );
    });
  }

  /**
   * Query entities (read operation)
   */
  async query<T>(query: string): Promise<QBOResponse<T>> {
    return this.request<QBOResponse<T>>('GET', '/query', undefined, {
      params: { query },
    });
  }

  /**
   * Create entity
   */
  async create<T>(entityType: string, entity: Partial<T>): Promise<T> {
    const response = await this.request<Record<string, T>>(
      'POST',
      `/${entityType}`,
      entity
    );
    return response[entityType];
  }

  /**
   * Read entity by ID
   */
  async read<T>(entityType: string, id: string): Promise<T> {
    const response = await this.request<Record<string, T>>(
      'GET',
      `/${entityType}/${id}`
    );
    return response[entityType];
  }

  /**
   * Update entity
   */
  async update<T>(entityType: string, entity: Partial<T> & { Id: string; SyncToken: string }): Promise<T> {
    const response = await this.request<Record<string, T>>(
      'POST',
      `/${entityType}`,
      entity
    );
    return response[entityType];
  }

  /**
   * Delete entity (soft delete)
   */
  async delete<T>(entityType: string, id: string, syncToken: string): Promise<T> {
    const response = await this.request<Record<string, T>>(
      'POST',
      `/${entityType}`,
      {
        Id: id,
        SyncToken: syncToken,
        Active: false,
      }
    );
    return response[entityType];
  }

  /**
   * Batch operations
   */
  async batch(operations: Array<{ bId: string; operation: string; [key: string]: unknown }>): Promise<unknown> {
    return this.request('POST', '/batch', { BatchItemRequest: operations });
  }

  /**
   * Get company info
   */
  async getCompanyInfo(): Promise<unknown> {
    return this.read('companyinfo', this.realmId);
  }

  /**
   * Get preferences
   */
  async getPreferences(): Promise<unknown> {
    return this.read('preferences', '1');
  }

  /**
   * Get report
   */
  async getReport(reportName: string, params?: Record<string, unknown>): Promise<unknown> {
    return this.request('GET', `/reports/${reportName}`, undefined, { params });
  }

  /**
   * Parse QuickBooks error
   */
  private parseQBOError(error: unknown): QuickBooksError {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const qboError = error.response?.data as QBOErrorResponse | undefined;

      if (qboError?.Fault) {
        const firstError = qboError.Fault.Error[0];
        const message = firstError?.Message || 'QuickBooks API error';
        const code = firstError?.code;

        // Check for rate limit
        if (statusCode === 429 || code === '3200') {
          const retryAfter = error.response?.headers['retry-after'];
          throw new RateLimitError(
            'QuickBooks rate limit exceeded',
            retryAfter ? parseInt(retryAfter) : undefined,
            { provider: 'quickbooks', qboErrorCode: code }
          );
        }

        return new QuickBooksError(
          message,
          code,
          statusCode,
          {
            provider: 'quickbooks',
            organizationId: this.organizationId,
            realmId: this.realmId,
          }
        );
      }

      return new QuickBooksError(
        error.message,
        undefined,
        statusCode,
        {
          provider: 'quickbooks',
          organizationId: this.organizationId,
        }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown QuickBooks error';
    return new QuickBooksError(message, undefined, 500, {
      provider: 'quickbooks',
      organizationId: this.organizationId,
    });
  }

  /**
   * Get rate limiter status
   */
  getRateLimiterStatus() {
    return {
      availableTokens: rateLimiter.getAvailableTokens(),
      queueLength: requestQueue.getQueueLength(),
      activeRequests: requestQueue.getActiveCount(),
    };
  }
}

/**
 * Create QuickBooks client from database credentials
 */
export async function createQuickBooksClient(
  organizationId: string
): Promise<QuickBooksClient> {
  const integration = await getIntegration(organizationId, 'quickbooks');

  if (!integration) {
    throw new QuickBooksError(
      'QuickBooks integration not found',
      'NOT_CONNECTED',
      404,
      { organizationId }
    );
  }

  if (!integration.isActive || integration.status !== 'connected') {
    throw new QuickBooksError(
      'QuickBooks integration is not active',
      'NOT_ACTIVE',
      403,
      { organizationId, status: integration.status }
    );
  }

  const credentials = integration.credentials;
  if (!credentials?.accessToken || !credentials?.refreshToken || !credentials?.realmId) {
    throw new QuickBooksError(
      'QuickBooks credentials are incomplete',
      'INVALID_CREDENTIALS',
      400,
      { organizationId }
    );
  }

  const tokenExpiry = credentials.expiresAt
    ? new Date(credentials.expiresAt as string)
    : new Date(Date.now() + 3600 * 1000);

  return new QuickBooksClient(
    organizationId,
    credentials.realmId as string,
    credentials.accessToken as string,
    credentials.refreshToken as string,
    tokenExpiry
  );
}
