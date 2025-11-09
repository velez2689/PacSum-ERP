'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary component
 * Handles application-wide errors and displays error UI
 */
export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Our team has been notified and is working on a fix.
          </p>
        </div>

        {/* Error Details (in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="rounded-lg bg-muted/50 p-4 text-left">
            <p className="text-sm font-semibold text-foreground">Error Details:</p>
            <p className="mt-2 text-xs text-muted-foreground break-all">
              {error.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            onClick={reset}
            variant="default"
            className="flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
