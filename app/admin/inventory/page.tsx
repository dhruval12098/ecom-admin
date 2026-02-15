'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { AlertCircle, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react';
import Loading from './loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [viewMode, setViewMode] = useState<'overview' | 'reserved' | 'notifications'>('overview');

  const LOW_STOCK_DEFAULT = 10;

  const [inventory, setInventory] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editStock, setEditStock] = useState('');
  const [editMinLevel, setEditMinLevel] = useState('');
  const [variantStocks, setVariantStocks] = useState<Record<number, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
        const variants = p.variants || [];
        const hasVariants = variants.length > 0;
        const totalVariantStock = variants.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0);
        const totalStock = hasVariants ? totalVariantStock : (p.stock_quantity || 0);
        const minLevel = p.low_stock_level || LOW_STOCK_DEFAULT;
        const status =
          totalStock === 0 ? 'Out of Stock' : totalStock < minLevel ? 'Low Stock' : 'Normal';

        return {
          id: p.id,
          product: p.name,
          price: Number(p.price || 0),
          stock: totalStock,
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
    setSaveError(null);
    setEditingItem(item);
    setEditMinLevel(String(item.minLevel ?? ''));
    if (item.variants && item.variants.length > 0) {
      const next: Record<number, string> = {};
      item.variants.forEach((v: any) => {
        next[v.id] = String(v.stock_quantity ?? 0);
      });
      setVariantStocks(next);
      setEditStock('');
    } else {
      setEditStock(String(item.stock ?? 0));
      setVariantStocks({});
    }
  };

  const closeEdit = () => {
    if (isSaving) return;
    setEditingItem(null);
    setEditStock('');
    setEditMinLevel('');
    setVariantStocks({});
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const hasVariants = editingItem.variants && editingItem.variants.length > 0;
      if (hasVariants) {
        await Promise.all(
          editingItem.variants.map(async (v: any) => {
            const nextStock = Number(variantStocks[v.id]);
            if (Number.isNaN(nextStock)) {
              throw new Error('Invalid stock quantity for variant');
            }
            const payload = {
              name: v.name,
              price: v.price,
              type: v.type || null,
              stockQuantity: nextStock,
              sku: v.sku || null,
              sortOrder: v.sort_order || 0
            };
            const res = await fetch(`${API_BASE_URL}/api/products/variants/${v.id}` , {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err?.message || 'Failed to update variant');
            }
          })
        );
      } else {
        const stockQuantity = Number(editStock);
        const lowStockLevel = Number(editMinLevel);
        if (Number.isNaN(stockQuantity)) {
          throw new Error('Invalid stock quantity');
        }
        const res = await fetch(`${API_BASE_URL}/api/inventory/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stockQuantity,
            lowStockLevel: Number.isNaN(lowStockLevel) ? undefined : lowStockLevel
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message || 'Failed to update inventory');
        }
      }
      await fetchInventory();
      closeEdit();
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to update inventory');
    } finally {
      setIsSaving(false);
    }
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
    item.product?.toLowerCase().includes(search.toLowerCase())
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
                        <td className="px-4 py-2 text-[13px] font-semibold text-foreground">€ {Math.round(item.price * item.stock)}</td>
                        <td className="px-4 py-2 text-[13px]">
                          <Badge className={item.autoRestock ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'}>
                            {item.autoRestock ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-[13px]">
                          <Button variant="outline" size="sm" onClick={() => startEdit(item)}>Update</Button>
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

          {editingItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Update Inventory</h2>
                  <Button variant="ghost" size="sm" onClick={closeEdit}>Close</Button>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="text-sm text-muted-foreground">Product: <span className="text-foreground font-medium">{editingItem.product}</span></div>
                  {editingItem.variants && editingItem.variants.length > 0 ? (
                    <div className="space-y-3">
                      {editingItem.variants.map((v: any) => (
                        <div key={v.id} className="flex items-center gap-3">
                          <div className="flex-1 text-sm">{v.name}</div>
                          <input
                            type="number"
                            min="0"
                            value={variantStocks[v.id] ?? ''}
                            onChange={(e) => setVariantStocks((prev) => ({ ...prev, [v.id]: e.target.value }))}
                            className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm"
                            placeholder="Stock"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Stock Quantity</label>
                        <input
                          type="number"
                          min="0"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Stock"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Low Stock Level</label>
                        <input
                          type="number"
                          min="0"
                          value={editMinLevel}
                          onChange={(e) => setEditMinLevel(e.target.value)}
                          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Min level"
                        />
                      </div>
                    </div>
                  )}
                  {saveError && <div className="text-sm text-red-600">{saveError}</div>}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={closeEdit} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </AdminLayout>
  );
}
