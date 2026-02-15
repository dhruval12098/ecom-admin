'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');

  const logs = [
    {
      id: 1,
      action: 'Product Updated',
      user: 'Admin User',
      details: 'Updated price for Butter Chicken from €220 to €240',
      timestamp: '2024-01-20 2:30 PM',
      type: 'product_update',
    },
    {
      id: 2,
      action: 'Category Created',
      user: 'Manager',
      details: 'Created new category: Breakfast',
      timestamp: '2024-01-20 1:15 PM',
      type: 'category_create',
    },
    {
      id: 3,
      action: 'Order Status Changed',
      user: 'Admin User',
      details: 'Order #1234 status changed from Pending to Confirmed',
      timestamp: '2024-01-20 11:45 AM',
      type: 'order_update',
    },
    {
      id: 4,
      action: 'Inventory Adjusted',
      user: 'Inventory Manager',
      details: 'Stock for Samosas adjusted from 50 to 45 units',
      timestamp: '2024-01-19 5:20 PM',
      type: 'inventory_update',
    },
    {
      id: 5,
      action: 'Product Deleted',
      user: 'Admin User',
      details: 'Soft deleted product: Old Item (Archive)',
      timestamp: '2024-01-19 3:10 PM',
      type: 'product_delete',
    },
    {
      id: 6,
      action: 'Coupon Applied',
      user: 'System',
      details: 'Coupon SAVE10 applied to order #1230',
      timestamp: '2024-01-19 12:05 PM',
      type: 'coupon_apply',
    },
  ];

  const getActionColor = (type: string) => {
    switch (type) {
      case 'product_update':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'product_delete':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'category_create':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'order_update':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Activity Logs</h1>
            <p className="text-muted-foreground text-sm mt-1">Track all admin actions and changes</p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Logs Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-6 py-4">
                      <Badge className={getActionColor(log.type)}>{log.action}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{log.user}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.details}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
