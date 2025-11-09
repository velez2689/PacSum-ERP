'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle } from 'lucide-react';

/**
 * Password reset request page
 */
export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await resetPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-slate-400 text-center mb-6">
            We've sent a password reset link to {email}
          </p>
          <Link href="/auth/login">
            <Button variant="primary">Back to Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <FormField>
            <FormLabel htmlFor="email" required>
              Email
            </FormLabel>
            <FormControl>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                error={!!error}
              />
            </FormControl>
            <FormMessage>{error}</FormMessage>
          </FormField>

          <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
            Send Reset Link
          </Button>

          <p className="text-center text-sm text-slate-400">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </Form>
      </CardContent>
    </Card>
  );
}
