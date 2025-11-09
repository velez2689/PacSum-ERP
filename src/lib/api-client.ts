/**
 * API client wrapper for making HTTP requests
 * Handles authentication, error handling, and response parsing
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { ApiResponse, ApiError } from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const apiError = this.handleError(error);

        // Handle 401 unauthorized - refresh token or logout
        if (error.response?.status === 401) {
          // TODO: Implement token refresh logic
          // For now, redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Set authentication token
   */
  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  /**
   * Handle API errors and convert to ApiError format
   */
  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as ApiError;
      return {
        message: data.message || 'An error occurred',
        code: data.code || 'UNKNOWN_ERROR',
        details: data.details,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      };
    } else {
      // Error setting up request
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'REQUEST_ERROR',
        statusCode: 0,
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * Upload file
   */
  async upload<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
