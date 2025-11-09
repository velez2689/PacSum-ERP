'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

/**
 * Protected route wrapper component
 * Handles authentication and authorization checks
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireEmailVerification = false,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      // Not authenticated, redirect to login
      const loginUrl = redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    if (requireEmailVerification && user && !user.emailVerified) {
      // Email not verified, redirect to verification page
      router.push('/auth/verify');
      return;
    }
  }, [user, loading, requireAuth, requireEmailVerification, router, pathname, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Redirecting
  }

  if (requireEmailVerification && user && !user.emailVerified) {
    return null; // Redirecting
  }

  return <>{children}</>;
}
