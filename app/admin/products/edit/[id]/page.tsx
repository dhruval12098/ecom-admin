'use client';

import React from "react"

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function EditProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id as string | undefined;
  const [formData, setFormData] = useState({
    name: 'Butter Chicken',
    description: 'Creamy and delicious butter chicken with aromatic spices',
    price: '220',
    discount: '10',
    tax: '5',
    category: 'main-course',
    subcategory: '',
    stock: '38',
    sku: '',
    status: 'active',
    shippingType: 'free',
    hasVariants: false,
  });
  const [primaryImage, setPrimaryImage] = useState('');
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadedSubcategoryId, setLoadedSubcategoryId] = useState<string | null>(null);
  const [didHydrateCategory, setDidHydrateCategory] = useState(false);
  const [variants, setVariants] = useState<Array<{
    id?: string;
    name: string;
    type: string;
    price: string;
    stock: string;
    sku: string;
  }>>([]);
  const [isEditVariantOpen, setIsEditVariantOpen] = useState(false);
  const [editVariantIndex, setEditVariantIndex] = useState<number | null>(null);
  const [editVariantDraft, setEditVariantDraft] = useState({
    name: '',
    type: 'size',
    price: '',
    stock: '',
    sku: '',
  });

  const [newVariant, setNewVariant] = useState({
    name: '',
    type: 'size',
    price: '',
    stock: '',
    sku: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch {}
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const category = categories.find((c) => c.slug === formData.category);
    setSubcategories(category ? category.subcategories || [] : []);
  }, [categories, formData.category]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) return;
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        const result = await response.json();
        if (result.success && result.data) {
          const prod = result.data;
          const subcategoryId = prod.subcategory_id ? String(prod.subcategory_id) : '';
          setFormData((prev) => ({
            ...prev,
            name: prod.name || '',
            description: prod.description || '',
            price: String(prod.price || ''),
            discount: prod.discount_percentage ? String(parseInt(prod.discount_percentage)) : '',
            subcategory: subcategoryId,
            stock: String(prod.stock_quantity || 0),
            sku: prod.sku || '',
            tax: prod.tax_percent ? String(prod.tax_percent) : '',
            status: prod.status || 'active',
            shippingType: prod.shipping_method || 'free',
          }));
          setLoadedSubcategoryId(subcategoryId || null);
          setPrimaryImage(prod.image_url || '');
          setImageGallery(prod.imageGallery || []);
          setVariants((prod.variants || []).map((v: any) => ({
            id: String(v.id),
            name: v.name || '',
            type: v.type || 'size',
            price: String(v.price || ''),
            stock: String(v.stockQuantity || 0),
            sku: v.sku || ''
          })));
          setFormData((prev) => ({ ...prev, hasVariants: (prod.variants || []).length > 0 }));
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load product.',
          variant: 'destructive',
        });
      }
    };
    fetchProduct();
  }, [productId, toast]);

  useEffect(() => {
    if (didHydrateCategory || !loadedSubcategoryId || categories.length === 0) return;
    const categoryForSub = categories.find((cat) =>
      Array.isArray(cat.subcategories) && cat.subcategories.some((s: any) => String(s.id) === loadedSubcategoryId)
    );
    if (categoryForSub && categoryForSub.slug !== formData.category) {
      setFormData((prev) => ({
        ...prev,
        category: categoryForSub.slug || '',
        subcategory: loadedSubcategoryId
      }));
    }
    setDidHydrateCategory(true);
  }, [didHydrateCategory, loadedSubcategoryId, categories, formData.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.subcategory) {
      toast({
        title: 'Error',
        description: 'Name, price, and subcategory are required.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      const price = Number(formData.price);
      const discount = Number(formData.discount || 0);
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategoryId: Number(formData.subcategory),
          name: formData.name,
          slug,
          description: formData.description,
          price,
          originalPrice: discount > 0 ? price + (price * discount / 100) : null,
          imageUrl: primaryImage || null,
          discountPercentage: discount > 0 ? `${discount}% Off` : null,
          discountColor: discount > 0 ? 'bg-red-500' : null,
          inStock: Number(formData.stock || 0) > 0,
          stockQuantity: Number(formData.stock || 0),
          sku: formData.sku || null,
          taxPercent: formData.tax ? Number(formData.tax) : null,
          shippingMethod: formData.shippingType || null,
          status: formData.status || 'active'
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      if (formData.hasVariants && variants.length > 0) {
        for (let i = 0; i < variants.length; i += 1) {
          const v = variants[i];
          if (v.id && !isNaN(Number(v.id))) {
            const varRes = await fetch(`${API_BASE_URL}/api/products/variants/${v.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: v.name,
                type: v.type,
                price: Number(v.price),
                stockQuantity: Number(v.stock || 0),
                sku: v.sku || null,
                sortOrder: i
              })
            });
            const varJson = await varRes.json();
            if (!varJson.success) throw new Error(varJson.error || 'Variant update failed');
          } else {
            const varRes = await fetch(`${API_BASE_URL}/api/products/${productId}/variants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: v.name,
                type: v.type,
                price: Number(v.price),
                stockQuantity: Number(v.stock || 0),
                sku: v.sku || null,
                sortOrder: i
              })
            });
            const varJson = await varRes.json();
            if (!varJson.success) throw new Error(varJson.error || 'Variant create failed');
          }
        }
      }
      toast({
        title: 'Success',
        description: 'Product updated successfully.',
      });
      router.push('/admin/products');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product.',
        variant: 'destructive',
      });
    }
  };

  const uploadMainImage = async (file: File) => {
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

  const addVariant = () => {
    if (newVariant.name && newVariant.price) {
      setVariants([
        ...variants,
        { ...newVariant, id: undefined }
      ]);
      setNewVariant({ name: '', type: 'size', price: '', stock: '', sku: '' });
    }
  };

  const removeVariant = async (id?: string) => {
    if (!id) {
      setVariants(variants.slice(0, -1));
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/variants/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      setVariants(variants.filter(v => v.id !== id));
      toast({ title: 'Success', description: 'Variant deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete variant.', variant: 'destructive' });
    }
  };

  const updateVariant = (index: number, patch: Partial<typeof variants[number]>) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const openEditVariant = (index: number) => {
    const v = variants[index];
    if (!v) return;
    setEditVariantIndex(index);
    setEditVariantDraft({
      name: v.name || '',
      type: v.type || 'size',
      price: v.price || '',
      stock: v.stock || '',
      sku: v.sku || '',
    });
    setIsEditVariantOpen(true);
  };

  const saveEditVariant = () => {
    if (editVariantIndex === null) return;
    updateVariant(editVariantIndex, { ...editVariantDraft });
    setIsEditVariantOpen(false);
  };

  const uploadGalleryImage = async (file: File, index: number) => {
    setIsUploading(true);
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
        const imageUrl = result.data.publicUrl;
        setImageGallery(prev => {
          const next = [...prev];
          next[index] = imageUrl;
          return next;
        });
        if (productId) {
          const saveRes = await fetch(`${API_BASE_URL}/api/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl,
              sortOrder: index
            })
          });
          const saveJson = await saveRes.json();
          if (!saveJson.success) {
            throw new Error(saveJson.error || 'Failed to save gallery image');
          }
        }
        toast({ title: 'Success', description: 'Gallery image uploaded.' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gallery image upload failed.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const addImageSlot = () => {
    if (imageGallery.length < 6) {
      setImageGallery(prev => [...prev, '']);
    }
  };

  const removeImageSlot = (index: number) => {
    setImageGallery(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/products">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Edit Product</h1>
              <p className="text-muted-foreground text-sm mt-1">Update product information</p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
            <Button type="submit" form="edit-product-form">Update Product</Button>
            <Link href="/admin/products">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>

        {/* Form */}
        <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Basic Information */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Subcategory</label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, subcategory: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Pricing and Stock */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                <h2 className="text-lg font-semibold text-foreground">Pricing & Stock</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Price (€)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Discount (%)</label>
                    <input
                      type="number"
                      name="discount"
                      value={formData.discount}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Tax (%)</label>
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Product Status</label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="SKU-001"
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Shipping Method</label>
                  <Select
                    value={formData.shippingType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, shippingType: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select shipping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free Shipping</SelectItem>
                      <SelectItem value="basic">Basic Shipping (€75-150)</SelectItem>
                      <SelectItem value="custom">Custom Shipping Rate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasVariants"
                    name="hasVariants"
                    checked={formData.hasVariants}
                    onChange={(e) => setFormData((prev) => ({ ...prev, hasVariants: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="hasVariants" className="text-sm font-medium text-foreground">
                    This product has variants (Size, Quantity, etc.)
                  </label>
                </div>
              </div>

              {/* Product Variants */}
              {formData.hasVariants && (
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Product Variants</h2>

                  <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1">Variant Name</label>
                        <input
                          type="text"
                          value={newVariant.name}
                          onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                          placeholder="e.g., 500g"
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

                    <div className="grid grid-cols-3 gap-3">
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
                      <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 text-muted-foreground">
                          <tr>
                            <th className="text-left font-medium px-4 py-2">Name</th>
                            <th className="text-left font-medium px-4 py-2">Type</th>
                            <th className="text-left font-medium px-4 py-2">Price</th>
                            <th className="text-left font-medium px-4 py-2">Stock</th>
                            <th className="text-left font-medium px-4 py-2">SKU</th>
                            <th className="text-right font-medium px-4 py-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {variants.map((variant, index) => (
                            <tr key={variant.id || `${variant.name}-${index}`}>
                              <td className="px-4 py-3">{variant.name || '-'}</td>
                              <td className="px-4 py-3 capitalize">{variant.type || '-'}</td>
                              <td className="px-4 py-3">€{variant.price || '-'}</td>
                              <td className="px-4 py-3">{variant.stock || '-'}</td>
                              <td className="px-4 py-3">{variant.sku || '-'}</td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => openEditVariant(index)}>
                                  Edit
                                </Button>
                                <ConfirmDialog
                                  title="Delete variant?"
                                  description="This will remove the variant immediately."
                                  confirmText="Delete"
                                  confirmVariant="destructive"
                                  onConfirm={() => removeVariant(variant.id)}
                                  trigger={
                                    <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive/80">
                                      Delete
                                    </Button>
                                  }
                                />
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
          </div>
            

            {/* Right Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Image Upload */}
              <div className="bg-card border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-foreground mb-4">Product Image</label>
                <div className="mb-4 w-full aspect-4/3 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {primaryImage ? (
                    <img
                      src={primaryImage}
                      alt="Product"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground">No image</div>
                  )}
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Replace image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadMainImage(f);
                    }}
                    className="mt-3"
                    disabled={isUploading}
                  />
                </div>
              </div>

              {/* Gallery Images */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-foreground">Gallery Images</label>
                  <Button type="button" variant="outline" className="gap-2 bg-transparent" onClick={addImageSlot}>
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
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadGalleryImage(f, index);
                        }}
                        className="w-full"
                        disabled={isUploading}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Upload image for slot {index + 1}</p>
                    </div>
                    <ConfirmDialog
                      title="Remove image?"
                      description="This will remove the uploaded image from this slot."
                      confirmText="Remove"
                      confirmVariant="destructive"
                      onConfirm={() => removeImageSlot(index)}
                      trigger={
                        <Button type="button" variant="outline" className="gap-2 bg-transparent">
                          <X className="w-4 h-4" />
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        
          <Dialog open={isEditVariantOpen} onOpenChange={setIsEditVariantOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Variant</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">Variant Name</label>
                  <input
                    type="text"
                    value={editVariantDraft.name}
                    onChange={(e) => setEditVariantDraft((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                  <Select
                    value={editVariantDraft.type}
                    onValueChange={(value) => setEditVariantDraft((prev) => ({ ...prev, type: value }))}
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
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Price (EUR)</label>
                  <input
                    type="number"
                    value={editVariantDraft.price}
                    onChange={(e) => setEditVariantDraft((prev) => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Stock</label>
                  <input
                    type="number"
                    value={editVariantDraft.stock}
                    onChange={(e) => setEditVariantDraft((prev) => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">SKU</label>
                  <input
                    type="text"
                    value={editVariantDraft.sku}
                    onChange={(e) => setEditVariantDraft((prev) => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditVariantOpen(false)}>Cancel</Button>
                <Button type="button" onClick={saveEditVariant}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
</form>

        {/* Mobile Actions */}
        <div className="md:hidden flex gap-3">
          <Button type="submit" form="edit-product-form">Update Product</Button>
          <Link href="/admin/products">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}









