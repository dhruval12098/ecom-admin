'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PricingPage() {
  const scheduledPrices = [
    {
      id: 1,
      product: 'Biryani (Chicken)',
      normalPrice: '₹250',
      scheduledPrice: '₹200',
      type: 'festival_pricing',
      startDate: 'Jan 26, 2024',
      endDate: 'Jan 31, 2024',
      status: 'Scheduled',
      discount: '20%',
    },
    {
      id: 2,
      product: 'Butter Chicken',
      normalPrice: '₹220',
      scheduledPrice: '₹180',
      type: 'happy_hour',
      startDate: 'Daily 2-4 PM',
      endDate: 'Daily 4:00 PM',
      status: 'Active',
      discount: '18%',
    },
    {
      id: 3,
      product: 'Paneer Tikka',
      normalPrice: '₹180',
      scheduledPrice: '₹150',
      type: 'discount_campaign',
      startDate: 'Jan 22, 2024',
      endDate: 'Jan 25, 2024',
      status: 'Ended',
      discount: '17%',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Ended':
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
            <p className="text-2xl font-bold text-foreground">1</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
            <p className="text-2xl font-bold text-foreground">1</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <p className="text-2xl font-bold text-foreground">1</p>
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
                {scheduledPrices.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{item.product}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.normalPrice}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{item.scheduledPrice}</td>
                    <td className="px-6 py-4 text-sm text-foreground capitalize">{item.type.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div>{item.startDate}</div>
                      <div className="text-xs text-muted-foreground/70">to {item.endDate}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground text-green-600 dark:text-green-400">{item.discount}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
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
