'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'overview' | 'reserved' | 'notifications'>('overview');
  const searchParams = useSearchParams();

  const inventory = [
    { id: 1, product: 'Biryani', stock: 45, reserved: 8, available: 37, minLevel: 20, status: 'Normal', value: '₹11,250', autoRestock: true },
    { id: 2, name: 'Paneer Tikka', stock: 62, reserved: 5, available: 57, minLevel: 30, status: 'Normal', value: '₹11,160', autoRestock: true },
    { id: 3, product: 'Butter Chicken', stock: 38, reserved: 10, available: 28, minLevel: 25, status: 'Normal', value: '₹8,360', autoRestock: false },
    { id: 4, product: 'Dosa', stock: 5, reserved: 2, available: 3, minLevel: 20, status: 'Low Stock', value: '₹600', autoRestock: true },
    { id: 5, product: 'Samosas', stock: 0, reserved: 0, available: 0, minLevel: 15, status: 'Out of Stock', value: '₹0', autoRestock: false },
  ];

  const notifications = [
    { id: 1, type: 'restock', product: 'Paneer Tikka', message: 'Stock replenished: 50 units added', time: '2 hours ago', read: false },
    { id: 2, type: 'low_stock', product: 'Dosa', message: 'Low stock alert: Only 5 units remaining', time: '4 hours ago', read: false },
    { id: 3, type: 'restock', product: 'Biryani', message: 'Stock replenished: 30 units added', time: '1 day ago', read: true },
    { id: 4, type: 'out_of_stock', product: 'Samosas', message: 'Item is out of stock', time: '2 days ago', read: true },
  ];

  return (
    <AdminLayout>
      <Suspense fallback={<Loading />}>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Inventory</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage stock levels and inventory</p>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                viewMode === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('reserved')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                viewMode === 'reserved'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Reserved Stock
            </button>
            <button
              onClick={() => setViewMode('notifications')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                viewMode === 'notifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Notifications
            </button>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">Low Stock Alert</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">2 items are running low on stock. Please reorder soon.</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Overview View */}
          {viewMode === 'overview' && (
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Current Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Min Level</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Inventory Value</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Auto-Restock</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{item.product}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{item.stock} units</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.minLevel} units</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            className={
                              item.status === 'Normal'
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : item.status === 'Low Stock'
                                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-foreground">{item.value}</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge className={item.autoRestock ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}>
                            {item.autoRestock ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Button variant="outline" size="sm">Update</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reserved Stock View */}
          {viewMode === 'reserved' && (
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Total Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Reserved</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Available</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Reserve %</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const reservePercent = item.stock > 0 ? Math.round((item.reserved / item.stock) * 100) : 0;
                      return (
                        <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition">
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{item.product}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">{item.stock} units</td>
                          <td className="px-6 py-4 text-sm text-orange-600 dark:text-orange-400 font-semibold">{item.reserved} units</td>
                          <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400 font-semibold">{item.available} units</td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">{reservePercent}%</td>
                          <td className="px-6 py-4 text-sm">
                            <Button variant="outline" size="sm">Release</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications View */}
          {viewMode === 'notifications' && (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className={`p-4 rounded-lg border ${notif.read ? 'bg-background border-border' : 'bg-primary/5 border-primary/20'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${notif.read ? 'text-foreground' : 'text-primary font-semibold'}`}>
                        {notif.product}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Suspense>
    </AdminLayout>
  );
}
