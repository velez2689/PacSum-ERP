'use client';

import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Transactions page
 */
export default function TransactionsPage({ params }: { params: { orgId: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 mt-1">View and manage all transactions</p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions orgId={params.orgId} limit={50} />
        </CardContent>
      </Card>
    </div>
  );
}
