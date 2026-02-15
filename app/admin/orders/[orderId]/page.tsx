'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
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

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/orders">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Order {order?.order_number || orderId}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {order?.created_at ? `Order placed on ${new Date(order.created_at).toLocaleDateString()}` : 'Order details'}
            </p>
          </div>
          <Button className="ml-auto gap-2">
            <Download className="w-4 h-4" />
            Download Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Status</h2>
              {isLoading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {!isLoading && error && <div className="text-sm text-destructive">{error}</div>}
              <div className="space-y-3">
                {orderStatuses.map((status, index) => (
                  <div key={status} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      orderStatuses.indexOf(currentStatus) >= index
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {orderStatuses.indexOf(currentStatus) > index ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${
                        status === currentStatus ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {status}
                      </p>
                      {status === currentStatus && (
                        <p className="text-xs text-primary">Currently at this stage</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Update Status */}
              <div className="mt-6 pt-6 border-t border-border">
                <label className="block text-sm font-medium text-foreground mb-2">Update Status</label>
                <Select value={pendingStatus} onValueChange={setPendingStatus}>
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-3 flex justify-end">
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

            {/* Order Items */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Items</h2>
              <div className="space-y-3">
                {(order?.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between pb-3 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{formatCurrency(item.total_price)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)}/unit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Payment Status</h2>
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
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total Amount</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(order?.total_amount || 0)}</span>
                  </div>
                </div>
                <Badge className="mt-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 w-full justify-center">
                  {order?.payments?.[0]?.status || 'Pending'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Sidebar - Customer & Delivery Info */}
          <div className="space-y-6">
            {/* Customer Details */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Customer Details</h2>
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

            {/* Delivery Address */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Address</h2>
              <p className="text-foreground text-sm">
                {order?.address_street} {order?.address_house}<br />
                {order?.address_apartment && (<>{order.address_apartment}<br /></>)}
                {order?.address_city} - {order?.address_postal_code}<br />
                {order?.address_country}
              </p>
            </div>

            {/* Order Timeline */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
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
