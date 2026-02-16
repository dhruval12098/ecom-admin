'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Suspense } from 'react';
import Loading from './loading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [products, setProducts] = useState<any[]>([]);
  const [subcategoryLookup, setSubcategoryLookup] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setProducts(result.data);
        }
      } catch (error) {
        // keep UI stable on failure
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const map: Record<string, string> = {};
          result.data.forEach((cat: any) => {
            (cat.subcategories || []).forEach((sub: any) => {
              map[String(sub.id)] = sub.name;
            });
          });
          setSubcategoryLookup(map);
        }
      } catch (error) {
        // ignore
      }
    };
    fetchCategories();
  }, []);

  const query = search.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (!query) return true;
    const name = String(product.name || '').toLowerCase();
    const sku = String(product.sku || '').toLowerCase();
    const category = String(subcategoryLookup[String(product.subcategory_id)] || '').toLowerCase();
    const id = String(product.id || '').toLowerCase();
    return (
      name.includes(query) ||
      sku.includes(query) ||
      category.includes(query) ||
      id.includes(query)
    );
  });

  useEffect(() => {
    setPage(1);
  }, [search, products.length]);

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  return (
    <AdminLayout>
      <Suspense fallback={<Loading />}>
        <div className="space-y-6 text-[13px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Products</h1>
              <p className="text-muted-foreground text-sm mt-1">Manage your food menu items</p>
            </div>
            <Link href="/admin/products/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>

          {/* Filter and Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, SKU, category, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Product Name</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Price</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Category</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Stock</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Shipping</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-4 py-2 text-[13px] font-medium text-foreground">{product.name}</td>
                      <td className="px-4 py-2 text-[13px] text-foreground">€ {product.price}</td>
                      <td className="px-4 py-2 text-[13px] text-muted-foreground">{subcategoryLookup[String(product.subcategory_id)] || product.subcategory_id}</td>
                      <td className="px-4 py-2 text-[13px] text-foreground">{product.in_stock ? 'In Stock' : 'Out of Stock'}</td>
                      <td className="px-4 py-2 text-[13px]">
                        <Badge
                          className={
                            String(product.shipping_method || '').toLowerCase() === 'free'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-300'
                          }
                        >
                          {String(product.shipping_method || '').toLowerCase() === 'free' ? 'Free' : 'Standard'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-[13px] space-x-2">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Edit
                        </Link>
                        <button className="text-destructive hover:text-destructive/80 font-medium">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pagedProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[13px] text-muted-foreground">
                        No products found for "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
        </div>
      </Suspense>
    </AdminLayout>
  );
}
