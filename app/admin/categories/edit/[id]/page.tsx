'use client';

import React from "react"

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const [formData, setFormData] = useState({
    name: 'Main Course',
    status: 'active',
    autoHideIfEmpty: false,
    hideIfOutOfStock: false,
  });

  const [assignedProducts, setAssignedProducts] = useState<Array<{
    id: number;
    name: string;
    price: string;
    stock: number;
    priority: number;
  }>>([
    { id: 1, name: 'Biryani (Chicken)', price: '₹250', stock: 45, priority: 1 },
    { id: 3, name: 'Butter Chicken', price: '₹220', stock: 38, priority: 2 },
  ]);

  const [unassignedProducts] = useState([
    { id: 2, name: 'Paneer Tikka', price: '₹180', stock: 62 },
    { id: 4, name: 'Dosa', price: '₹120', stock: 5 },
    { id: 5, name: 'Samosas', price: '₹80', stock: 0 },
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const updateProductPriority = (productId: number, direction: 'up' | 'down') => {
    const idx = assignedProducts.findIndex(p => p.id === productId);
    if ((direction === 'up' && idx > 0) || (direction === 'down' && idx < assignedProducts.length - 1)) {
      const newProducts = [...assignedProducts];
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newProducts[idx], newProducts[newIdx]] = [newProducts[newIdx], newProducts[idx]];
      setAssignedProducts(newProducts.map((p, i) => ({ ...p, priority: i + 1 })));
    }
  };

  const removeProduct = (productId: number) => {
    setAssignedProducts(assignedProducts.filter(p => p.id !== productId).map((p, i) => ({ ...p, priority: i + 1 })));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Category data:', { formData, assignedProducts });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Edit Category</h1>
            <p className="text-muted-foreground text-sm mt-1">Update category information</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-card border border-border rounded-lg p-6">
            <label className="block text-sm font-semibold text-foreground mb-4">Category Image</label>
            <div className="mb-4 w-full h-40 rounded-lg bg-muted flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop"
                alt="Category"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Replace image</p>
            </div>
          </div>

          {/* Category Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Category Information</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Category Visibility Rules */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Visibility Rules</h2>

            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoHideIfEmpty"
                  name="autoHideIfEmpty"
                  checked={formData.autoHideIfEmpty}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="autoHideIfEmpty" className="text-sm font-medium text-foreground">
                  Auto-hide category if no products available
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hideIfOutOfStock"
                  name="hideIfOutOfStock"
                  checked={formData.hideIfOutOfStock}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="hideIfOutOfStock" className="text-sm font-medium text-foreground">
                  Hide category if all products are out of stock
                </label>
              </div>
            </div>
          </div>

          {/* Product Assignment */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Products in Category</h2>

            {assignedProducts.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 flex items-center gap-4 text-sm font-medium text-foreground border-b border-border">
                  <div className="w-8"></div>
                  <div className="flex-1">Product</div>
                  <div className="w-20">Price</div>
                  <div className="w-20">Stock</div>
                  <div className="w-20">Priority</div>
                  <div className="w-20">Actions</div>
                </div>
                <div className="divide-y divide-border">
                  {assignedProducts.map((product) => (
                    <div key={product.id} className="px-4 py-3 flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                      </div>
                      <div className="w-20 text-sm text-foreground">{product.price}</div>
                      <div className="w-20 text-sm text-foreground">{product.stock} units</div>
                      <div className="w-20">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => updateProductPriority(product.id, 'up')}
                            disabled={product.priority === 1}
                            className="p-1 hover:bg-muted rounded disabled:opacity-50"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateProductPriority(product.id, 'down')}
                            disabled={product.priority === assignedProducts.length}
                            className="p-1 hover:bg-muted rounded disabled:opacity-50"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="w-20">
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="text-destructive hover:text-destructive/80 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No products assigned to this category
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit">Update Category</Button>
            <Link href="/admin/categories">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
