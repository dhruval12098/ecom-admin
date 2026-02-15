'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<'dashboard' | 'orders' | 'best' | 'basic'>('dashboard');
  const [page, setPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [basicPage, setBasicPage] = useState(1);
  const [ordersStatus, setOrdersStatus] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersFrom, setOrdersFrom] = useState('');
  const [ordersTo, setOrdersTo] = useState('');
  const [basicFrom, setBasicFrom] = useState('');
  const [basicTo, setBasicTo] = useState('');
  const [dashboardDays, setDashboardDays] = useState(30);
  const pageSize = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setOrders(result.data);
        }
      } catch (e) {
        // keep UI stable on failure
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

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

  useEffect(() => {
    const fetchOrderItems = async () => {
      setIsLoading(true);
      try {
        const details = await Promise.all(
          orders.map(async (order) => {
            const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}`);
            const result = await res.json();
            if (!result.success || !result.data) return [];
            const items = Array.isArray(result.data.items) ? result.data.items : [];
            return items.map((item: any) => ({
              order_id: order.id,
              order_code: order.order_code || order.order_number || order.id,
              sale_date: order.created_at,
              product_name: item.product_name,
              quantity: Number(item.quantity || 0),
              unit_price: Number(item.unit_price || 0),
              line_total: Number(item.total_price || Number(item.unit_price || 0) * Number(item.quantity || 0))
            }));
          })
        );
        setOrderItems(details.flat());
      } catch (e) {
        setOrderItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (orders.length === 0) {
      setOrderItems([]);
      return;
    }
    fetchOrderItems();
  }, [orders]);

  const dashboardCutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - dashboardDays);
    return d;
  }, [dashboardDays]);

  const dashboardOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!order.created_at) return false;
      return new Date(order.created_at) >= dashboardCutoff;
    });
  }, [orders, dashboardCutoff]);

  const dashboardSeries = useMemo(() => {
    const buckets: Record<string, number> = {};
    dashboardOrders.forEach((order) => {
      if (!order.created_at) return;
      const key = new Date(order.created_at).toISOString().slice(0, 10);
      buckets[key] = (buckets[key] || 0) + Number(order.total_amount || 0);
    });
    return Object.keys(buckets)
      .sort()
      .map((date) => ({ date, total: buckets[date] }));
  }, [dashboardOrders]);

  const dashboardSummary = useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    let todayTotal = 0;
    let monthTotal = 0;
    let monthOrders = 0;

    orders.forEach((order) => {
      if (!order.created_at) return;
      const created = new Date(order.created_at);
      const dayKey = created.toISOString().slice(0, 10);
      const mKey = `${created.getFullYear()}-${created.getMonth() + 1}`;
      const amount = Number(order.total_amount || 0);
      if (dayKey === todayKey) todayTotal += amount;
      if (mKey === monthKey) {
        monthTotal += amount;
        monthOrders += 1;
      }
    });

    const avgOrderValue = monthOrders > 0 ? monthTotal / monthOrders : 0;
    return { todayTotal, monthTotal, monthOrders, avgOrderValue };
  }, [orders]);

  const bestSellers = useMemo(() => {
    const byProduct: Record<string, { name: string; units: number; revenue: number }> = {};
    orderItems.forEach((item) => {
      const name = item.product_name || 'Unknown';
      if (!byProduct[name]) byProduct[name] = { name, units: 0, revenue: 0 };
      byProduct[name].units += Number(item.quantity || 0);
      byProduct[name].revenue += Number(item.line_total || 0);
    });
    return Object.values(byProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [orderItems]);

  const basicOrders = useMemo(() => {
    const fromDate = basicFrom ? new Date(basicFrom) : null;
    const toDate = basicTo ? new Date(basicTo) : null;
    return orders.filter((order) => {
      if (!order.created_at) return false;
      const created = new Date(order.created_at);
      if (fromDate && created < fromDate) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      return true;
    });
  }, [orders, basicFrom, basicTo]);

  const basicTotals = useMemo(() => {
    const totalRevenue = basicOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const totalOrders = basicOrders.length;
    return { totalRevenue, totalOrders };
  }, [basicOrders]);

  const ordersTotalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const ordersRows = filteredOrders.slice((ordersPage - 1) * pageSize, ordersPage * pageSize);
  const basicTotalPages = Math.max(1, Math.ceil(basicOrders.length / pageSize));
  const basicRows = basicOrders.slice((basicPage - 1) * pageSize, basicPage * pageSize);
  const bestTotalPages = Math.max(1, Math.ceil(bestSellers.length / pageSize));
  const bestRows = bestSellers.slice((page - 1) * pageSize, page * pageSize);

  const exportBasicCsv = () => {
    const header = ['Order ID', 'Customer Name', 'Amount', 'Status', 'Date'];
    const rows = basicOrders.map((order) => [
      order.order_code || order.order_number || order.id || '',
      order.customer_name || '',
      Number(order.total_amount || 0).toFixed(2),
      order.status || '',
      order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : ''
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'basic-sales-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setOrdersPage(1);
  }, [ordersFrom, ordersTo, ordersStatus, ordersSearch]);

  useEffect(() => {
    setBasicPage(1);
  }, [basicFrom, basicTo]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">Essential sales reports</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={tab === 'dashboard' ? 'default' : 'outline'} onClick={() => setTab('dashboard')}>
            Sales Dashboard
          </Button>
          <Button variant={tab === 'orders' ? 'default' : 'outline'} onClick={() => setTab('orders')}>
            Orders List
          </Button>
          <Button variant={tab === 'best' ? 'default' : 'outline'} onClick={() => setTab('best')}>
            Best Sellers
          </Button>
          <Button variant={tab === 'basic' ? 'default' : 'outline'} onClick={() => setTab('basic')}>
            Basic Sales Report
          </Button>
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Sales Today</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(dashboardSummary.todayTotal)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Sales This Month</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(dashboardSummary.monthTotal)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Orders This Month</p>
                <p className="text-2xl font-bold text-primary">{dashboardSummary.monthOrders}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(dashboardSummary.avgOrderValue)}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Sales Trend</h2>
                  <p className="text-xs text-muted-foreground mt-1">Last {dashboardDays} days</p>
                </div>
                <div className="flex gap-2">
                  <Button variant={dashboardDays === 7 ? 'default' : 'outline'} onClick={() => setDashboardDays(7)}>
                    7 Days
                  </Button>
                  <Button variant={dashboardDays === 30 ? 'default' : 'outline'} onClick={() => setDashboardDays(30)}>
                    30 Days
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {dashboardSeries.length === 0 ? (
                    <div className="text-muted-foreground">No sales data yet.</div>
                  ) : (
                    dashboardSeries.map((point) => (
                      <div key={point.date} className="flex items-center justify-between border-b border-border py-2">
                        <span className="text-muted-foreground">{point.date}</span>
                        <span className="font-medium text-foreground">{formatCurrency(point.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={ordersStatus}
                  onChange={(e) => setOrdersStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">From</label>
                <input
                  type="date"
                  className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={ordersFrom}
                  onChange={(e) => setOrdersFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <input
                  type="date"
                  className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={ordersTo}
                  onChange={(e) => setOrdersTo(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground">Search</label>
                <input
                  type="text"
                  placeholder="Order ID or customer name"
                  className="mt-1 w-full px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                />
              </div>
            </div>

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
                    {ordersRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          {isLoading ? 'Loading orders...' : 'No orders found.'}
                        </td>
                      </tr>
                    ) : (
                      ordersRows.map((order) => (
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Page {ordersPage} of {ordersTotalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    disabled={ordersPage === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                    disabled={ordersPage === ordersTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'best' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Best Selling Products</h2>
              <p className="text-xs text-muted-foreground mt-1">Top 10 products by revenue</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium">Product Name</th>
                    <th className="text-right px-6 py-3 font-medium">Units Sold</th>
                    <th className="text-right px-6 py-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bestRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                        {isLoading ? 'Loading products...' : 'No sales data yet.'}
                      </td>
                    </tr>
                  ) : (
                    bestRows.map((product) => (
                      <tr key={product.name} className="border-t border-border">
                        <td className="px-6 py-3 text-foreground">{product.name}</td>
                        <td className="px-6 py-3 text-right text-foreground whitespace-nowrap">{product.units}</td>
                        <td className="px-6 py-3 text-right text-foreground whitespace-nowrap">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page} of {bestTotalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(bestTotalPages, p + 1))}
                  disabled={page === bestTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === 'basic' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground">From</label>
                <input
                  type="date"
                  className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={basicFrom}
                  onChange={(e) => setBasicFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <input
                  type="date"
                  className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={basicTo}
                  onChange={(e) => setBasicTo(e.target.value)}
                />
              </div>
              <Button className="gap-2" onClick={exportBasicCsv} disabled={basicOrders.length === 0}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(basicTotals.totalRevenue)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-primary">{basicTotals.totalOrders}</p>
              </div>
            </div>

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
                    {basicRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          {isLoading ? 'Loading orders...' : 'No orders found.'}
                        </td>
                      </tr>
                    ) : (
                      basicRows.map((order) => (
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Page {basicPage} of {basicTotalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setBasicPage((p) => Math.max(1, p - 1))}
                    disabled={basicPage === 1}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setBasicPage((p) => Math.min(basicTotalPages, p + 1))}
                    disabled={basicPage === basicTotalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
