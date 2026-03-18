'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type ReportTab = 'daily' | 'monthly' | 'orders' | 'payments';

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<ReportTab>('daily');

  const [ordersStatus, setOrdersStatus] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersFrom, setOrdersFrom] = useState('');
  const [ordersTo, setOrdersTo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersResponse, paymentsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/orders`),
          fetch(`${API_BASE_URL}/api/payments`)
        ]);
        const ordersResult = await ordersResponse.json();
        const paymentsResult = await paymentsResponse.json();
        if (ordersResult.success && Array.isArray(ordersResult.data)) {
          setOrders(ordersResult.data);
        }
        if (paymentsResult.success && Array.isArray(paymentsResult.data)) {
          setPayments(paymentsResult.data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const dailyOrders = useMemo(
    () => orders.filter((o) => o.created_at && new Date(o.created_at).toISOString().slice(0, 10) === todayKey),
    [orders, todayKey]
  );

  const monthlyOrders = useMemo(
    () => orders.filter((o) => o.created_at && new Date(o.created_at).toISOString().slice(0, 7) === monthKey),
    [orders, monthKey]
  );

  const filteredOrders = useMemo(() => {
    const fromDate = ordersFrom ? new Date(ordersFrom) : null;
    const toDate = ordersTo ? new Date(ordersTo) : null;
    const search = ordersSearch.trim().toLowerCase();

    return orders.filter((order) => {
      if (!order.created_at) return false;
      const created = new Date(order.created_at);
      if (fromDate && created < fromDate) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      if (ordersStatus && String(order.status || '').toLowerCase() !== ordersStatus) return false;
      if (search) {
        const orderId = String(order.order_code || order.order_number || order.id || '').toLowerCase();
        const name = String(order.customer_name || '').toLowerCase();
        if (!orderId.includes(search) && !name.includes(search)) return false;
      }
      return true;
    });
  }, [orders, ordersFrom, ordersTo, ordersStatus, ordersSearch]);

  const receivedPayments = useMemo(() => {
    const valid = new Set(['paid', 'success', 'succeeded', 'captured', 'completed', 'confirmed']);
    return payments.filter((p) => valid.has(String(p.status || '').toLowerCase()));
  }, [payments]);

  const csvEscape = (value: any) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  const downloadCsv = (fileName: string, header: string[], rows: any[][]) => {
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportOrdersRows = (fileName: string, rows: any[]) => {
    downloadCsv(
      fileName,
      ['Order ID', 'Customer Name', 'Amount', 'Status', 'Date'],
      rows.map((order) => [
        order.order_code || order.order_number || order.id || '',
        order.customer_name || '',
        Number(order.total_amount || 0).toFixed(2),
        order.status || '',
        order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : ''
      ])
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Sales and accounting exports</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={tab === 'daily' ? 'default' : 'outline'} onClick={() => setTab('daily')}>Daily Sales</Button>
          <Button variant={tab === 'monthly' ? 'default' : 'outline'} onClick={() => setTab('monthly')}>Monthly Sales</Button>
          <Button variant={tab === 'orders' ? 'default' : 'outline'} onClick={() => setTab('orders')}>Orders</Button>
          <Button variant={tab === 'payments' ? 'default' : 'outline'} onClick={() => setTab('payments')}>Payments Received</Button>
        </div>

        {tab === 'daily' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => exportOrdersRows(`daily-sales-${todayKey}.csv`, dailyOrders)} disabled={dailyOrders.length === 0}>
                <Download className="w-4 h-4" />
                Export Daily CSV
              </Button>
            </div>
            <OrdersTable rows={dailyOrders} isLoading={isLoading} />
          </div>
        )}

        {tab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => exportOrdersRows(`monthly-sales-${monthKey}.csv`, monthlyOrders)} disabled={monthlyOrders.length === 0}>
                <Download className="w-4 h-4" />
                Export Monthly CSV
              </Button>
            </div>
            <OrdersTable rows={monthlyOrders} isLoading={isLoading} />
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" value={ordersStatus} onChange={(e) => setOrdersStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">From</label>
                <input type="date" className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" value={ordersFrom} onChange={(e) => setOrdersFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <input type="date" className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" value={ordersTo} onChange={(e) => setOrdersTo(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground">Search</label>
                <input type="text" placeholder="Order ID or customer name" className="mt-1 w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm" value={ordersSearch} onChange={(e) => setOrdersSearch(e.target.value)} />
              </div>
              <Button className="gap-2" onClick={() => exportOrdersRows('orders-report.csv', filteredOrders)} disabled={filteredOrders.length === 0}>
                <Download className="w-4 h-4" />
                Export Orders CSV
              </Button>
            </div>
            <OrdersTable rows={filteredOrders} isLoading={isLoading} />
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                className="gap-2"
                onClick={() =>
                  downloadCsv(
                    'payments-received.csv',
                    ['Order ID', 'Amount', 'Method', 'Transaction ID', 'Status', 'Paid At'],
                    receivedPayments.map((p) => [
                      p.order_id || '',
                      Number(p.amount || 0).toFixed(2),
                      p.method || '',
                      p.transaction_id || '',
                      p.status || '',
                      p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : ''
                    ])
                  )
                }
                disabled={receivedPayments.length === 0}
              >
                <Download className="w-4 h-4" />
                Export Payments CSV
              </Button>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-3 font-medium">Order ID</th>
                      <th className="text-right px-6 py-3 font-medium">Amount</th>
                      <th className="text-left px-6 py-3 font-medium">Method</th>
                      <th className="text-left px-6 py-3 font-medium">Transaction ID</th>
                      <th className="text-left px-6 py-3 font-medium">Status</th>
                      <th className="text-left px-6 py-3 font-medium">Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          {isLoading ? 'Loading payments...' : 'No received payments found.'}
                        </td>
                      </tr>
                    ) : (
                      receivedPayments.map((p) => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="px-6 py-3 text-foreground whitespace-nowrap">{p.order_id || '-'}</td>
                          <td className="px-6 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(Number(p.amount || 0))}</td>
                          <td className="px-6 py-3 text-foreground">{p.method || '-'}</td>
                          <td className="px-6 py-3 text-foreground">{p.transaction_id || '-'}</td>
                          <td className="px-6 py-3 text-foreground">{p.status || '-'}</td>
                          <td className="px-6 py-3 text-foreground whitespace-nowrap">
                            {p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function OrdersTable({ rows, isLoading }: { rows: any[]; isLoading: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Order ID</th>
              <th className="text-left px-6 py-3 font-medium">Customer Name</th>
              <th className="text-right px-6 py-3 font-medium">Amount</th>
              <th className="text-left px-6 py-3 font-medium">Status</th>
              <th className="text-left px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  {isLoading ? 'Loading orders...' : 'No orders found.'}
                </td>
              </tr>
            ) : (
              rows.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-6 py-3 text-foreground whitespace-nowrap">
                    {order.order_code || order.order_number || order.id}
                  </td>
                  <td className="px-6 py-3 text-foreground">{order.customer_name || '-'}</td>
                  <td className="px-6 py-3 text-right text-foreground whitespace-nowrap">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-3 text-foreground">{order.status || '-'}</td>
                  <td className="px-6 py-3 text-foreground whitespace-nowrap">
                    {order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
