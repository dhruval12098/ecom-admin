'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function OrderDetailsPage({ params }: { params: { orderId: string } }) {
  const orderStatuses = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
  const currentStatus = 'Confirmed';

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
            <h1 className="text-3xl font-semibold text-foreground">Order {params.orderId}</h1>
            <p className="text-muted-foreground text-sm mt-1">Order placed on Jan 20, 2024</p>
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
                <select className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Confirmed</option>
                  <option>Preparing</option>
                  <option>Out for Delivery</option>
                  <option>Delivered</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Items</h2>
              <div className="space-y-3">
                {[
                  { name: 'Butter Chicken', quantity: 2, price: 220, subtotal: 440 },
                  { name: 'Naan Bread', quantity: 4, price: 50, subtotal: 200 },
                  { name: 'Biryani', quantity: 1, price: 250, subtotal: 250 },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between pb-3 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">₹{item.subtotal}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price}/unit</p>
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
                  <span className="font-semibold text-foreground">₹890</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Tax (5%)</span>
                  <span className="font-semibold text-foreground">₹44.50</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground">Delivery Charges</span>
                  <span className="font-semibold text-foreground">₹50</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total Amount</span>
                    <span className="text-xl font-bold text-primary">₹984.50</span>
                  </div>
                </div>
                <Badge className="mt-4 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 w-full justify-center">
                  Paid via Online Payment
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
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Delivery Address</h2>
              <p className="text-foreground text-sm">
                123 Main Street,<br />
                Apartment 4B,<br />
                Delhi - 110001
              </p>
            </div>

            {/* Order Timeline */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">Order Placed</p>
                  <p className="text-xs text-muted-foreground">Jan 20, 2024 2:30 PM</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Payment Received</p>
                  <p className="text-xs text-muted-foreground">Jan 20, 2024 2:31 PM</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Order Confirmed</p>
                  <p className="text-xs text-muted-foreground">Jan 20, 2024 2:35 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
