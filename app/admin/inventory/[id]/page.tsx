'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, Pencil, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Loading from '../loading';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const LOW_STOCK_DEFAULT = 10;

export default function InventoryDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editVariantStock, setEditVariantStock] = useState<string>('');
  const [editingBase, setEditingBase] = useState(false);
  const [editBaseStock, setEditBaseStock] = useState<string>('');
  const [editMinLevel, setEditMinLevel] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!id) return;
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch product');
      setProduct(result.data);
      const baseStock = Number(result.data?.stock_quantity || 0);
      const minLevel = Number(result.data?.low_stock_level ?? LOW_STOCK_DEFAULT);
      setEditBaseStock(String(baseStock));
      setEditMinLevel(String(minLevel));
    } catch (err: any) {
      setError(err?.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const metrics = useMemo(() => {
    if (!product) {
      return {
        hasVariants: false,
        totalStock: 0,
        totalValue: 0,
        minLevel: LOW_STOCK_DEFAULT,
        status: 'Normal'
      };
    }
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const hasVariants = variants.length > 0;
    const baseStock = Number(product.stock_quantity || 0);
    const basePrice = Number(product.price || 0);
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
    const minLevel = Number(product.low_stock_level ?? LOW_STOCK_DEFAULT);
    const status =
      totalStock === 0 ? 'Out of Stock' : totalStock < minLevel ? 'Low Stock' : 'Normal';

    return { hasVariants, totalStock, totalValue, minLevel, status };
  }, [product]);

  const statusTone =
    metrics.status === 'Normal'
      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      : metrics.status === 'Low Stock'
        ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400';

  const startVariantEdit = (variant: any) => {
    setEditingVariantId(variant.id);
    const qty = Number(variant.stock_quantity ?? variant.stockQuantity ?? 0);
    setEditVariantStock(String(Number.isFinite(qty) ? qty : 0));
  };

  const cancelVariantEdit = () => {
    setEditingVariantId(null);
    setEditVariantStock('');
  };

  const saveVariantStock = async (variant: any) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/variants/${variant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: variant.name,
          type: variant.type,
          price: Number(variant.price || 0),
          stockQuantity: Number(editVariantStock || 0),
          sku: variant.sku || null,
          sortOrder: variant.sort_order ?? 0
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Variant update failed');
      await fetchProduct();
      toast({ title: 'Saved', description: 'Variant stock updated.' });
      cancelVariantEdit();
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message || 'Unable to save changes.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const startBaseEdit = () => {
    setEditingBase(true);
  };

  const cancelBaseEdit = () => {
    setEditingBase(false);
    const baseStock = Number(product?.stock_quantity || 0);
    const minLevel = Number(product?.low_stock_level ?? LOW_STOCK_DEFAULT);
    setEditBaseStock(String(baseStock));
    setEditMinLevel(String(minLevel));
  };

  const saveBaseStock = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockQuantity: Number(editBaseStock || 0),
          lowStockLevel: Number(editMinLevel || 0)
        })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Inventory update failed');
      await fetchProduct();
      toast({ title: 'Saved', description: 'Inventory updated.' });
      setEditingBase(false);
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message || 'Unable to save changes.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Suspense fallback={<Loading />}>
        <div className="space-y-6 text-[13px]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Inventory Detail</h1>
              <p className="text-muted-foreground text-sm mt-1">Product stock and variant totals</p>
            </div>
            <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Inventory
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Unable to load</p>
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          {isLoading && !product ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Product</div>
                    <div className="text-lg font-semibold text-foreground">{product?.name || `Product ${id}`}</div>
                  </div>
                  <Badge className={statusTone}>{metrics.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-border rounded-lg px-3 py-2">
                    <div className="text-xs text-muted-foreground">Total Stock</div>
                    <div className="font-semibold text-foreground">{metrics.totalStock} units</div>
                  </div>
                  <div className="border border-border rounded-lg px-3 py-2">
                    <div className="text-xs text-muted-foreground">Inventory Value</div>
                    <div className="font-semibold text-foreground">€ {Math.round(metrics.totalValue)}</div>
                  </div>
                  <div className="border border-border rounded-lg px-3 py-2">
                    <div className="text-xs text-muted-foreground">Min Level</div>
                    <div className="font-semibold text-foreground">{metrics.minLevel} units</div>
                  </div>
                </div>
              </div>

              {metrics.hasVariants ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="text-sm font-semibold text-foreground">Variants</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Variant</th>
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Price</th>
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Stock</th>
                          <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Value</th>
                          <th className="px-4 py-2 text-right text-[11px] font-semibold text-foreground">Edit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(product?.variants || []).map((variant: any) => {
                          const qty = Number(variant.stock_quantity ?? variant.stockQuantity ?? 0);
                          const price = Number(variant.price ?? 0);
                          const value = (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(price) ? price : 0);
                          const isEditing = editingVariantId === variant.id;
                          return (
                            <tr key={variant.id} className="border-b border-border">
                              <td className="px-4 py-2 text-[13px] text-foreground">
                                {variant.name || variant.type || `Variant ${variant.id}`}
                              </td>
                              <td className="px-4 py-2 text-[13px] text-foreground">€ {Math.round(price)}</td>
                              <td className="px-4 py-2 text-[13px] text-foreground">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min="0"
                                    value={editVariantStock}
                                    onChange={(e) => setEditVariantStock(e.target.value)}
                                    className="w-24 rounded-md border border-border bg-background px-2 py-1 text-[12px]"
                                  />
                                ) : (
                                  Number.isFinite(qty) ? qty : 0
                                )}
                              </td>
                              <td className="px-4 py-2 text-[13px] text-foreground">€ {Math.round(value)}</td>
                              <td className="px-4 py-2 text-[13px] text-right">
                                {isEditing ? (
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => saveVariantStock(variant)}
                                      className="text-foreground hover:text-primary"
                                      aria-label="Save"
                                      disabled={isSaving}
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelVariantEdit}
                                      className="text-muted-foreground hover:text-foreground"
                                      aria-label="Cancel"
                                      disabled={isSaving}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => startVariantEdit(variant)}
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {Array.isArray(product?.variants) && product.variants.length === 0 && (
                          <tr>
                            <td className="px-4 py-3 text-sm text-muted-foreground" colSpan={5}>
                              No variants found.
                            </td>
                          </tr>
                        )}
</tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-foreground">Base Product Stock</div>
                    {editingBase ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={saveBaseStock}
                          className="text-foreground hover:text-primary"
                          aria-label="Save"
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelBaseEdit}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Cancel"
                          disabled={isSaving}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={startBaseEdit}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border border-border rounded-lg px-3 py-2">
                      <div className="text-xs text-muted-foreground">Stock Quantity</div>
                      <div className="font-semibold text-foreground">
                        {editingBase ? (
                          <input
                            type="number"
                            min="0"
                            value={editBaseStock}
                            onChange={(e) => setEditBaseStock(e.target.value)}
                            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-[12px]"
                          />
                        ) : (
                          `${Number(product?.stock_quantity || 0)} units`
                        )}
                      </div>
                    </div>
                    <div className="border border-border rounded-lg px-3 py-2">
                      <div className="text-xs text-muted-foreground">Low Stock Level</div>
                      <div className="font-semibold text-foreground">
                        {editingBase ? (
                          <input
                            type="number"
                            min="0"
                            value={editMinLevel}
                            onChange={(e) => setEditMinLevel(e.target.value)}
                            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-[12px]"
                          />
                        ) : (
                          `${metrics.minLevel} units`
                        )}
                      </div>
                    </div>
                    <div className="border border-border rounded-lg px-3 py-2">
                      <div className="text-xs text-muted-foreground">Base Price</div>
                      <div className="font-semibold text-foreground">€ {Math.round(Number(product?.price || 0))}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Link href="/admin/inventory" className="text-sm text-muted-foreground hover:text-foreground">
                  Back to Inventory
                </Link>
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </AdminLayout>
  );
}

