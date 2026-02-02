'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();

  const products = [
    { id: 1, name: 'Biryani (Chicken)', price: '₹250', stock: 45, category: 'Main Course', status: 'Active' },
    { id: 2, name: 'Paneer Tikka', price: '₹180', stock: 62, category: 'Appetizers', status: 'Active' },
    { id: 3, name: 'Butter Chicken', price: '₹220', stock: 38, category: 'Main Course', status: 'Active' },
    { id: 4, name: 'Dosa', price: '₹120', stock: 5, category: 'Breakfast', status: 'Low Stock' },
    { id: 5, name: 'Samosas', price: '₹80', stock: 0, category: 'Appetizers', status: 'Out of Stock' },
    { id: 6, name: 'Naan Bread', price: '₹50', stock: 120, category: 'Bread', status: 'Active' },
  ];

  return (
    <AdminLayout>
      <Suspense fallback={<Loading />}>
        <div className="space-y-6">
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

          {/* Filters and Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {/* Products Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Product Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{product.price}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{product.stock} units</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          className={
                            product.status === 'Active'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : product.status === 'Low Stock'
                                ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }
                        >
                          {product.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Suspense>
    </AdminLayout>
  );
}
