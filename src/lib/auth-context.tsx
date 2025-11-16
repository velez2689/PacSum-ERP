'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AuthContextType,
  User,
  AuthSession,
  LoginCredentials,
  SignupData,
  ResetPasswordData,
  VerifyEmailData,
  UpdatePasswordData,
} from '@/types/auth';
import { apiClient } from '@/lib/api-client';

export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication provider component
 * Manages user authentication state and provides auth methods
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const storedSession = localStorage.getItem('auth_session');

      if (storedSession) {
        const parsedSession: AuthSession = JSON.parse(storedSession);

        // Check if session is expired
        if (new Date(parsedSession.expiresAt) > new Date()) {
          setSession(parsedSession);
          setUser(parsedSession.user);
          apiClient.setAccessToken(parsedSession.accessToken);
        } else {
          // Session expired, try to refresh
          await refreshSession();
        }
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize auth state from stored session
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Clear authentication state
   */
  const clearAuth = (): void => {
    setUser(null);
    setSession(null);
    apiClient.setAccessToken(null);
    localStorage.removeItem('auth_session');
  };

  /**
   * Save authentication session
   */
  const saveSession = (authSession: AuthSession): void => {
    setSession(authSession);
    setUser(authSession.user);
    apiClient.setAccessToken(authSession.accessToken);
    localStorage.setItem('auth_session', JSON.stringify(authSession));
  };

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      try {
        console.log('AuthContext: Starting login for:', credentials.email);
        setLoading(true);
        setError(null);

        console.log('AuthContext: Making API request to /auth/login');
        const response = await apiClient.post<AuthSession>('/auth/login', credentials);

        console.log('AuthContext: API response:', response.success, response.data);

        if (response.success && response.data) {
          console.log('AuthContext: Login successful, saving session');
          saveSession(response.data);
          // Redirect to organization-specific dashboard
          const orgId = response.data.user.organizationId;
          console.log('AuthContext: Redirecting to /dashboard/' + orgId);
          router.push(`/dashboard/${orgId}`);
          console.log('AuthContext: router.push called');
        } else {
          throw new Error('Login failed: Invalid response');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to login';
        console.error('AuthContext: Login error:', errorMessage, err);
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  /**
   * Signup new user
   */
  const signup = useCallback(
    async (data: SignupData): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.post<AuthSession>('/auth/signup', data);

        if (response.success && response.data) {
          saveSession(response.data);
          router.push('/auth/verify');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  /**
   * Logout user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      setLoading(false);
      router.push('/auth/login');
    }
  }, [router]);

  /**
   * Request password reset
   */
  const resetPassword = useCallback(async (data: ResetPasswordData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.post('/auth/reset-password', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify email with token
   */
  const verifyEmail = useCallback(async (data: VerifyEmailData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<User>('/auth/verify-email', data);

      if (response.success && response.data && user) {
        setUser({ ...user, emailVerified: true });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify email';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Update password
   */
  const updatePassword = useCallback(async (data: UpdatePasswordData): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await apiClient.post('/auth/update-password', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh authentication session
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      if (!session?.refreshToken) {
        clearAuth();
        return;
      }

      const response = await apiClient.post<AuthSession>('/auth/refresh', {
        refreshToken: session.refreshToken,
      });

      if (response.success && response.data) {
        saveSession(response.data);
      } else {
        clearAuth();
      }
    } catch (err) {
      console.error('Failed to refresh session:', err);
      clearAuth();
    }
  }, [session]);

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    login,
    signup,
    logout,
    resetPassword,
    verifyEmail,
    updatePassword,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
