'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CouponsPage() {
  const coupons = [
    { id: 1, code: 'SAVE10', type: 'Percentage', value: '10%', expiryDate: 'Feb 28, 2024', used: 245, status: 'Active' },
    { id: 2, code: 'FLAT50', type: 'Fixed', value: '₹50', expiryDate: 'Mar 31, 2024', used: 128, status: 'Active' },
    { id: 3, code: 'WELCOME20', type: 'Percentage', value: '20%', expiryDate: 'Jan 25, 2024', used: 512, status: 'Active' },
    { id: 4, code: 'OLDYEAR', type: 'Percentage', value: '15%', expiryDate: 'Jan 15, 2024', used: 0, status: 'Expired' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Coupons</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage discount coupons</p>
          </div>
          <Link href="/admin/coupons/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Coupon
            </Button>
          </Link>
        </div>

        {/* Coupons Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Coupon Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Discount Value</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Used</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{coupon.code}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{coupon.type}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{coupon.value}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{coupon.expiryDate}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{coupon.used} times</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        className={
                          coupon.status === 'Active'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                        }
                      >
                        {coupon.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button className="text-primary hover:text-primary/80 font-medium">Edit</button>
                      <button className="text-destructive hover:text-destructive/80 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
