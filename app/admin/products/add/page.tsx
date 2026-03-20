
﻿'use client';

import React from "react"

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function AddProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    discount: '',
    category: '',
    subcategory: '',
    stock: '',
    sku: '',
    status: 'active',
    hasVariants: false,
    shippingType: 'standard',
  });

  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState('5');
  const [customTaxEnabled, setCustomTaxEnabled] = useState(false);
  const [customTaxRate, setCustomTaxRate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [variants, setVariants] = useState<Array<{
    id: string;
    name: string;
    type: string;
    price: string;
    discount: string;
    stock: string;
    sku: string;
  }>>([]);
  const [mainVariantIndex, setMainVariantIndex] = useState<number | null>(null);

  const parseWeightToGrams = (label: string) => {
    const raw = String(label || '').trim().toLowerCase();
    const match = raw.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
    if (!match) return null;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return null;
    const unit = match[2];
    return unit === 'kg' ? Math.round(value * 1000) : Math.round(value);
  };

  const sortVariantsForDisplay = <T extends { id: string; type: string; name: string }>(next: T[]) => {
    const decorated = next.map((v, idx) => ({
      v,
      idx,
      grams: v.type === 'weight' ? parseWeightToGrams(v.name) : null
    }));
    decorated.sort((a, b) => {
      const aw = a.v.type === 'weight';
      const bw = b.v.type === 'weight';
      if (aw && bw) {
        const ag = a.grams;
        const bg = b.grams;
        if (ag === null && bg === null) return a.idx - b.idx;
        if (ag === null) return 1;
        if (bg === null) return -1;
        if (ag !== bg) return ag - bg;
        return a.idx - b.idx;
      }
      if (aw !== bw) return aw ? -1 : 1;
      return a.idx - b.idx;
    });
    return decorated.map((d) => d.v);
  };

  const [newVariant, setNewVariant] = useState({
    name: '',
    type: 'size',
    price: '',
    discount: '',
    stock: '',
    sku: '',
  });

  const getVariantPricingPayload = (priceValue: string, discountValue: string) => {
    const numericPrice = Number(priceValue || 0);
    const numericDiscount = Number(discountValue || 0);
    const hasDiscount = Number.isFinite(numericDiscount) && numericDiscount > 0;
    return {
      originalPrice: hasDiscount ? numericPrice + (numericPrice * numericDiscount / 100) : null,
      discountPercentage: hasDiscount ? `${numericDiscount}% Off` : null,
      discountColor: hasDiscount ? 'bg-red-500' : null
    };
  };
  const calculateDiscountedPrice = (priceValue: string | number, discountValue: string | number) => {
    const priceNum = Number(priceValue || 0);
    const discountNum = Number(discountValue || 0);
    if (!Number.isFinite(priceNum) || priceNum <= 0) return 0;
    if (!Number.isFinite(discountNum) || discountNum <= 0) return priceNum;
    return Math.max(0, priceNum - (priceNum * discountNum / 100));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories?includeInactive=true&includeEmpty=true`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch (error) {
        // ignore to keep UI stable
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        const result = await response.json();
        if (result.success && result.data) {
          const rate = result.data.tax_rate !== null && result.data.tax_rate !== undefined
            ? String(result.data.tax_rate)
            : '5';
          setTaxRate(rate);
          setCustomTaxRate(rate);
        }
      } catch (error) {
        // keep default tax rate if settings fail
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const category = categories.find((c) => c.slug === formData.category);
    setSubcategories(category ? category.subcategories || [] : []);
  }, [categories, formData.category]);

  const addImage = () => {
    if (imageGallery.length < 6) {
      setImageGallery([...imageGallery, '']);
    }
  };

  const removeImage = (index: number) => {
    const removed = imageGallery[index];
    const next = imageGallery.filter((_, i) => i !== index);
    setImageGallery(next);
    if (removed && primaryImage === removed) {
      setPrimaryImage('');
    }
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
      const createdId = Date.now().toString();
      const selectedId =
        mainVariantIndex !== null && variants[mainVariantIndex] ? variants[mainVariantIndex].id : null;
      const next = sortVariantsForDisplay([...variants, { ...newVariant, id: createdId }]);
      setVariants(next);
      if (mainVariantIndex === null) {
        const idx = next.findIndex((v) => v.id === createdId);
        setMainVariantIndex(idx >= 0 ? idx : 0);
      } else if (selectedId) {
        const idx = next.findIndex((v) => v.id === selectedId);
        setMainVariantIndex(idx >= 0 ? idx : mainVariantIndex);
      }
      setNewVariant({ name: '', type: 'size', price: '', discount: '', stock: '', sku: '' });
    }
  };

  const removeVariant = (id: string) => {
    const removedIndex = variants.findIndex(v => v.id === id);
    const next = variants.filter(v => v.id !== id);
    setVariants(next);
    if (mainVariantIndex !== null) {
      if (removedIndex === mainVariantIndex) {
        setMainVariantIndex(next.length > 0 ? 0 : null);
      } else if (removedIndex >= 0 && removedIndex < mainVariantIndex) {
        setMainVariantIndex(mainVariantIndex - 1);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVariant =
      formData.hasVariants && mainVariantIndex !== null ? variants[mainVariantIndex] : null;
    const resolvedBasePrice = selectedVariant?.price ? String(selectedVariant.price) : formData.basePrice;
    if (!formData.name || !resolvedBasePrice || !formData.subcategory) {
      toast({
        title: 'Error',
        description: 'Name, price, and subcategory are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      if (isSaving) return;
      setIsSaving(true);
      const slug = slugify(formData.name);
      const price = Number(resolvedBasePrice);
      const discount = Number(formData.discount || 0);
      const resolvedTax = customTaxEnabled ? Number(customTaxRate || 0) : null;
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategoryId: Number(formData.subcategory),
          name: formData.name,
          slug,
          description: formData.description,
          price,
          originalPrice: formData.hasVariants ? null : (discount > 0 ? price + (price * discount / 100) : null),
          imageUrl: primaryImage || null,
          discountPercentage: formData.hasVariants ? null : (discount > 0 ? `${discount}% Off` : null),
          discountColor: formData.hasVariants ? null : (discount > 0 ? 'bg-red-500' : null),
          inStock: Number(formData.stock || 0) > 0,
          stockQuantity: Number(formData.stock || 0),
          sku: formData.sku || null,
          taxPercent: resolvedTax,
          shippingMethod: formData.shippingType === 'free' ? 'free' : null,
          mainVariantId: null,
          status: formData.status || 'active',
          weight: null,
          origin: null
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Create failed');
      const productId = result.data.id;
      for (const url of imageGallery.filter(Boolean)) {
        const imgRes = await fetch(`${API_BASE_URL}/api/products/${productId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url })
        });
        const imgJson = await imgRes.json();
        if (!imgJson.success) throw new Error(imgJson.error || 'Gallery save failed');
      }
      if (formData.hasVariants && variants.length > 0) {
        const sortedVariants = sortVariantsForDisplay(variants);
        const selectedVariantKey =
          mainVariantIndex !== null && sortedVariants[mainVariantIndex]
            ? sortedVariants[mainVariantIndex].id
            : null;
        let resolvedMainVariantId: number | null = null;
        for (let i = 0; i < sortedVariants.length; i += 1) {
          const v = sortedVariants[i];
          const variantPricing = getVariantPricingPayload(v.price, v.discount);
          const varRes = await fetch(`${API_BASE_URL}/api/products/${productId}/variants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: v.name,
              type: v.type,
              price: Number(v.price),
              originalPrice: variantPricing.originalPrice,
              discountPercentage: variantPricing.discountPercentage,
              discountColor: variantPricing.discountColor,
              stockQuantity: Number(v.stock || 0),
              sku: v.sku || null,
              sortOrder: i
            })
          });
          const varJson = await varRes.json();
          if (!varJson.success) throw new Error(varJson.error || 'Variant save failed');
          if (selectedVariantKey && v.id === selectedVariantKey) {
            const createdVariantId = Number(varJson?.data?.id);
            resolvedMainVariantId = Number.isFinite(createdVariantId) ? createdVariantId : null;
          }
        }

        if (resolvedMainVariantId !== null) {
          const setMainRes = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subcategoryId: Number(formData.subcategory),
              name: formData.name,
              slug,
              description: formData.description,
              price,
              originalPrice: formData.hasVariants ? null : (discount > 0 ? price + (price * discount / 100) : null),
              imageUrl: primaryImage || null,
              discountPercentage: formData.hasVariants ? null : (discount > 0 ? `${discount}% Off` : null),
              discountColor: formData.hasVariants ? null : (discount > 0 ? 'bg-red-500' : null),
              inStock: Number(formData.stock || 0) > 0,
              stockQuantity: Number(formData.stock || 0),
              sku: formData.sku || null,
              taxPercent: resolvedTax,
              shippingMethod: formData.shippingType === 'free' ? 'free' : null,
              mainVariantId: resolvedMainVariantId,
              status: formData.status || 'active',
              weight: null,
              origin: null
            })
          });
          const setMainJson = await setMainRes.json();
          if (!setMainJson.success) throw new Error(setMainJson.error || 'Failed to set main variant');
        }
      }
      toast({
        title: 'Success',
        description: 'Product created successfully.',
      });
      router.push('/admin/products');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create product.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadMainImage = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2 MB.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('fileName', file.name);
      formDataUpload.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/products/upload-main`, {
        method: 'POST',
        body: formDataUpload,
      });
      const result = await response.json();
      if (result.success) {
        setPrimaryImage(result.data.publicUrl);
        toast({ title: 'Success', description: 'Main image uploaded.' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Main image upload failed.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadGalleryImage = async (file: File, index: number) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2 MB.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    setUploadingSlot(index);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('fileName', file.name);
      formDataUpload.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/products/upload-gallery`, {
        method: 'POST',
        body: formDataUpload,
      });
      const result = await response.json();
      if (result.success) {
        updateImage(index, result.data.publicUrl);
        toast({ title: 'Success', description: 'Gallery image uploaded.' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gallery image upload failed.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadingSlot(null);
    }
  };

  useEffect(() => {
    if (!formData.hasVariants) return;
    if (variants.length === 0) return;
    if (mainVariantIndex === null) {
      setMainVariantIndex(0);
    }
  }, [formData.hasVariants, variants.length, mainVariantIndex]);

  const pricingLocked = formData.hasVariants;
  const productDiscountedPrice = calculateDiscountedPrice(formData.basePrice, formData.discount);
  const newVariantDiscountedPrice = calculateDiscountedPrice(newVariant.price, newVariant.discount);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
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
            <label className="block text-sm font-semibold text-foreground mb-4">Display Image</label>
            {primaryImage && (
              <div className="mb-4 w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                <img
                  src={primaryImage}
                  alt="Product"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition cursor-pointer relative">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">
                {primaryImage ? 'Replace main image' : 'Drag and drop your image here'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {primaryImage ? 'or click to choose another file' : 'or click to select'}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMainImage(f);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={isUploading}
              />
            </div>
            {primaryImage && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => setPrimaryImage('')}
                >
                  Remove Main Image
                </Button>
              </div>
            )}
          </div>

          {/* Gallery Images */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-foreground">Gallery Images</label>
              <Button type="button" variant="outline" className="gap-2 bg-transparent" onClick={addImage}>
                <Plus className="w-4 h-4" />
                Add Image
              </Button>
            </div>
            {imageGallery.length === 0 && (
              <p className="text-sm text-muted-foreground">No gallery images yet.</p>
            )}
            {imageGallery.map((url, index) => (
              <div key={index} className="flex items-center gap-3 border border-border rounded-lg p-3">
                <div className="w-20 h-20 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                  {url ? (
                    <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No image</span>
                  )}
                </div>
                <div className="flex-1">
                    <label className={`inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md shadow-none border border-gray-300 ${uploadingSlot === index ? 'bg-slate-200/70 text-black cursor-not-allowed' : 'bg-slate-200 text-black cursor-pointer'}`}>
                    {uploadingSlot === index ? 'Uploading...' : url ? 'Edit Image' : 'Choose File'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadGalleryImage(f, index);
                      }}
                      className="hidden"
                      disabled={uploadingSlot === index}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">Upload image for slot {index + 1}</p>
                </div>
                <ConfirmDialog
                  title="Remove image?"
                  description="This will remove the uploaded image from this slot."
                  confirmText="Remove"
                  confirmVariant="destructive"
                  onConfirm={() => removeImage(index)}
                  trigger={
                    <Button type="button" variant="outline" className="gap-2 bg-transparent">
                      <X className="w-4 h-4" />
                    </Button>
                  }
                />
              </div>
            ))}
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
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Subcategory</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a subcategory</option>
                {subcategories.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing and Stock */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Pricing & Stock</h2>

            {formData.hasVariants && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Variants are enabled. Pricing & stock fields are locked; the main price is taken from the selected variant.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Base Price (€)</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                placeholder="250"
                required
                disabled={pricingLocked}
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
                disabled={pricingLocked}
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
                min={0}
                step={1}
                inputMode="numeric"
                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                disabled={pricingLocked}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">
                Discounted Price: <span className="font-semibold text-foreground">EUR {productDiscountedPrice.toFixed(2)}</span>
              </p>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Stock Quantity</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="100"
                  required
                  disabled={pricingLocked}
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
                disabled={pricingLocked}
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Shipping</label>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Free shipping for this product</div>
                  <div className="text-xs text-muted-foreground">
                    If off, global shipping rules from the Shipping page apply.
                  </div>
                </div>
                <Switch
                  checked={formData.shippingType === 'free'}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, shippingType: checked ? 'free' : 'standard' }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">VAT / Tax</label>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Custom VAT for this product</div>
                  <div className="text-xs text-muted-foreground">
                    {customTaxEnabled
                      ? (formData.hasVariants ? 'Applies to all variants' : 'Applies to this product')
                      : 'Uses global VAT from Settings'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={customTaxEnabled ? customTaxRate : taxRate}
                    onChange={(e) => setCustomTaxRate(e.target.value)}
                    min={0}
                    step={0.1}
                    inputMode="decimal"
                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                    disabled={!customTaxEnabled}
                    className="w-24 px-3 py-2 rounded-md bg-muted/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none text-right"
                  />
                  <Switch checked={customTaxEnabled} onCheckedChange={setCustomTaxEnabled} />
                </div>
              </div>
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
                    <Select
                      value={newVariant.type}
                      onValueChange={(value) => setNewVariant({ ...newVariant, type: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="size">Size</SelectItem>
                        <SelectItem value="weight">Weight</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Price (€)</label>
                    <input
                      type="number"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                      placeholder="Price"
                      className="w-full px-3 py-1.5 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Discount (%)</label>
                    <input
                      type="number"
                      value={newVariant.discount}
                      onChange={(e) => setNewVariant({ ...newVariant, discount: e.target.value })}
                      placeholder="0"
                      min={0}
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
                <p className="text-xs text-muted-foreground">
                  Discounted Price: <span className="font-semibold text-foreground">EUR {newVariantDiscountedPrice.toFixed(2)}</span>
                </p>

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
                <div className="border border-border rounded-lg overflow-hidden w-full">
                  <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    Added Variants ({variants.length})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 text-muted-foreground">
                        <tr>
                          <th className="text-left font-medium px-4 py-2">Name</th>
                          <th className="text-left font-medium px-4 py-2">Type</th>
                          <th className="text-left font-medium px-4 py-2">Price</th>
                          <th className="text-left font-medium px-4 py-2">Discount</th>
                          <th className="text-left font-medium px-4 py-2">Discounted Price</th>
                          <th className="text-left font-medium px-4 py-2">Stock</th>
                          <th className="text-left font-medium px-4 py-2">SKU</th>
                          <th className="text-left font-medium px-4 py-2">Main Price</th>
                          <th className="text-right font-medium px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {variants.map((variant, index) => (
                          <tr key={variant.id}>
                            <td className="px-4 py-3">{variant.name || '-'}</td>
                            <td className="px-4 py-3 capitalize">{variant.type || '-'}</td>
                            <td className="px-4 py-3">EUR {variant.price || '-'}</td>
                            <td className="px-4 py-3">{variant.discount ? `${variant.discount}%` : '-'}</td>
                            <td className="px-4 py-3">EUR {calculateDiscountedPrice(variant.price, variant.discount).toFixed(2)}</td>
                            <td className="px-4 py-3">{variant.stock || '-'}</td>
                            <td className="px-4 py-3">{variant.sku || '-'}</td>
                            <td className="px-4 py-3">
                              <input
                                type="radio"
                                name="mainVariant"
                                checked={mainVariantIndex === index}
                                onChange={() => {
                                  setMainVariantIndex(index);
                                  setFormData((prev) => ({ ...prev, basePrice: String(variant.price || '') }));
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Product'}
            </Button>
            <Link href="/admin/products">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}



