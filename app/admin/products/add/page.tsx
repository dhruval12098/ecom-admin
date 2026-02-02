'use client';

import React from "react"

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    discount: '',
    tax: '',
    category: '',
    stock: '',
    sku: '',
    status: 'active',
    hasVariants: false,
    shippingType: 'free',
  });

  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string>('');

  const [variants, setVariants] = useState<Array<{
    id: string;
    name: string;
    type: string;
    price: string;
    stock: string;
    sku: string;
  }>>([]);

  const [newVariant, setNewVariant] = useState({
    name: '',
    type: 'size',
    price: '',
    stock: '',
    sku: '',
  });

  const addImage = () => {
    if (imageGallery.length < 6) {
      setImageGallery([...imageGallery, '']);
    }
  };

  const removeImage = (index: number) => {
    setImageGallery(imageGallery.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, url: string) => {
    const newGallery = [...imageGallery];
    newGallery[index] = url;
    setImageGallery(newGallery);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addVariant = () => {
    if (newVariant.name && newVariant.price && newVariant.stock) {
      setVariants([
        ...variants,
        { ...newVariant, id: Date.now().toString() }
      ]);
      setNewVariant({ name: '', type: 'size', price: '', stock: '', sku: '' });
    }
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Product data:', { formData, variants });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Add New Product</h1>
            <p className="text-muted-foreground text-sm mt-1">Create a new food item for your menu</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="bg-card border border-border rounded-lg p-6">
            <label className="block text-sm font-semibold text-foreground mb-4">Product Image</label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Drag and drop your image here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to select</p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Butter Chicken"
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
                placeholder="Describe your product..."
                rows={4}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category</option>
                <option value="main-course">Main Course</option>
                <option value="appetizers">Appetizers</option>
                <option value="bread">Bread</option>
                <option value="dessert">Dessert</option>
                <option value="beverages">Beverages</option>
              </select>
            </div>
          </div>

          {/* Pricing and Stock */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Pricing & Stock</h2>

            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Base Price (₹)</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                placeholder="250"
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="SKU-001"
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tax (%)</label>
                <input
                  type="number"
                  name="tax"
                  value={formData.tax}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="100"
                  required
                  className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Product Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Shipping Method</label>
              <select
                name="shippingType"
                value={formData.shippingType}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="free">Free Shipping</option>
                <option value="basic">Basic Shipping (₹75-150)</option>
                <option value="custom">Custom Shipping Rate</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hasVariants"
                name="hasVariants"
                checked={formData.hasVariants}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="hasVariants" className="text-sm font-medium text-foreground">
                This product has variants (Size, Quantity, etc.)
              </label>
            </div>
          </div>

          {/* Product Variants */}
          {formData.hasVariants && (
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Product Variants</h2>

              <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Variant Name</label>
                    <input
                      type="text"
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                      placeholder="e.g., Small, 250ml"
                      className="w-full px-3 py-1.5 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                    <select
                      value={newVariant.type}
                      onChange={(e) => setNewVariant({ ...newVariant, type: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="size">Size</option>
                      <option value="quantity">Quantity</option>
                      <option value="pack_type">Pack Type</option>
                      <option value="color">Color</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                      placeholder="Price"
                      className="w-full px-3 py-1.5 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Stock</label>
                    <input
                      type="number"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                      placeholder="Stock"
                      className="w-full px-3 py-1.5 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">SKU</label>
                    <input
                      type="text"
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                      placeholder="SKU"
                      className="w-full px-3 py-1.5 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addVariant}
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                  Add Variant
                </Button>
              </div>

              {variants.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    Added Variants ({variants.length})
                  </div>
                  <div className="divide-y divide-border">
                    {variants.map((variant) => (
                      <div key={variant.id} className="px-4 py-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{variant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{variant.price} • Stock: {variant.stock} • SKU: {variant.sku}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit">Save Product</Button>
            <Link href="/admin/products">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
