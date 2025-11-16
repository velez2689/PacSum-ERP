'use client';

import { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatCurrency, formatEnumValue } from '@/utils/formatting';
import { formatSmartDate } from '@/utils/date-utils';
import { apiClient } from '@/lib/api-client';
import type { Transaction } from '@/types/transactions';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RecentTransactionsProps {
  orgId: string;
  limit?: number;
}

/**
 * Recent transactions list component
 */
export function RecentTransactions({ orgId, limit = 5 }: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.get<Transaction[]>(
        `/organizations/${orgId}/transactions`,
        { params: { limit } }
      );
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No transactions yet. Add your first transaction to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                transaction.type === 'INCOME'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              }`}
            >
              {transaction.type === 'INCOME' ? (
                <ArrowDownRight className="h-5 w-5" />
              ) : (
                <ArrowUpRight className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">{transaction.description}</p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{formatEnumValue(transaction.category)}</span>
                {transaction.client && (
                  <>
                    <span>•</span>
                    <span>{transaction.client.name}</span>
                  </>
                )}
                <span>•</span>
                <span>{formatSmartDate(transaction.date)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-semibold ${
                transaction.type === 'INCOME' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {transaction.type === 'INCOME' ? '+' : '-'}
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                transaction.status === 'COMPLETED'
                  ? 'bg-green-500/10 text-green-400'
                  : transaction.status === 'PENDING'
                  ? 'bg-yellow-500/10 text-yellow-400'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {formatEnumValue(transaction.status)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
