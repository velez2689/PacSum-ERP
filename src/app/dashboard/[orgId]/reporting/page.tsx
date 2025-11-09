'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter, RefreshCw } from 'lucide-react';

interface ReportData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  transactions: number;
}

interface ClientMetrics {
  name: string;
  transactions: number;
  revenue: number;
  status: 'active' | 'inactive';
}

/**
 * Reporting page component
 * Displays financial reports, analytics, and insights
 */
export default function ReportingPage({
  _params,
}: {
  params: { orgId: string };
}) {
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - replace with actual API calls
  const revenueData: ReportData[] = [
    { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000, transactions: 125 },
    { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000, transactions: 142 },
    { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000, transactions: 138 },
    { month: 'Apr', revenue: 61000, expenses: 38000, profit: 23000, transactions: 165 },
    { month: 'May', revenue: 55000, expenses: 36000, profit: 19000, transactions: 151 },
    { month: 'Jun', revenue: 67000, expenses: 40000, profit: 27000, transactions: 178 },
  ];

  const clientMetrics: ClientMetrics[] = [
    { name: 'Acme Corp', transactions: 45, revenue: 125000, status: 'active' },
    { name: 'Tech Solutions', transactions: 32, revenue: 89500, status: 'active' },
    { name: 'Global Industries', transactions: 28, revenue: 76200, status: 'active' },
    { name: 'Innovation Labs', transactions: 19, revenue: 54300, status: 'inactive' },
    { name: 'Future Ventures', transactions: 15, revenue: 42100, status: 'inactive' },
  ];

  const handleExportReport = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In production, this would generate and download a PDF/CSV
      console.log(`Exporting report for period: ${dateRange}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      // Simulate API call to refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Report data refreshed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-2 text-muted-foreground">
            View financial reports, analytics, and business insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleExportReport}
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)} className="mt-1">
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </Select>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
              <CardDescription>Monthly financial performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0066cc" />
                  <Bar dataKey="expenses" fill="#ff6b6b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>Monthly profit progression</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="profit" stroke="#3bde64" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Performance</CardTitle>
              <CardDescription>Revenue and transaction metrics by client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clientMetrics.map((client) => (
                  <div key={client.name} className="border-t pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.transactions} transactions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${client.revenue.toLocaleString()}
                        </p>
                        <span className={`text-xs font-medium ${
                          client.status === 'active'
                            ? 'text-green-600'
                            : 'text-muted-foreground'
                        }`}>
                          {client.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">$328,000</p>
                  <p className="text-xs text-green-600">+12% from last period</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">$214,000</p>
                  <p className="text-xs text-red-600">+8% from last period</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold">$114,000</p>
                  <p className="text-xs text-green-600">+15% from last period</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">899</p>
                  <p className="text-xs text-blue-600">+22 this period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
