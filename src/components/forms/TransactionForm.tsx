'use client';

import { useState } from 'react';
import { TransactionType, TransactionCategory, PaymentMethod, type CreateTransactionData } from '@/types/transactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateTransactionData>;
  isLoading?: boolean;
  clientId?: string;
}

/**
 * Transaction form component
 */
export function TransactionForm({ onSubmit, onCancel, initialData, isLoading, clientId }: TransactionFormProps) {
  const [formData, setFormData] = useState<Partial<CreateTransactionData>>({
    clientId: clientId || initialData?.clientId || '',
    type: initialData?.type || TransactionType.INCOME,
    category: initialData?.category || TransactionCategory.SALES,
    amount: initialData?.amount || 0,
    currency: initialData?.currency || 'USD',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString(),
    paymentMethod: initialData?.paymentMethod,
    reference: initialData?.reference || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.clientId) newErrors.clientId = 'Client is required';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData as CreateTransactionData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    const parsedValue = name === 'amount' ? parseFloat(value) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="type" required>
            Transaction Type
          </FormLabel>
          <FormControl>
            <Select id="type" name="type" value={formData.type} onChange={handleChange}>
              <option value={TransactionType.INCOME}>Income</option>
              <option value={TransactionType.EXPENSE}>Expense</option>
              <option value={TransactionType.TRANSFER}>Transfer</option>
            </Select>
          </FormControl>
        </FormField>

        <FormField>
          <FormLabel htmlFor="category" required>
            Category
          </FormLabel>
          <FormControl>
            <Select id="category" name="category" value={formData.category} onChange={handleChange}>
              <optgroup label="Income">
                <option value={TransactionCategory.SALES}>Sales</option>
                <option value={TransactionCategory.SERVICE}>Service</option>
                <option value={TransactionCategory.INTEREST}>Interest</option>
                <option value={TransactionCategory.OTHER_INCOME}>Other Income</option>
              </optgroup>
              <optgroup label="Expense">
                <option value={TransactionCategory.SALARY}>Salary</option>
                <option value={TransactionCategory.RENT}>Rent</option>
                <option value={TransactionCategory.UTILITIES}>Utilities</option>
                <option value={TransactionCategory.MARKETING}>Marketing</option>
                <option value={TransactionCategory.OTHER_EXPENSE}>Other Expense</option>
              </optgroup>
            </Select>
          </FormControl>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="amount" required>
            Amount
          </FormLabel>
          <FormControl>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              error={!!errors.amount}
              placeholder="0.00"
            />
          </FormControl>
          <FormMessage>{errors.amount}</FormMessage>
        </FormField>

        <FormField>
          <FormLabel htmlFor="date" required>
            Date
          </FormLabel>
          <FormControl>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date?.split('T')[0]}
              onChange={handleChange}
            />
          </FormControl>
        </FormField>
      </div>

      <FormField>
        <FormLabel htmlFor="description" required>
          Description
        </FormLabel>
        <FormControl>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            error={!!errors.description}
            placeholder="Transaction description"
          />
        </FormControl>
        <FormMessage>{errors.description}</FormMessage>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField>
          <FormLabel htmlFor="paymentMethod">Payment Method</FormLabel>
          <FormControl>
            <Select id="paymentMethod" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
              <option value="">Select method</option>
              <option value={PaymentMethod.CASH}>Cash</option>
              <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
              <option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</option>
              <option value={PaymentMethod.CHECK}>Check</option>
              <option value={PaymentMethod.PAYPAL}>PayPal</option>
            </Select>
          </FormControl>
        </FormField>

        <FormField>
          <FormLabel htmlFor="reference">Reference</FormLabel>
          <FormControl>
            <Input
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Invoice #, etc."
            />
          </FormControl>
        </FormField>
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Update Transaction' : 'Create Transaction'}
        </Button>
      </div>
    </Form>
  );
}
