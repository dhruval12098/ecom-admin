'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const customerId = Number(params?.id);
  const [customer, setCustomer] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!Number.isFinite(customerId)) {
          throw new Error('Invalid customer id');
        }

        const [customersRes, ordersRes, addressesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/customers`),
          fetch(`${API_BASE_URL}/api/orders?customerId=${customerId}`),
          fetch(`${API_BASE_URL}/api/customer-addresses?customerId=${customerId}`)
        ]);

        const [customersJson, ordersJson, addressesJson] = await Promise.all([
          customersRes.json(),
          ordersRes.json(),
          addressesRes.json()
        ]);

        if (!customersJson?.success) throw new Error(customersJson?.error || 'Failed to fetch customer');
        const found = (Array.isArray(customersJson?.data) ? customersJson.data : []).find(
          (item: any) => Number(item.id) === customerId
        );
        if (!found) throw new Error('Customer not found');

        setCustomer(found);
        setOrders(Array.isArray(ordersJson?.data) ? ordersJson.data : []);
        setAddresses(Array.isArray(addressesJson?.data) ? addressesJson.data : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load customer details');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [customerId]);

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    return { totalOrders, totalSpent, avgOrderValue };
  }, [orders]);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{customer?.full_name || 'Customer'}</h1>
            <p className="text-muted-foreground text-sm mt-1">Customer profile and history</p>
          </div>
        </div>

        {isLoading && (
          <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">
            Loading customer details...
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-card border border-border rounded-lg p-6 text-sm text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && customer && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Full Name</p>
                    <p className="text-foreground font-medium">{customer.full_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{customer.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Phone</p>
                    <p className="text-foreground">{customer.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Status</p>
                    <Badge className="mt-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Order History</h2>
                <div className="space-y-3">
                  {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders found.</p>}
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between pb-3 border-b border-border last:border-b-0">
                      <div>
                        <p className="font-medium text-foreground">
                          {order.order_code || order.order_number || `#${order.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(Number(order.total_amount || 0))}</p>
                        <Badge className="mt-1 bg-muted text-foreground">{order.status || 'Pending'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Summary</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold text-primary">{summary.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Average Order Value</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(summary.avgOrderValue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Addresses</h2>
                <div className="space-y-3">
                  {addresses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No addresses found.</p>
                  )}
                  {addresses.map((address) => (
                    <div key={address.id} className="p-3 rounded-md border border-border bg-muted/30">
                      <p className="text-sm font-medium text-foreground">
                        {address.label || (address.is_default ? 'Default Address' : 'Address')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {address.street || ''} {address.house || ''}
                        {address.apartment ? `, ${address.apartment}` : ''}
                        <br />
                        {address.postal_code || ''} {address.city || ''}
                        <br />
                        {address.country || ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
