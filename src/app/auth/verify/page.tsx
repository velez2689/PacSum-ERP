'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

/**
 * Email verification page
 */
export default function VerifyEmailPage() {
  const { user, verifyEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleVerification = useCallback(async (): Promise<void> => {
    if (!token) return;

    try {
      setStatus('verifying');
      await verifyEmail({ token });
      setStatus('success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  }, [token, verifyEmail, router]);

  useEffect(() => {
    if (token) {
      handleVerification();
    }
  }, [token, handleVerification]);

  const handleResendEmail = async (): Promise<void> => {
    // TODO: Implement resend email functionality
  };

  if (status === 'verifying') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-slate-400 mt-4">Verifying your email...</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'success') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
          <p className="text-slate-400 text-center">
            Your email has been successfully verified. Redirecting to dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
          <p className="text-slate-400 text-center mb-6">{error}</p>
          <Button onClick={() => router.push('/auth/login')} variant="primary">
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We've sent a verification link to {user?.email || 'your email'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-slate-400 text-center mb-6">
            Please check your email and click the verification link to continue.
          </p>
          <Button onClick={handleResendEmail} variant="outline">
            Resend Verification Email
          </Button>
        </div>

        <div className="text-center">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="text-sm"
          >
            Skip for now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
