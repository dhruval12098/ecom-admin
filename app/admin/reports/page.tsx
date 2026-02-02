'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const salesData = [
  { month: 'Jan', sales: 4000, orders: 240 },
  { month: 'Feb', sales: 3000, orders: 221 },
  { month: 'Mar', sales: 2000, orders: 229 },
  { month: 'Apr', sales: 2780, orders: 200 },
  { month: 'May', sales: 1890, orders: 220 },
  { month: 'Jun', sales: 2390, orders: 250 },
];

export default function ReportsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">View sales and business analytics</p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-4">
          <input
            type="date"
            className="px-4 py-2 rounded-md bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="flex items-center text-muted-foreground">to</span>
          <input
            type="date"
            className="px-4 py-2 rounded-md bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button variant="outline">Apply</Button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Sales Report</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: `1px solid var(--border)`,
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Chart */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Order Report</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: `1px solid var(--border)`,
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">₹16,060</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-primary">1,360</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Avg Order Value</p>
            <p className="text-2xl font-bold text-primary">₹11.81</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-primary">3.2%</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
