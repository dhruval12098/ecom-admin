'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(search);

  const payments = [
    { id: 1, orderId: 'ORD-001', amount: '₹450', method: 'Online (UPI)', status: 'Successful', date: '2024-01-20', txnId: 'TXN123456' },
    { id: 2, orderId: 'ORD-002', amount: '₹320', method: 'Credit Card', status: 'Successful', date: '2024-01-20', txnId: 'TXN123457' },
    { id: 3, orderId: 'ORD-003', amount: '₹580', method: 'Debit Card', status: 'Successful', date: '2024-01-20', txnId: 'TXN123458' },
    { id: 4, orderId: 'ORD-004', amount: '₹290', method: 'Online (UPI)', status: 'Pending', date: '2024-01-19', txnId: 'TXN123459' },
    { id: 5, orderId: 'ORD-005', amount: '₹250', method: 'Wallet', status: 'Failed', date: '2024-01-19', txnId: 'TXN123460' },
  ];

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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{payment.orderId}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground">{payment.amount}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{payment.method}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{payment.txnId}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          className={
                            payment.status === 'Successful'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : payment.status === 'Pending'
                                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{payment.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Suspense>
    </AdminLayout>
  );
}
