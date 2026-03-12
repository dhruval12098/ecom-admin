'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react';
import Loading from './loading';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [viewMode, setViewMode] = useState<'overview' | 'reserved' | 'notifications'>('overview');

  const LOW_STOCK_DEFAULT = 10;

  const [inventory, setInventory] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) return;

      const products = result.data;
      const withVariants = await Promise.all(
        products.map(async (p: any) => {
          try {
            const varRes = await fetch(`${API_BASE_URL}/api/products/${p.id}/variants`);
            const varJson = await varRes.json();
            const variants = Array.isArray(varJson.data) ? varJson.data : [];
            return { ...p, variants };
          } catch (e) {
            return { ...p, variants: [] };
          }
        })
      );

      const normalized = withVariants.map((p: any) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const hasVariants = variants.length > 0;
        const baseStock = Number(p.stock_quantity || 0);
        const basePrice = Number(p.price || 0);
        const totalVariantStock = variants.reduce((sum: number, v: any) => {
          const qty = Number(v.stock_quantity ?? v.stockQuantity ?? 0);
          return sum + (Number.isFinite(qty) ? qty : 0);
        }, 0);
        const totalVariantValue = variants.reduce((sum: number, v: any) => {
          const qty = Number(v.stock_quantity ?? v.stockQuantity ?? 0);
          const price = Number(v.price ?? v.variant_price ?? 0);
          const safeQty = Number.isFinite(qty) ? qty : 0;
          const safePrice = Number.isFinite(price) ? price : 0;
          return sum + safeQty * safePrice;
        }, 0);
        const totalStock = hasVariants ? totalVariantStock : baseStock;
        const totalValue = hasVariants ? totalVariantValue : baseStock * basePrice;
        const minLevel = Number(p.low_stock_level ?? LOW_STOCK_DEFAULT);
        const status =
          totalStock === 0 ? 'Out of Stock' : totalStock < minLevel ? 'Low Stock' : 'Normal';

        return {
          id: p.id,
          product: p.name || p.title || `Product ${p.id}`,
          price: basePrice,
          stock: totalStock,
          totalValue,
          reserved: 0,
          available: totalStock,
          minLevel,
          status,
          autoRestock: false,
          variants
        };
      });

      setInventory(normalized);
    } catch (error) {
      // keep UI stable on failure
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    const intervalId = setInterval(fetchInventory, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchInventory]);

  const startEdit = (item: any) => {
    setEditingItem(item);
  };

  const notifications = useMemo(() => {
    const items = inventory
      .filter((i) => i.status !== 'Normal')
      .map((i) => ({
        id: i.id,
        type: i.status === 'Out of Stock' ? 'out_of_stock' : 'low_stock',
        product: i.product,
        message:
          i.status === 'Out of Stock'
            ? 'Item is out of stock'
            : `Low stock alert: Only ${i.stock} units remaining`,
        time: 'Just now',
        read: false,
      }));
    return items;
  }, [inventory]);

  const filteredInventory = inventory.filter((item) =>
    String(item.product || '').toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setPage(1);
  }, [search, inventory.length, viewMode]);

  const totalItems = filteredInventory.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedInventory = filteredInventory.slice(startIndex, startIndex + pageSize);

  return (
    <AdminLayout>
      <Suspense fallback={<Loading />}>
        <div className="space-y-6 text-[13px]">
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
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {inventory.filter((i) => i.status === 'Low Stock').length} items are running low on stock. Please reorder soon.
              </p>
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
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Product</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Current Stock</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Min Level</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Status</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Inventory Value</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Auto-Restock</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInventory.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 py-2 text-[13px] font-medium text-foreground">
                          <div>{item.product}</div>
                          {item.variants && item.variants.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Variants: {item.variants.map((v: any) => `${v.name} (${v.stock_quantity || 0})`).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-[13px] font-semibold text-foreground">{item.stock} units</td>
                        <td className="px-4 py-2 text-[13px] text-muted-foreground">{item.minLevel} units</td>
                        <td className="px-4 py-2 text-[13px]">
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
                        <td className="px-4 py-2 text-[13px] font-semibold text-foreground">
                          € {Math.round(item.totalValue ?? item.price * item.stock)}
                        </td>
                        <td className="px-4 py-2 text-[13px]">
                          <Badge className={item.autoRestock ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}>
                            {item.autoRestock ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-[13px]">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/inventory/${item.id}`}
                              className="inline-flex items-center rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              View
                            </Link>
                          </div>
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
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Product</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Total Stock</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Reserved</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Available</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Reserve %</th>
                      <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedInventory.map((item) => {
                      const reservePercent = item.stock > 0 ? Math.round((item.reserved / item.stock) * 100) : 0;
                      return (
                        <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition">
                          <td className="px-4 py-2 text-[13px] font-medium text-foreground">{item.product}</td>
                          <td className="px-4 py-2 text-[13px] font-semibold text-foreground">{item.stock} units</td>
                          <td className="px-4 py-2 text-[13px] text-orange-600 dark:text-orange-400 font-semibold">{item.reserved} units</td>
                          <td className="px-4 py-2 text-[13px] text-green-600 dark:text-green-400 font-semibold">{item.available} units</td>
                          <td className="px-4 py-2 text-[13px] font-medium text-foreground">{reservePercent}%</td>
                          <td className="px-4 py-2 text-[13px]">
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
              {notifications.length === 0 && (
                <div className="text-sm text-muted-foreground">No notifications.</div>
              )}
            </div>
          )}

          {viewMode !== 'notifications' && (
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <div>
                Showing {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <div className="min-w-[80px] text-center">
                  Page {safePage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </AdminLayout>
  );
}

