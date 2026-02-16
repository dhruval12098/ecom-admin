'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Download } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = String(params?.orderId || '');
  const orderStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState('Pending');
  const [pendingStatus, setPendingStatus] = useState('Pending');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const statusTone: Record<string, string> = {
    Pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    Confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
    Preparing: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
    'Out for Delivery': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
    Delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    Cancelled: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        if (!orderId) return;
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch');
        setOrder(result.data);
        const status = result.data.status || 'Pending';
        setCurrentStatus(status);
        setPendingStatus(status);
      } catch (err: any) {
        setError(err?.message || 'Failed to load order');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    try {
      setIsDownloadingInvoice(true);
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/invoice`);
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition') || '';
      const match = contentDisposition.match(/filename="([^"]+)"/);
      const fallbackName = `invoice-${order?.order_code || order?.order_number || orderId}.pdf`;
      const filename = match?.[1] || fallbackName;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // keep UI stable if download fails
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <Link href="/admin/orders">
              <Button variant="outline" size="icon" aria-label="Back to orders">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-foreground">
                  Order {order?.order_number || orderId}
                </h1>
                <Badge className={`border border-transparent ${statusTone[currentStatus] || 'bg-muted text-foreground'}`}>
                  {currentStatus}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {order?.created_at ? `Placed on ${new Date(order.created_at).toLocaleDateString()}` : 'Order details'}
              </p>
            </div>
          </div>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={handleDownloadInvoice} disabled={isDownloadingInvoice}>
                <Download className="w-4 h-4" />
                {isDownloadingInvoice ? 'Downloading...' : 'Download Invoice'}
              </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-xl font-semibold text-foreground mt-2">
              {formatCurrency(order?.total_amount || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {order?.items?.length || 0} items
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment</p>
            <p className="text-base font-semibold text-foreground mt-2">
              {order?.payments?.[0]?.payment_method || order?.payments?.[0]?.method || order?.payment_method || 'Not set'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {order?.payments?.[0]?.status || 'Pending'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery</p>
            <p className="text-base font-semibold text-foreground mt-2">
              {order?.shipping_method || order?.shippingMethod || 'Standard'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {order?.address_city ? `${order.address_city}, ${order.address_country}` : 'Address pending'}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Order Status</p>
            <p className="text-base font-semibold text-foreground mt-2">{currentStatus}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {order?.created_at ? new Date(order.created_at).toLocaleString() : '—'}
            </p>
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-base font-semibold text-foreground">Order Status</h2>
                  <Badge className={`border border-transparent ${statusTone[currentStatus] || 'bg-muted text-foreground'}`}>
                    {currentStatus}
                  </Badge>
              </div>
              {isLoading && <div className="text-sm text-muted-foreground mt-4">Loading...</div>}
              {!isLoading && error && <div className="text-sm text-destructive mt-4">{error}</div>}
                <div className="mt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    {orderStatuses.map((status, index) => {
                      const isComplete = orderStatuses.indexOf(currentStatus) > index;
                      const isActive = status === currentStatus;
                      const isUpcoming = orderStatuses.indexOf(currentStatus) < index;
                      return (
                        <div key={status} className="relative flex flex-col items-center gap-2">
                          <div className="relative flex items-center w-full">
                            {index > 0 && (
                              <span
                                className={`absolute left-0 right-1/2 h-0.5 transition-colors duration-300 ${
                                  isComplete ? 'bg-primary' : 'bg-border'
                                }`}
                                aria-hidden="true"
                              />
                            )}
                            {index < orderStatuses.length - 1 && (
                              <span
                                className={`absolute left-1/2 right-0 h-0.5 transition-colors duration-300 ${
                                  isComplete || isActive ? 'bg-primary/60' : 'bg-border'
                                }`}
                                aria-hidden="true"
                              />
                            )}
                            <div
                              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ease-out ${
                                isComplete || isActive
                                  ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                              aria-current={isActive ? 'step' : undefined}
                            >
                              {isComplete ? <Check className="w-4 h-4" /> : index + 1}
                            </div>
                          </div>
                          <div className="text-center">
                            <p
                              className={`text-sm font-medium transition-colors ${
                                isActive ? 'text-foreground' : isUpcoming ? 'text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {status}
                            </p>
                            {isActive && (
                              <p className="text-xs text-primary mt-1">Currently at this stage</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              <div className="mt-6 pt-6 border-t border-border">
                <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Update Status
                </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={pendingStatus} onValueChange={setPendingStatus}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {orderStatuses.map((s) => (
                          <SelectItem
                            key={s}
                            value={s}
                            disabled={currentStatus !== 'Confirmed' && s !== 'Confirmed' && s !== currentStatus}
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <Button
                    onClick={async () => {
                      if (!orderId || pendingStatus === currentStatus) return;
                      setIsSavingStatus(true);
                      try {
                        await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: pendingStatus })
                        });
                        setCurrentStatus(pendingStatus);
                        setOrder((prev: any) => (prev ? { ...prev, status: pendingStatus } : prev));
                      } catch (e) {
                        // keep UI stable on failure
                      } finally {
                        setIsSavingStatus(false);
                      }
                    }}
                    disabled={pendingStatus === currentStatus || isSavingStatus}
                  >
                    {isSavingStatus ? 'Saving...' : 'Save Status'}
                  </Button>
                </div>
              </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">Order Items</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-left font-medium py-2">Product</th>
                      <th className="text-center font-medium py-2">Qty</th>
                      <th className="text-right font-medium py-2">Unit</th>
                      <th className="text-right font-medium py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order?.items || []).map((item: any) => (
                      <tr key={item.id} className="border-b border-border last:border-b-0">
                        <td className="py-3">
                          <p className="font-medium text-foreground">{item.product_name}</p>
                          {item.variant_name && (
                            <p className="text-xs text-muted-foreground">{item.variant_name}</p>
                          )}
                        </td>
                        <td className="py-3 text-center text-foreground">{item.quantity}</td>
                        <td className="py-3 text-right text-muted-foreground">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 text-right font-semibold text-foreground">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">Payment Summary</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order?.subtotal || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Tax (5%)</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order?.tax_amount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Delivery Charges</span>
                  <span className="font-semibold text-foreground">{formatCurrency(order?.shipping_fee || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Coupon</span>
                  <span className="font-semibold text-foreground">
                    {order?.coupon_code ? String(order.coupon_code).toUpperCase() : 'None'}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total Amount</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(order?.total_amount || 0)}</span>
                  </div>
                </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm gap-3">
                      <span className="text-muted-foreground">Payment method</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                        {order?.payments?.[0]?.payment_method || order?.payments?.[0]?.method || order?.payment_method || 'Not set'}
                        </span>
                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 text-xs font-semibold">
                          {order?.payments?.[0]?.status || 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-base font-semibold text-foreground mb-4">Customer Details</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Name</p>
                  <p className="text-foreground font-medium">{order?.customer_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="text-foreground">{order?.customer_email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Phone</p>
                  <p className="text-foreground">{order?.customer_phone || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">Delivery Address</h2>
              <p className="text-foreground text-sm">
                {order?.address_street} {order?.address_house}<br />
                {order?.address_apartment && (<>{order.address_apartment}<br /></>)}
                {order?.address_city} - {order?.address_postal_code}<br />
                {order?.address_country}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">Timeline</h2>
              <div className="space-y-3 text-sm">
                {(order?.status_history || []).map((entry: any) => (
                  <div key={entry.id}>
                    <p className="font-medium text-foreground">{entry.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.changed_at ? new Date(entry.changed_at).toLocaleString() : ''}
                    </p>
                  </div>
                ))}
                {(!order?.status_history || order.status_history.length === 0) && (
                  <div className="text-xs text-muted-foreground">No timeline available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
