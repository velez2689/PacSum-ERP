'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

/**
 * Signup form component
 */
export function SignupForm() {
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationName: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    if (!formData.organizationName) errors.organizationName = 'Organization name is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);
      await signup(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="firstName" required>
            First Name
          </FormLabel>
          <FormControl>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              error={!!formErrors.firstName}
            />
          </FormControl>
          <FormMessage>{formErrors.firstName}</FormMessage>
        </FormField>

        <FormField>
          <FormLabel htmlFor="lastName" required>
            Last Name
          </FormLabel>
          <FormControl>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              error={!!formErrors.lastName}
            />
          </FormControl>
          <FormMessage>{formErrors.lastName}</FormMessage>
        </FormField>
      </div>

      <FormField>
        <FormLabel htmlFor="email" required>
          Email
        </FormLabel>
        <FormControl>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={!!formErrors.email}
          />
        </FormControl>
        <FormMessage>{formErrors.email}</FormMessage>
      </FormField>

      <FormField>
        <FormLabel htmlFor="organizationName" required>
          Organization Name
        </FormLabel>
        <FormControl>
          <Input
            id="organizationName"
            name="organizationName"
            type="text"
            placeholder="Acme Corp"
            value={formData.organizationName}
            onChange={handleChange}
            error={!!formErrors.organizationName}
          />
        </FormControl>
        <FormMessage>{formErrors.organizationName}</FormMessage>
      </FormField>

      <FormField>
        <FormLabel htmlFor="password" required>
          Password
        </FormLabel>
        <FormControl>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={!!formErrors.password}
          />
        </FormControl>
        <FormMessage>{formErrors.password}</FormMessage>
      </FormField>

      <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
        Create Account
      </Button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium">
          Sign in
        </Link>
      </p>
    </Form>
  );
}
