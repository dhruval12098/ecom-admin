'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">John Doe</h1>
            <p className="text-muted-foreground text-sm mt-1">Customer profile and history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Full Name</p>
                  <p className="text-foreground font-medium">John Doe</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="text-foreground">john@example.com</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Phone</p>
                  <p className="text-foreground">+91 98765 43210</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <Badge className="mt-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order History</h2>
              <div className="space-y-3">
                {[
                  { id: 'ORD-001', date: 'Jan 20, 2024', amount: '€450', status: 'Delivered' },
                  { id: 'ORD-002', date: 'Jan 18, 2024', amount: '€320', status: 'Delivered' },
                  { id: 'ORD-003', date: 'Jan 15, 2024', amount: '€580', status: 'Delivered' },
                ].map((order) => (
                  <div key={order.id} className="flex items-center justify-between pb-3 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium text-foreground">{order.id}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{order.amount}</p>
                      <Badge className="mt-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Summary</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-primary">12</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-primary">€5,240</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Average Order Value</p>
                  <p className="text-2xl font-bold text-primary">€436.67</p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Addresses</h2>
              <div className="space-y-3">
                <div className="p-3 rounded-md border border-border bg-muted/30">
                  <p className="text-sm font-medium text-foreground">Home</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    123 Main Street, Apartment 4B<br />
                    Delhi - 110001
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
