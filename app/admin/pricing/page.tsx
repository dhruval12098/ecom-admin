'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


type Schedule = {
  id: number;
  product_id: number;
  products?: { name?: string } | null;
  normal_price: number;
  scheduled_price: number;
  discount_percent: number | null;
  schedule_type: string;
  start_at: string;
  end_at: string;
  status: string;
};

const formatCurrency = (value: number) => `€ ${Math.round(value)}`;

const deriveStatus = (status: string, startAt: string, endAt: string) => {
  if (status === 'disabled') return 'Disabled';
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  if (now >= start && now <= end) return 'Active';
  if (now > end) return 'Ended';
  return 'Scheduled';
};

export default function PricingPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduled-pricing/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Delete failed');
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: 'Deleted',
        description: 'Scheduled pricing entry removed.',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Could not delete the schedule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scheduled-pricing`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setSchedules(result.data);
        }
      } catch (error) {
        // keep UI stable on failure
      }
    };
    fetchSchedules();
  }, []);

  const counts = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let ended = 0;
    schedules.forEach((s) => {
      const status = deriveStatus(s.status, s.start_at, s.end_at);
      if (status === 'Active') active += 1;
      else if (status === 'Ended') ended += 1;
      else scheduled += 1;
    });
    return { active, scheduled, ended };
  }, [schedules]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Ended':
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
      case 'Disabled':
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Scheduled Pricing</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage time-based pricing and discounts</p>
          </div>
          <Link href="/admin/pricing/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </Link>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground">Active Schedules</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{counts.active}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{counts.scheduled}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{counts.ended}</p>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Normal Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Scheduled Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((item) => {
                  const status = deriveStatus(item.status, item.start_at, item.end_at);
                  const discount = item.discount_percent !== null
                    ? `${Number(item.discount_percent).toFixed(0)}%`
                    : `${Math.round(((item.normal_price - item.scheduled_price) / item.normal_price) * 100)}%`;
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{item.products?.name || `Product #${item.product_id}`}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatCurrency(item.normal_price)}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-primary">{formatCurrency(item.scheduled_price)}</td>
                      <td className="px-6 py-4 text-sm text-foreground capitalize">{item.schedule_type.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{new Date(item.start_at).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground/70">to {new Date(item.end_at).toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-foreground text-green-600 dark:text-green-400">{discount}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge className={getStatusColor(status)}>{status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <Link
                          href={`/admin/pricing/edit/${item.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Edit
                        </Link>
                        <ConfirmDialog
                          title="Delete schedule?"
                          description="This will permanently remove the scheduled pricing entry."
                          confirmText="Delete"
                          confirmVariant="destructive"
                          onConfirm={() => handleDelete(item.id)}
                          trigger={
                            <button className="text-destructive hover:text-destructive/80 font-medium">
                              Delete
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

