'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { loginSchema, type LoginFormData } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

/**
 * Login form component
 */
export function LoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await login(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form onSubmit={form.handleSubmit(onSubmit)}>
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
            error={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </FormControl>
        <FormMessage>{form.formState.errors.email?.message}</FormMessage>
      </FormField>

      <FormField>
        <FormLabel htmlFor="password" required>
          Password
        </FormLabel>
        <FormControl>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            error={!!form.formState.errors.password}
            {...form.register('password')}
          />
        </FormControl>
        <FormMessage>{form.formState.errors.password?.message}</FormMessage>
      </FormField>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-slate-300">Remember me</span>
        </label>
        <Link href="/auth/reset-password" className="text-blue-400 hover:text-blue-300">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
        Sign In
      </Button>

      <p className="text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
          Sign up
        </Link>
      </p>
    </Form>
  );
}
