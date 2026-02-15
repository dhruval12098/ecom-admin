'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';
import { formatCurrency } from '@/lib/currency';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(search);

  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoadingPayments(true);
        setPaymentsError(null);
        const [paymentsResponse, ordersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/payments`),
          fetch(`${API_BASE_URL}/api/orders`)
        ]);
        const paymentsResult = await paymentsResponse.json();
        const ordersResult = await ordersResponse.json();
        if (!paymentsResult.success) throw new Error(paymentsResult.error || 'Failed to fetch');
        setPayments(Array.isArray(paymentsResult.data) ? paymentsResult.data : []);
        if (ordersResult.success && Array.isArray(ordersResult.data)) {
          setOrders(ordersResult.data);
        }
      } catch (err: any) {
        setPaymentsError(err?.message || 'Failed to load payments');
      } finally {
        setIsLoadingPayments(false);
      }
    };
    fetchPayments();
  }, []);

  const ordersById = useMemo(() => {
    const map: Record<string, any> = {};
    orders.forEach((order) => {
      map[String(order.id)] = order;
    });
    return map;
  }, [orders]);

  const filteredPayments = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((payment) => {
      const order = ordersById[String(payment.order_id)];
      const orderId = String(payment.order_id || '').toLowerCase();
      const transactionId = String(payment.transaction_id || '').toLowerCase();
      const name = String(order?.customer_name || '').toLowerCase();
      return orderId.includes(q) || transactionId.includes(q) || name.includes(q);
    });
  }, [localSearch, ordersById, payments]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const pagedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [localSearch]);

  return (
    <AdminLayout>
      <Suspense fallback={<Loading />}>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">Transaction history and payment management</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Payments Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Order ID</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Customer</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Amount</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Method</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Transaction ID</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Status</th>
                    <th className="px-6 py-2 text-left font-semibold text-foreground">Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPayments && (
                    <tr>
                      <td className="px-6 py-4 text-xs text-muted-foreground" colSpan={7}>
                        Loading payments...
                      </td>
                    </tr>
                  )}
                  {!isLoadingPayments && paymentsError && (
                    <tr>
                      <td className="px-6 py-4 text-xs text-destructive" colSpan={7}>
                        {paymentsError}
                      </td>
                    </tr>
                  )}
                  {!isLoadingPayments && !paymentsError && filteredPayments.length === 0 && (
                    <tr>
                      <td className="px-6 py-4 text-xs text-muted-foreground" colSpan={7}>
                        No payments found.
                      </td>
                    </tr>
                  )}
                  {!isLoadingPayments && !paymentsError && pagedPayments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-2 text-foreground whitespace-nowrap">{payment.order_id}</td>
                      <td className="px-6 py-2 text-foreground">{ordersById[String(payment.order_id)]?.customer_name || '-'}</td>
                      <td className="px-6 py-2 text-foreground whitespace-nowrap">{formatCurrency(Number(payment.amount || 0))}</td>
                      <td className="px-6 py-2 text-muted-foreground">{payment.method || '-'}</td>
                      <td className="px-6 py-2 text-muted-foreground">{payment.transaction_id || '-'}</td>
                      <td className="px-6 py-2">
                        <Badge
                          className={
                            String(payment.status || '').toLowerCase() === 'paid'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : String(payment.status || '').toLowerCase() === 'pending'
                                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }
                        >
                          {payment.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-6 py-2 text-muted-foreground whitespace-nowrap">
                        {payment.created_at ? new Date(payment.created_at).toLocaleString() : '-'}
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
      </Suspense>
    </AdminLayout>
  );
}
