'use client';

import { useState } from 'react';
import { ClientType, ClientStatus, type CreateClientData } from '@/types/clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';

interface ClientFormProps {
  onSubmit: (data: CreateClientData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateClientData>;
  isLoading?: boolean;
}

/**
 * Client form component for creating/editing clients
 */
export function ClientForm({ onSubmit, onCancel, initialData, isLoading }: ClientFormProps) {
  const [formData, setFormData] = useState<CreateClientData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    type: initialData?.type || ClientType.BUSINESS,
    status: initialData?.status || ClientStatus.ACTIVE,
    taxId: initialData?.taxId || '',
    industry: initialData?.industry || '',
    website: initialData?.website || '',
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Client name is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField>
        <FormLabel htmlFor="name" required>
          Client Name
        </FormLabel>
        <FormControl>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            placeholder="Acme Corporation"
          />
        </FormControl>
        <FormMessage>{errors.name}</FormMessage>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="email">Email</FormLabel>
          <FormControl>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              placeholder="contact@acme.com"
            />
          </FormControl>
          <FormMessage>{errors.email}</FormMessage>
        </FormField>

        <FormField>
          <FormLabel htmlFor="phone">Phone</FormLabel>
          <FormControl>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </FormControl>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="type" required>
            Client Type
          </FormLabel>
          <FormControl>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border bg-slate-700 border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ClientType.INDIVIDUAL}>Individual</option>
              <option value={ClientType.BUSINESS}>Business</option>
              <option value={ClientType.NON_PROFIT}>Non-Profit</option>
              <option value={ClientType.GOVERNMENT}>Government</option>
            </select>
          </FormControl>
        </FormField>

        <FormField>
          <FormLabel htmlFor="status" required>
            Status
          </FormLabel>
          <FormControl>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border bg-slate-700 border-slate-600 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ClientStatus.ACTIVE}>Active</option>
              <option value={ClientStatus.INACTIVE}>Inactive</option>
              <option value={ClientStatus.SUSPENDED}>Suspended</option>
            </select>
          </FormControl>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="taxId">Tax ID</FormLabel>
          <FormControl>
            <Input
              id="taxId"
              name="taxId"
              value={formData.taxId}
              onChange={handleChange}
              placeholder="XX-XXXXXXX"
            />
          </FormControl>
        </FormField>

        <FormField>
          <FormLabel htmlFor="industry">Industry</FormLabel>
          <FormControl>
            <Input
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              placeholder="Technology"
            />
          </FormControl>
        </FormField>
      </div>

      <FormField>
        <FormLabel htmlFor="website">Website</FormLabel>
        <FormControl>
          <Input
            id="website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </FormControl>
      </FormField>

      <FormField>
        <FormLabel htmlFor="notes">Notes</FormLabel>
        <FormControl>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="flex w-full rounded-md border bg-slate-700 border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional notes about the client..."
          />
        </FormControl>
        <FormDescription>Any additional information about this client</FormDescription>
      </FormField>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </Form>
  );
}
