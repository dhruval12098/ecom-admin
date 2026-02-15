'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Search, Filter, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';
import { formatCurrency } from '@/lib/currency';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        setOrdersError(null);
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch');
        setOrders(Array.isArray(result.data) ? result.data : []);
      } catch (err: any) {
        setOrdersError(err?.message || 'Failed to load orders');
      } finally {
        setIsLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  const statusColors: Record<string, string> = {
    'Pending': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    'Confirmed': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    'Preparing': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    'Out for Delivery': 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    'Delivered': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    'Cancelled': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  const normalizeStatus = (status: string) => {
    if (!status) return 'Pending';
    const cleaned = status.replace(/_/g, ' ');
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        String(order.order_number || order.id || '')
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        String(order.customer_name || '').toLowerCase().includes(search.toLowerCase());

      const status = String(order.status || '').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter ||
        (statusFilter === 'delivery' && status === 'out for delivery');

      const matchesPriority =
        priorityFilter === 'all' || (priorityFilter === 'priority' ? order.priority : !order.priority);

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [orders, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter]);

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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-card">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48 bg-card">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="priority">Priority Only</SelectItem>
                <SelectItem value="normal">Normal Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              More
            </Button>
          </div>

          {/* Orders Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Order ID</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Customer</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Amount</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Status</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Priority</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Payment</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Auto-Transition</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Date</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingOrders && (
                    <tr>
                      <td className="px-6 py-4 text-xs text-muted-foreground" colSpan={9}>
                        Loading orders...
                      </td>
                    </tr>
                  )}
                  {!isLoadingOrders && ordersError && (
                    <tr>
                      <td className="px-6 py-4 text-xs text-destructive" colSpan={9}>
                        {ordersError}
                      </td>
                    </tr>
                  )}
                  {!isLoadingOrders && !ordersError && filteredOrders.length === 0 && (
                    <tr>
                      <td className="px-6 py-4 text-xs text-muted-foreground" colSpan={9}>
                        No orders found.
                      </td>
                    </tr>
                  )}
                  {!isLoadingOrders && !ordersError && pagedOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-2 text-foreground whitespace-nowrap">{order.order_number || order.id}</td>
                      <td className="px-6 py-2 text-foreground">{order.customer_name || '-'}</td>
                      <td className="px-6 py-2 text-foreground whitespace-nowrap">{formatCurrency(Number(order.total_amount || 0))}</td>
                      <td className="px-6 py-2">
                        {(() => {
                          const label = normalizeStatus(String(order.status || 'Pending'));
                          return (
                            <Badge className={statusColors[label] || statusColors.Pending}>
                              {label}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-2">
                        {order.priority ? (
                          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-semibold">Flagged</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </td>
                      <td className="px-6 py-2">
                        <Badge className={String(order.payment_status || '').toLowerCase() === 'paid' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}>
                          {normalizeStatus(String(order.payment_status || 'Pending'))}
                        </Badge>
                      </td>
                      <td className="px-6 py-2 text-foreground text-xs whitespace-nowrap">
                        {order.autoTransition !== 'none' ? (
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">
                            {order.autoTransition}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-2 text-muted-foreground whitespace-nowrap">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-2">
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
            <div className="flex items-center justify-between px-6 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </Suspense>
  );
}
