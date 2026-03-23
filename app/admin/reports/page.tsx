'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type ReportTab = 'daily' | 'monthly' | 'payments' | 'bookkeeping';

export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(true);
  const [tab, setTab] = useState<ReportTab>('daily');
  const [bookkeepingTab, setBookkeepingTab] = useState<'daily' | 'monthly'>('daily');
  const allowedReportStatuses = useMemo(
    () => new Set(['confirmed', 'preparing', 'out for delivery', 'delivered']),
    []
  );

  const [ordersStatus, setOrdersStatus] = useState('');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersFrom, setOrdersFrom] = useState<Date | undefined>(undefined);
  const [ordersTo, setOrdersTo] = useState<Date | undefined>(undefined);
  const [paymentsFrom, setPaymentsFrom] = useState<Date | undefined>(undefined);
  const [paymentsTo, setPaymentsTo] = useState<Date | undefined>(undefined);
  const [monthlyKey, setMonthlyKey] = useState('');
  const [monthlyFrom, setMonthlyFrom] = useState('');
  const [monthlyTo, setMonthlyTo] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const paymentsResponse = await fetch(`${API_BASE_URL}/api/payments`);
        const paymentsResult = await paymentsResponse.json();
        if (paymentsResult.success && Array.isArray(paymentsResult.data)) {
          setPayments(paymentsResult.data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!monthlyKey) setMonthlyKey(defaultMonthKey);
  }, [defaultMonthKey, monthlyKey]);

  const monthRange = (key: string) => {
    if (!key) return { from: '', to: '' };
    const [yearStr, monthStr] = key.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(month)) return { from: '', to: '' };
    const lastDay = new Date(year, month, 0).getDate();
    return { from: `${key}-01`, to: `${key}-${String(lastDay).padStart(2, '0')}` };
  };

  const fetchReportOrders = async (from: string, to: string, status: string) => {
    setIsReportLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (status) params.set('status', status);
      const response = await fetch(`${API_BASE_URL}/api/reports/orders?${params.toString()}`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setOrders(result.data);
      } else {
        setOrders([]);
      }
    } finally {
      setIsReportLoading(false);
    }
  };

  const formatDateParam = (value: Date | undefined) => {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
  };

  const fetchReportOrdersData = async (from: string, to: string, status: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (status) params.set('status', status);
    const response = await fetch(`${API_BASE_URL}/api/reports/orders?${params.toString()}`);
    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    return [];
  };

  useEffect(() => {
    if (tab === 'payments') return;
    if (tab === 'daily') {
      fetchReportOrders(todayKey, todayKey, '');
      return;
    }
    if (tab === 'monthly') {
      const range = monthRange(monthlyKey || defaultMonthKey);
      fetchReportOrders(range.from, range.to, '');
      return;
    }
    if (tab === 'orders') {
      fetchReportOrders(formatDateParam(ordersFrom), formatDateParam(ordersTo), ordersStatus);
    }
  }, [tab, monthlyKey, ordersFrom, ordersTo, ordersStatus, todayKey, defaultMonthKey]);

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

  const filteredPayments = useMemo(() => {
    if (!paymentsFrom && !paymentsTo) return receivedPayments;
    return receivedPayments.filter((p) => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      if (paymentsFrom) {
        const start = new Date(paymentsFrom);
        start.setHours(0, 0, 0, 0);
        if (created < start) return false;
      }
      if (paymentsTo) {
        const end = new Date(paymentsTo);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      return true;
    });
  }, [receivedPayments, paymentsFrom, paymentsTo]);

  const customerNameByOrder = useMemo(() => {
    const map: Record<string, string> = {};
    orders.forEach((order) => {
      if (order?.id) {
        map[String(order.id)] = order.customer_name || '';
      }
    });
    return map;
  }, [orders]);

  const reportOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = String(order.status || '').toLowerCase();
      return allowedReportStatuses.has(status);
    });
  }, [orders, allowedReportStatuses]);

  const buildVatBuckets = (items: any[]) => {
    const buckets: Record<number, number> = { 6: 0, 12: 0, 21: 0 };
    items.forEach((item: any) => {
      const rateRaw = item.tax_percent;
      const rate = rateRaw !== null && rateRaw !== undefined && rateRaw !== '' ? Number(rateRaw) : 0;
      if (rate !== 6 && rate !== 12 && rate !== 21) return;
      const net = Number(item.total_price || 0);
      buckets[rate] += net * (rate / 100);
    });
    return buckets;
  };

  const bookkeepingDailyRows = useMemo(() => {
    const byDate: Record<string, { date: string; turnover: number; vat6: number; vat12: number; vat21: number }> = {};
    reportOrders.forEach((order) => {
      if (!order.created_at) return;
      const dateKey = new Date(order.created_at).toISOString().slice(0, 10);
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, turnover: 0, vat6: 0, vat12: 0, vat21: 0 };
      }
      byDate[dateKey].turnover += Number(order.total_amount || 0);
      const items = Array.isArray(order.items) ? order.items : [];
      const buckets = buildVatBuckets(items);
      byDate[dateKey].vat6 += buckets[6] || 0;
      byDate[dateKey].vat12 += buckets[12] || 0;
      byDate[dateKey].vat21 += buckets[21] || 0;
    });
    return Object.values(byDate).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [reportOrders]);

  const bookkeepingMonthlyRows = useMemo(() => {
    const byMonth: Record<string, { month: string; turnover: number; vat6: number; vat12: number; vat21: number }> = {};
    reportOrders.forEach((order) => {
      if (!order.created_at) return;
      const created = new Date(order.created_at);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) {
        byMonth[key] = { month: key, turnover: 0, vat6: 0, vat12: 0, vat21: 0 };
      }
      byMonth[key].turnover += Number(order.total_amount || 0);
      const items = Array.isArray(order.items) ? order.items : [];
      const buckets = buildVatBuckets(items);
      byMonth[key].vat6 += buckets[6] || 0;
      byMonth[key].vat12 += buckets[12] || 0;
      byMonth[key].vat21 += buckets[21] || 0;
    });
    return Object.values(byMonth).sort((a, b) => (a.month > b.month ? 1 : -1));
  }, [reportOrders]);

  const summary = useMemo(() => {
    return reportOrders.reduce(
      (acc, order) => {
        acc.orders += 1;
        acc.subtotal += Number(order.subtotal || 0);
        acc.tax += Number(order.tax_amount || 0);
        acc.shipping += Number(order.shipping_fee || 0);
        acc.discount += Number(order.discount_amount || 0);
        acc.total += Number(order.total_amount || 0);
        return acc;
      },
      { orders: 0, subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0 }
    );
  }, [reportOrders]);

  const vatSummary = useMemo(() => {
    const buckets: Record<string, { rate: number; net: number; vat: number; gross: number }> = {};
    reportOrders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const rateRaw = item.tax_percent;
        const rate = rateRaw !== null && rateRaw !== undefined && rateRaw !== '' ? Number(rateRaw) : 0;
        const key = Number.isFinite(rate) ? String(rate) : '0';
        const net = Number(item.total_price || 0);
        const vat = Number.isFinite(rate) ? net * (rate / 100) : 0;
        if (!buckets[key]) {
          buckets[key] = { rate: Number.isFinite(rate) ? rate : 0, net: 0, vat: 0, gross: 0 };
        }
        buckets[key].net += net;
        buckets[key].vat += vat;
        buckets[key].gross += net + vat;
      });
    });
    return Object.values(buckets).sort((a, b) => a.rate - b.rate);
  }, [reportOrders]);

  const paymentByOrder = useMemo(() => {
    const map: Record<string, any> = {};
    payments.forEach((p) => {
      const key = String(p.order_id || '');
      if (!key) return;
      if (!map[key]) map[key] = p;
    });
    return map;
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

  const exportDetailedOrders = (fileName: string, rows: any[]) => {
    const lineItems = rows.flatMap((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      if (items.length === 0) {
        return [[
          order.order_code || order.order_number || order.id || '',
          order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : '',
          order.customer_name || '',
          '',
          '',
          '',
          '',
          '',
          '',
          ''
        ]];
      }
      return items.map((item: any) => {
        const rateRaw = item.tax_percent;
        const rate = rateRaw !== null && rateRaw !== undefined && rateRaw !== '' ? Number(rateRaw) : 0;
        const net = Number(item.total_price || 0);
        const vat = Number.isFinite(rate) ? net * (rate / 100) : 0;
        const gross = net + vat;
        return [
          order.order_code || order.order_number || order.id || '',
          order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : '',
          order.customer_name || '',
          item.product_name || '',
          item.variant_name || '',
          Number(item.quantity || 0),
          Number(item.unit_price || 0).toFixed(2),
          Number(item.total_price || 0).toFixed(2),
          Number.isFinite(rate) ? rate.toFixed(2) : '0',
          gross.toFixed(2)
        ];
      });
    });

    downloadCsv(
      fileName,
      ['Order ID', 'Date', 'Customer', 'Product', 'Variant', 'Qty', 'Unit Price', 'Line Total', 'Tax Rate %', 'Gross (Line)'],
      lineItems
    );
  };

  const exportVatSummary = (fileName: string) => {
    downloadCsv(
      fileName,
      ['Tax Rate %', 'Net Amount', 'VAT Amount', 'Gross Amount'],
      vatSummary.map((row) => [
        row.rate.toFixed(2),
        row.net.toFixed(2),
        row.vat.toFixed(2),
        row.gross.toFixed(2)
      ])
    );
  };

  const buildOrderReportRows = (rows: any[]) => {
    return rows.map((order) => {
      const pay = paymentByOrder[String(order.id || '')];
      const items = Array.isArray(order.items) ? order.items : [];
      const vatBuckets: Record<number, number> = {};
      items.forEach((i: any) => {
        const rateRaw = i.tax_percent;
        const rate = rateRaw !== null && rateRaw !== undefined && rateRaw !== '' ? Number(rateRaw) : 0;
        const safe = Number.isFinite(rate) ? rate : 0;
        const net = Number(i.total_price || 0);
        if (!vatBuckets[safe]) vatBuckets[safe] = 0;
        vatBuckets[safe] += net * (safe / 100);
      });
      const vatTotal = Object.values(vatBuckets).reduce((sum, v) => sum + v, 0);
      return {
        orderId: order.order_code || order.order_number || order.id || '',
        orderNumber: order.order_number || '',
        customer: order.customer_name || '',
        phone: order.customer_phone || '',
        date: order.created_at ? new Date(order.created_at).toISOString().slice(0, 10) : '',
        paymentMethod: pay?.method || '',
        transactionId: pay?.transaction_id || '',
        paymentDate: pay?.created_at ? new Date(pay.created_at).toISOString().slice(0, 10) : '',
        paymentStatus: pay?.status || '',
        total: Number(order.total_amount || 0),
        tax: Number(order.tax_amount || 0),
        discount: Number(order.discount_amount || 0),
        vat: vatTotal,
        vatBuckets
      };
    });
  };

  const exportOrderDetailRows = (fileName: string, rows: any[]) => {
    const data = buildOrderReportRows(rows);
    const vatRates = Array.from(
      new Set(
        data.flatMap((row) => Object.keys(row.vatBuckets || {}).map((r) => Number(r)))
      )
    ).filter((r) => Number.isFinite(r)).sort((a, b) => a - b);
    downloadCsv(
      fileName,
      [
        'Order ID',
        'Order Number',
        'Customer',
        'Phone',
        'Date',
        'Payment Method',
        'Transaction ID',
        'Payment Date',
        'Payment Status',
        'Tax',
        'Discount',
        ...vatRates.map((r) => `VAT ${r}%`),
        'Total VAT',
        'Total'
      ],
      data.map((r) => [
        r.orderId,
        r.orderNumber,
        r.customer,
        r.phone,
        r.date,
        r.paymentMethod,
        r.transactionId,
        r.paymentDate,
        r.paymentStatus,
        Number(r.tax || 0).toFixed(2),
        Number(r.discount || 0).toFixed(2),
        ...vatRates.map((rate) => Number(r.vatBuckets?.[rate] || 0).toFixed(2)),
        Number(r.vat || 0).toFixed(2),
        Number(r.total || 0).toFixed(2)
      ])
    );
  };

  const buildVatTotals = (rows: any[]) => {
    const buckets: Record<number, number> = { 6: 0, 12: 0, 21: 0 };
    rows.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const rateRaw = item.tax_percent;
        const rate = rateRaw !== null && rateRaw !== undefined && rateRaw !== '' ? Number(rateRaw) : 0;
        if (!Number.isFinite(rate)) return;
        if (rate !== 6 && rate !== 12 && rate !== 21) return;
        const net = Number(item.total_price || 0);
        buckets[rate] += net * (rate / 100);
      });
    });
    const totalVat = buckets[6] + buckets[12] + buckets[21];
    return { buckets, totalVat };
  };

  const buildSummaryRow = (label: string, rows: any[]) => {
    const turnover = rows.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const { buckets, totalVat } = buildVatTotals(rows);
    return {
      label,
      turnover,
      vat6: buckets[6] || 0,
      vat12: buckets[12] || 0,
      vat21: buckets[21] || 0,
      totalVat
    };
  };

  const monthlyDailySummaryRows = useMemo(() => {
    const byDate: Record<string, any[]> = {};
    reportOrders.forEach((order) => {
      if (!order.created_at) return;
      const dateKey = new Date(order.created_at).toISOString().slice(0, 10);
      if (!byDate[dateKey]) byDate[dateKey] = [];
      byDate[dateKey].push(order);
    });
    return Object.keys(byDate)
      .sort()
      .map((dateKey) => buildSummaryRow(dateKey, byDate[dateKey] || []));
  }, [reportOrders]);

  const exportSummaryRows = (fileName: string, rows: Array<{ label: string; turnover: number; vat6: number; vat12: number; vat21: number; totalVat: number }>) => {
    downloadCsv(
      fileName,
      ['Date', 'Total Turnover', 'VAT 6%', 'VAT 12%', 'VAT 21%', 'Total VAT'],
      rows.map((r) => [
        r.label,
        Number(r.turnover || 0).toFixed(2),
        Number(r.vat6 || 0).toFixed(2),
        Number(r.vat12 || 0).toFixed(2),
        Number(r.vat21 || 0).toFixed(2),
        Number(r.totalVat || 0).toFixed(2)
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
          <Button variant={tab === 'bookkeeping' ? 'default' : 'outline'} onClick={() => setTab('bookkeeping')}>Bookkeeping</Button>
          <Button variant={tab === 'payments' ? 'default' : 'outline'} onClick={() => setTab('payments')}>Payments Received</Button>
        </div>

        {tab === 'daily' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2"
                  onClick={() => exportSummaryRows(`daily-summary-${todayKey}.csv`, [buildSummaryRow(todayKey, reportOrders)])}
                  disabled={reportOrders.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Daily Summary CSV
                </Button>
              </div>
            </div>
            <SummaryCards summary={summary} />
            <OrderSummaryTable rows={[buildSummaryRow(todayKey, reportOrders)]} />
          </div>
        )}

        {tab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Month</label>
                  <input
                    type="month"
                    className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                    value={monthlyKey}
                    onChange={(e) => setMonthlyKey(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2"
                  onClick={() => exportSummaryRows(`monthly-summary-${monthlyKey || defaultMonthKey}.csv`, monthlyDailySummaryRows)}
                  disabled={monthlyDailySummaryRows.length === 0}
                >
                  <Download className="w-4 h-4" />
                  Export Monthly Summary CSV
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground">From Month</label>
                <input
                  type="month"
                  className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={monthlyFrom}
                  onChange={(e) => setMonthlyFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To Month</label>
                <input
                  type="month"
                  className="mt-1 px-3 py-2 rounded-md bg-card border border-border text-foreground text-sm"
                  value={monthlyTo}
                  onChange={(e) => setMonthlyTo(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  const range = monthRange(monthlyFrom || defaultMonthKey);
                  const rangeTo = monthRange(monthlyTo || monthlyFrom || defaultMonthKey);
                  const data = await fetchReportOrdersData(range.from, rangeTo.to, '');
                  const filtered = data.filter((order: any) => {
                    const status = String(order.status || '').toLowerCase();
                    return allowedReportStatuses.has(status);
                  });
                  const fromDate = new Date(range.from);
                  const toDate = new Date(rangeTo.to);
                  const rows: Array<{ label: string; turnover: number; vat6: number; vat12: number; vat21: number; totalVat: number }> = [];
                  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
                  const end = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
                  while (cursor <= end) {
                    const key = cursor.toISOString().slice(0, 10);
                    const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 0, 0, 0, 0);
                    const dayEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 23, 59, 59, 999);
                    const dayRows = filtered.filter((order: any) => {
                      if (!order.created_at) return false;
                      const created = new Date(order.created_at);
                      return created >= dayStart && created <= dayEnd;
                    });
                    rows.push(buildSummaryRow(key, dayRows));
                    cursor.setDate(cursor.getDate() + 1);
                  }
                  exportSummaryRows(`monthly-range-${range.from}-to-${rangeTo.to}.csv`, rows);
                }}
                disabled={!monthlyFrom || !monthlyTo}
              >
                <Download className="w-4 h-4" />
                Export Month Range CSV
              </Button>
            </div>
            <SummaryCards summary={summary} />
            <OrderSummaryTable rows={monthlyDailySummaryRows} />
          </div>
        )}


        {tab === 'bookkeeping' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={bookkeepingTab === 'daily' ? 'default' : 'outline'} onClick={() => setBookkeepingTab('daily')}>Daily</Button>
              <Button variant={bookkeepingTab === 'monthly' ? 'default' : 'outline'} onClick={() => setBookkeepingTab('monthly')}>Monthly</Button>
            </div>
            {bookkeepingTab === 'daily' ? (
              <BookkeepingTable rows={bookkeepingDailyRows} mode="daily" />
            ) : (
              <BookkeepingTable rows={bookkeepingMonthlyRows} mode="monthly" />
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-[180px] justify-start text-left font-normal', !paymentsFrom && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentsFrom ? format(paymentsFrom, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={paymentsFrom} onSelect={setPaymentsFrom} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn('w-[180px] justify-start text-left font-normal', !paymentsTo && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentsTo ? format(paymentsTo, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={paymentsTo} onSelect={setPaymentsTo} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button
                className="gap-2"
                onClick={() =>
                  downloadCsv(
                    'payments-received.csv',
                    ['Order ID', 'Customer', 'Amount', 'Method', 'Transaction ID', 'Status', 'Paid At'],
                    filteredPayments.map((p) => [
                      p.order_id || '',
                      customerNameByOrder[String(p.order_id || '')] || '',
                      Number(p.amount || 0).toFixed(2),
                      p.method || '',
                      p.transaction_id || '',
                      p.status || '',
                      p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : ''
                    ])
                  )
                }
                disabled={filteredPayments.length === 0}
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
                      <th className="text-left px-6 py-3 font-medium">Customer</th>
                      <th className="text-right px-6 py-3 font-medium">Amount</th>
                      <th className="text-left px-6 py-3 font-medium">Method</th>
                      <th className="text-left px-6 py-3 font-medium">Transaction ID</th>
                      <th className="text-left px-6 py-3 font-medium">Status</th>
                      <th className="text-left px-6 py-3 font-medium">Paid At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                          {isLoading ? 'Loading payments...' : 'No received payments found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="px-6 py-3 text-foreground whitespace-nowrap">{p.order_id || '-'}</td>
                          <td className="px-6 py-3 text-foreground whitespace-nowrap">{customerNameByOrder[String(p.order_id || '')] || '-'}</td>
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

function SummaryCards({ summary }: { summary: { orders: number; subtotal: number; tax: number; shipping: number; discount: number; total: number } }) {
  const cards = [
    { label: 'Orders', value: summary.orders.toString() },
    { label: 'Subtotal', value: formatCurrency(summary.subtotal) },
    { label: 'Tax', value: formatCurrency(summary.tax) },
    { label: 'Shipping', value: formatCurrency(summary.shipping) },
    { label: 'Discounts', value: formatCurrency(summary.discount) },
    { label: 'Total', value: formatCurrency(summary.total) }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="border border-border rounded-lg bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="text-base font-semibold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function OrderSummaryTable({
  rows
}: {
  rows: Array<{ label: string; turnover: number; vat6: number; vat12: number; vat21: number; totalVat: number }>;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Total Turnover</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">VAT 6%</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">VAT 12%</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">VAT 21%</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Total VAT</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  No summary available.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.label}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.turnover)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.vat6)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.vat12)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.vat21)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.totalVat)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderDetailTable({
  rows,
  isLoading
}: {
  rows: Array<any>;
  isLoading: boolean;
}) {
  const vatRates = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row.vatBuckets || {}).map((r) => Number(r))))
  ).filter((r) => Number.isFinite(r)).sort((a, b) => a - b);
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Order ID</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Order Number</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Customer</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Phone</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Date</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Payment Method</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Transaction ID</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Payment Date</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Payment Status</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Tax</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Discount</th>
              {vatRates.map((rate) => (
                <th key={`vat-${rate}`} className="text-right px-4 py-3 font-medium whitespace-nowrap">VAT {rate}%</th>
              ))}
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Total VAT</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={13 + vatRates.length} className="px-6 py-8 text-center text-muted-foreground">
                  {isLoading ? 'Loading orders...' : 'No orders found.'}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.orderId} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.orderId}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.orderNumber || '-'}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.customer}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.phone}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.date}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.paymentMethod || '-'}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.transactionId || '-'}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.paymentDate || '-'}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.paymentStatus || '-'}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.tax || 0)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.discount || 0)}</td>
                  {vatRates.map((rate) => (
                    <td key={`${row.orderId}-vat-${rate}`} className="px-4 py-3 text-right text-foreground whitespace-nowrap">
                      {formatCurrency(row.vatBuckets?.[rate] || 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.vat || 0)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.total || 0)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BookkeepingTable({
  rows,
  mode
}: {
  rows: Array<{ date?: string; month?: string; turnover: number; vat6: number; vat12: number; vat21: number }>;
  mode: 'daily' | 'monthly';
}) {
  const label = mode === 'daily' ? 'Date' : 'Month';
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">{label}</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">Total Sales</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">VAT 6%</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">VAT 12%</th>
              <th className="text-right px-4 py-3 font-medium whitespace-nowrap">VAT 21%</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No bookkeeping data found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.date || row.month} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{row.date || row.month}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.turnover)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.vat6)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.vat12)}</td>
                  <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">{formatCurrency(row.vat21)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
