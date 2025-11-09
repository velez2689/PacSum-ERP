'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FHSCard } from './FHSCard';
import { RecentTransactions } from './RecentTransactions';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText } from 'lucide-react';

interface OverviewProps {
  orgId: string;
}

/**
 * Dashboard overview component
 * Shows key metrics and summary
 */
export function Overview({ orgId }: OverviewProps) {
  // TODO: Fetch real data from API
  const stats = {
    totalRevenue: 125420.5,
    totalExpenses: 82340.25,
    activeClients: 24,
    pendingTransactions: 12,
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          trend={12.5}
          icon={TrendingUp}
          positive
        />
        <StatCard
          title="Total Expenses"
          value={`$${stats.totalExpenses.toLocaleString()}`}
          trend={-3.2}
          icon={TrendingDown}
          positive={false}
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients.toString()}
          trend={8.1}
          icon={Users}
          positive
        />
        <StatCard
          title="Pending Items"
          value={stats.pendingTransactions.toString()}
          icon={FileText}
        />
      </div>

      {/* Financial Health Score & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FHSCard orgId={orgId} />

        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-400">
              Chart placeholder - integrate with recharts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentTransactions orgId={orgId} limit={10} />
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  positive?: boolean;
}

function StatCard({ title, value, trend, icon: Icon, positive }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend !== undefined && (
              <p
                className={`text-sm mt-1 ${
                  positive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trend > 0 ? '+' : ''}
                {trend}% from last month
              </p>
            )}
          </div>
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center ${
              positive
                ? 'bg-green-500/10 text-green-500'
                : positive === false
                ? 'bg-red-500/10 text-red-500'
                : 'bg-blue-500/10 text-blue-500'
            }`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
