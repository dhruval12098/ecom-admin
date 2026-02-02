'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Search, Filter, Star } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const searchParams = useSearchParams();

  const orders = [
    { id: 'ORD-001', customer: 'John Doe', amount: '₹450', status: 'Delivered', date: '2024-01-20', items: 3, priority: false, isPaid: true, autoTransition: 'completed' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: '₹320', status: 'Out for Delivery', date: '2024-01-20', items: 2, priority: false, isPaid: true, autoTransition: 'none' },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: '₹580', status: 'Confirmed', date: '2024-01-20', items: 5, priority: true, isPaid: true, autoTransition: 'preparing' },
    { id: 'ORD-004', customer: 'Sarah Wilson', amount: '₹290', status: 'Pending', date: '2024-01-19', items: 1, priority: false, isPaid: false, autoTransition: 'none' },
    { id: 'ORD-005', customer: 'Tom Brown', amount: '₹720', status: 'Delivered', date: '2024-01-19', items: 4, priority: true, isPaid: true, autoTransition: 'completed' },
  ];

  const statusColors: Record<string, string> = {
    'Pending': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    'Confirmed': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    'Preparing': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    'Out for Delivery': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    'Delivered': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    'Cancelled': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage all customer orders</p>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Priority</option>
              <option value="priority">Priority Only</option>
              <option value="normal">Normal Only</option>
            </select>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              More
            </Button>
          </div>

          {/* Orders Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Auto-Transition</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{order.customer}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">{order.amount}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={statusColors[order.status] || statusColors.Pending}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {order.priority ? (
                          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-semibold">Flagged</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={order.isPaid ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}>
                          {order.isPaid ? 'Paid' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground text-xs">
                        {order.autoTransition !== 'none' ? (
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                            {order.autoTransition}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
                      <td className="px-6 py-4 text-sm">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </Suspense>
  );
}
