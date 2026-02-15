'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/coupons`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch');
        setCoupons(Array.isArray(result.data) ? result.data : []);
      } catch (err: any) {
        setError(err?.message || 'Failed to load coupons');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/coupons/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Delete failed');
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      // keep UI stable on failure
    }
  };

  const rows = useMemo(() => {
    return coupons.map((c) => {
      const typeLabel = c.discount_type === 'fixed' ? 'Fixed' : 'Percentage';
      const valueLabel =
        c.discount_type === 'fixed' ? `EUR ${c.discount_value}` : `${c.discount_value}%`;
      const expiryLabel = c.expiry_date
        ? new Date(c.expiry_date).toLocaleDateString()
        : '-';
      const usedLabel = c.used_count ?? 0;
      const statusLabel = c.status ? String(c.status) : 'unknown';

      return {
        ...c,
        typeLabel,
        valueLabel,
        expiryLabel,
        usedLabel,
        statusLabel
      };
    });
  }, [coupons]);

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
                {isLoading && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={7}>
                      Loading coupons...
                    </td>
                  </tr>
                )}
                {!isLoading && error && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-destructive" colSpan={7}>
                      {error}
                    </td>
                  </tr>
                )}
                {!isLoading && !error && rows.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={7}>
                      No coupons found.
                    </td>
                  </tr>
                )}
                {!isLoading && !error && rows.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{coupon.code}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{coupon.typeLabel}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{coupon.valueLabel}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{coupon.expiryLabel}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{coupon.usedLabel} times</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        className={
                          String(coupon.statusLabel).toLowerCase() === 'active'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                        }
                      >
                        {String(coupon.statusLabel)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Link
                        href={`/admin/coupons/edit/${coupon.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        Edit
                      </Link>
                      <ConfirmDialog
                        title="Delete coupon?"
                        description="This action cannot be undone."
                        confirmText="Delete"
                        confirmVariant="destructive"
                        onConfirm={() => handleDelete(coupon.id)}
                        trigger={
                          <button className="text-destructive hover:text-destructive/80 font-medium">
                            Delete
                          </button>
                        }
                      />
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

