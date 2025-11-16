'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Search, MoreVertical } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatEnumValue } from '@/utils/formatting';
import { formatDate } from '@/utils/date-utils';
import type { Client } from '@/types/clients';

interface ClientsListProps {
  orgId: string;
  limit?: number;
}

/**
 * Clients list component
 */
export function ClientsList({ orgId, limit }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClients = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.get<Client[]>(`/organizations/${orgId}/clients`, {
        params: { limit },
      });
      setClients(response.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  }, [orgId, limit]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {search ? 'No clients found matching your search.' : 'No clients yet. Add your first client to get started.'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>FHS</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Last Transaction</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Link
                    href={`/dashboard/${orgId}/clients/${client.id}`}
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{formatEnumValue(client.type)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}
                  >
                    {formatEnumValue(client.status)}
                  </span>
                </TableCell>
                <TableCell>
                  {client.financialHealthScore ? (
                    <span className="font-medium">{client.financialHealthScore}</span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(client.balance)}</TableCell>
                <TableCell>
                  {client.lastTransactionDate
                    ? formatDate(client.lastTransactionDate)
                    : <span className="text-slate-500">Never</span>}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
