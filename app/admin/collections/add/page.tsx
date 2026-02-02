'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';

export default function AddCollectionPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortBy: 'manual',
    visibility: 'auto',
  });

  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const availableProducts = [
    { id: 1, name: 'Biryani (Chicken)', price: '₹250' },
    { id: 2, name: 'Paneer Tikka', price: '₹180' },
    { id: 3, name: 'Butter Chicken', price: '₹220' },
    { id: 4, name: 'Dosa', price: '₹120' },
    { id: 6, name: 'Naan Bread', price: '₹50' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Collection data:', { formData, selectedProducts });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/collections">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Create Collection</h1>
            <p className="text-muted-foreground text-sm mt-1">Create curated product collections for your customers</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Collection Details</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Collection Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Best Sellers, Chef Specials"
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe this collection..."
                rows={3}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {/* Sorting & Visibility */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Display Settings</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sort Products By</label>
              <select
                name="sortBy"
                value={formData.sortBy}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="manual">Manual Order</option>
                <option value="best_selling">Best Selling</option>
                <option value="low_stock">Low Stock First</option>
                <option value="newest">Newest First</option>
                <option value="highest_rating">Highest Rating</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Visibility</label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="auto">Auto-show collection</option>
                <option value="hidden">Hidden (admin only)</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Select Products</h2>

            <div className="space-y-2 border border-border rounded-lg p-4 bg-muted/20">
              {availableProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-lg">
                  <input
                    type="checkbox"
                    id={`product-${product.id}`}
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => toggleProduct(product.id)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                    <div className="text-sm font-medium text-foreground">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.price}</div>
                  </label>
                </div>
              ))}
            </div>

            <div className="p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{selectedProducts.length}</span> products selected
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit">Create Collection</Button>
            <Link href="/admin/collections">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
