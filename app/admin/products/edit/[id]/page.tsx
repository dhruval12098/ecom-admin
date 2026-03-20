'use client';

import React from "react"

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');


export default function EditProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id as string | undefined;
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    category: '',
    subcategory: '',
    stock: '',
    sku: '',
    status: 'active',
    shippingType: 'standard',
    hasVariants: false,
  });
  const [isProductLoading, setIsProductLoading] = useState(true);
  const [primaryImage, setPrimaryImage] = useState('');
  const [imageGallery, setImageGallery] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [taxRate, setTaxRate] = useState('5');
  const [customTaxEnabled, setCustomTaxEnabled] = useState(false);
  const [customTaxRate, setCustomTaxRate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedSubcategoryId, setLoadedSubcategoryId] = useState<string | null>(null);
  const [didHydrateCategory, setDidHydrateCategory] = useState(false);
  type Variant = {
    id?: string;
    clientId: string;
    name: string;
    type: string;
    price: string;
    discount: string;
    stock: string;
    sku: string;
  };

  const [variants, setVariants] = useState<Variant[]>([]);
  const [mainVariantIndex, setMainVariantIndex] = useState<number | null>(null);
  const [isEditVariantOpen, setIsEditVariantOpen] = useState(false);
  const [editVariantIndex, setEditVariantIndex] = useState<number | null>(null);
  const [editVariantDraft, setEditVariantDraft] = useState({
    name: '',
    type: 'size',
    price: '',
    discount: '',
    stock: '',
    sku: '',
  });

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

  const parseWeightToGrams = (label: string) => {
    const raw = String(label || '').trim().toLowerCase();
    const match = raw.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/);
    if (!match) return null;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return null;
    const unit = match[2];
    return unit === 'kg' ? Math.round(value * 1000) : Math.round(value);
  };

  const sortVariantsForDisplay = <T extends { clientId: string; type: string; name: string }>(next: T[]) => {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories?includeInactive=true&includeEmpty=true`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch {}
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
          if (!customTaxEnabled) setCustomTaxRate(rate);
        }
      } catch {
        // keep default tax rate if settings fail
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const category = categories.find((c) => c.slug === formData.category);
    setSubcategories(category ? category.subcategories || [] : []);
  }, [categories, formData.category]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) return;
        setIsProductLoading(true);
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
            status: prod.status || 'active',
            shippingType: prod.shipping_method || 'standard',
          }));
          const prodTax = prod.tax_percent !== null && prod.tax_percent !== undefined ? String(prod.tax_percent) : '';
          if (prodTax) {
            setCustomTaxEnabled(true);
            setCustomTaxRate(prodTax);
          } else {
            setCustomTaxEnabled(false);
            setCustomTaxRate(taxRate);
          }
          setLoadedSubcategoryId(subcategoryId || null);
          setPrimaryImage(prod.image_url || '');
          setImageGallery(prod.imageGallery || []);
          const loadedVariants: Variant[] = (prod.variants || []).map((v: any) => ({
            id: String(v.id),
            clientId: String(v.id),
            name: v.name || '',
            type: v.type || 'size',
            price: String(v.price || ''),
            discount: String(
              Number(
                String(v.discountPercentage || v.discount_percentage || '')
                  .replace(/[^0-9.]/g, '')
              ) || 0
            ),
            stock: String(v.stockQuantity || 0),
            sku: v.sku || ''
          }));
          const sorted = sortVariantsForDisplay(loadedVariants);
          setVariants(sorted);
          setFormData((prev) => ({ ...prev, hasVariants: sorted.length > 0 }));
          if (sorted.length > 0) {
            const mainVariantIdRaw = prod.main_variant_id ?? prod.mainVariantId ?? null;
            const mainVariantId =
              mainVariantIdRaw !== null && mainVariantIdRaw !== undefined && !Number.isNaN(Number(mainVariantIdRaw))
                ? Number(mainVariantIdRaw)
                : null;
            const mainByIdIndex = mainVariantId !== null
              ? sorted.findIndex((v) => Number(v.id) === mainVariantId)
              : -1;
            if (mainByIdIndex >= 0) {
              setMainVariantIndex(mainByIdIndex);
            } else {
              const priceMatchIndex = sorted.findIndex(
                (v) => String(v.price || '') === String(prod.price || '')
              );
              setMainVariantIndex(priceMatchIndex >= 0 ? priceMatchIndex : 0);
            }
          } else {
            setMainVariantIndex(null);
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load product.',
          variant: 'destructive',
        });
      } finally {
        setIsProductLoading(false);
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

  useEffect(() => {
    if (!formData.hasVariants) return;
    if (variants.length === 0) return;
    if (mainVariantIndex === null) {
      setMainVariantIndex(0);
    }
  }, [formData.hasVariants, variants.length, mainVariantIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVariant =
      formData.hasVariants && mainVariantIndex !== null ? variants[mainVariantIndex] : null;
    const resolvedPriceValue = selectedVariant?.price ? String(selectedVariant.price) : formData.price;
    if (!formData.name || !resolvedPriceValue || !formData.subcategory) {
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
      const price = Number(resolvedPriceValue);
      const discount = Number(formData.discount || 0);
      const resolvedTax = customTaxEnabled ? Number(customTaxRate || 0) : null;
      const selectedMainVariant =
        formData.hasVariants && mainVariantIndex !== null ? variants[mainVariantIndex] : null;
      const preResolvedMainVariantId =
        selectedMainVariant?.id && !Number.isNaN(Number(selectedMainVariant.id))
          ? Number(selectedMainVariant.id)
          : null;
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
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
          mainVariantId: preResolvedMainVariantId,
          status: formData.status || 'active'
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      if (productId) {
        const galleryToSave = imageGallery.map((url) => String(url || '').trim()).filter(Boolean);
        const syncRes = await fetch(`${API_BASE_URL}/api/products/${productId}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: galleryToSave })
        });
        const syncJson = await syncRes.json();
        if (!syncJson.success) throw new Error(syncJson.error || 'Gallery sync failed');
      }
      if (formData.hasVariants && variants.length > 0) {
        const sortedVariants = sortVariantsForDisplay(variants);
        const selectedVariantClientId =
          mainVariantIndex !== null && variants[mainVariantIndex]
            ? variants[mainVariantIndex].clientId
            : null;
        let resolvedMainVariantId: number | null = preResolvedMainVariantId;
        for (let i = 0; i < sortedVariants.length; i += 1) {
          const v = sortedVariants[i];
          const variantPricing = getVariantPricingPayload(v.price, v.discount);
          if (v.id && !isNaN(Number(v.id))) {
            const varRes = await fetch(`${API_BASE_URL}/api/products/variants/${v.id}`, {
              method: 'PUT',
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
            if (!varJson.success) throw new Error(varJson.error || 'Variant update failed');
            if (!resolvedMainVariantId && selectedVariantClientId && v.clientId === selectedVariantClientId) {
              const updatedVariantId = Number(v.id);
              resolvedMainVariantId = Number.isFinite(updatedVariantId) ? updatedVariantId : null;
            }
          } else {
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
            if (!varJson.success) throw new Error(varJson.error || 'Variant create failed');
            if (selectedVariantClientId && v.clientId === selectedVariantClientId) {
              const createdVariantId = Number(varJson?.data?.id);
              resolvedMainVariantId = Number.isFinite(createdVariantId) ? createdVariantId : resolvedMainVariantId;
            }
          }
        }

        if (resolvedMainVariantId !== preResolvedMainVariantId) {
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
              status: formData.status || 'active'
            })
          });
          const setMainJson = await setMainRes.json();
          if (!setMainJson.success) throw new Error(setMainJson.error || 'Failed to set main variant');
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

  const addVariant = () => {
    if (newVariant.name && newVariant.price) {
      const createdClientId = `tmp_${Date.now()}`;
      const selectedClientId =
        mainVariantIndex !== null && variants[mainVariantIndex] ? variants[mainVariantIndex].clientId : null;
      const next = sortVariantsForDisplay([
        ...variants,
        { ...newVariant, id: undefined, clientId: createdClientId }
      ]);
      setVariants(next);
      if (mainVariantIndex === null) {
        const idx = next.findIndex((v) => v.clientId === createdClientId);
        setMainVariantIndex(idx >= 0 ? idx : 0);
      } else if (selectedClientId) {
        const idx = next.findIndex((v) => v.clientId === selectedClientId);
        setMainVariantIndex(idx >= 0 ? idx : mainVariantIndex);
      }
      setNewVariant({ name: '', type: 'size', price: '', discount: '', stock: '', sku: '' });
    }
  };

  const removeVariant = async (id?: string) => {
    if (!id) {
      const next = variants.slice(0, -1);
      setVariants(next);
      if (mainVariantIndex !== null && mainVariantIndex >= next.length) {
        setMainVariantIndex(next.length > 0 ? 0 : null);
      }
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/variants/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
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
      toast({ title: 'Success', description: 'Variant deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete variant.', variant: 'destructive' });
    }
  };

  const updateVariant = (index: number, patch: Partial<typeof variants[number]>) => {
    setVariants((prev) => {
      const selectedClientId =
        mainVariantIndex !== null && prev[mainVariantIndex] ? prev[mainVariantIndex].clientId : null;
      const editedClientId = prev[index]?.clientId;
      const wasEditingMain = index === mainVariantIndex;
      const nextRaw = [...prev];
      nextRaw[index] = { ...nextRaw[index], ...patch };
      const next = sortVariantsForDisplay(nextRaw);
      const nextMainIndex =
        selectedClientId ? next.findIndex((v) => v.clientId === selectedClientId) : mainVariantIndex;
      if (nextMainIndex !== null && nextMainIndex !== undefined && nextMainIndex >= 0) {
        setMainVariantIndex(nextMainIndex);
      }
      if (wasEditingMain && patch.price !== undefined && editedClientId) {
        const idx = next.findIndex((v) => v.clientId === editedClientId);
        if (idx >= 0) {
          setFormData((prevForm) => ({ ...prevForm, price: String(patch.price || '') }));
        }
      } else if (wasEditingMain && patch.price !== undefined) {
        setFormData((prevForm) => ({ ...prevForm, price: String(patch.price || '') }));
      }
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
      discount: v.discount || '',
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
  const productDiscountedPrice = calculateDiscountedPrice(formData.price, formData.discount);
  const newVariantDiscountedPrice = calculateDiscountedPrice(newVariant.price, newVariant.discount);
  const editVariantDiscountedPrice = calculateDiscountedPrice(editVariantDraft.price, editVariantDraft.discount);

  const uploadGalleryImage = async (file: File, index: number) => {
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
    setImageGallery(prev => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      if (removed && primaryImage === removed) {
        setPrimaryImage('');
      }
      return next;
    });
  };

  const pricingLocked = formData.hasVariants;

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
            <Button type="submit" form="edit-product-form" disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Update Product'}
            </Button>
            <Link href="/admin/products">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>

        {isProductLoading && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            Loading product details...
          </div>
        )}

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

                {formData.hasVariants && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Variants are enabled. Pricing & stock fields are locked; the main price is taken from the selected variant.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Price (€)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      disabled={pricingLocked}
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
                        min={0}
                        step={1}
                        inputMode="numeric"
                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        placeholder="0"
                        disabled={pricingLocked}
                        className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                      disabled={pricingLocked}
                      className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Product Status</label>
                    <Select
                      value={formData.status}
                      disabled={pricingLocked}
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
                      disabled={pricingLocked}
                        className="w-full px-4 py-2.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Discounted Price: <span className="font-semibold text-foreground">EUR {productDiscountedPrice.toFixed(2)}</span>
                      </p>
                    </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Shipping</label>
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
                  <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">VAT / Tax</label>
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
                        className="w-24 px-3 py-2 rounded-md bg-muted/60 border border-border text-foreground focus:outline-none text-right"
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, hasVariants: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="hasVariants" className="text-sm font-medium text-foreground">
                    This product has variants (Size, Quantity, etc.)
                  </label>
                </div>
              </div>
          </div>
            

            {/* Right Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Image Upload */}
              <div className="bg-card border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-foreground mb-4">Display Image</label>
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
                  <p className="text-sm font-medium text-foreground">
                    {primaryImage ? 'Replace main image' : 'Upload image'}
                  </p>
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
                      <label className={`inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md shadow-none border border-gray-300 ${isUploading ? 'bg-slate-200/70 text-black cursor-not-allowed' : 'bg-slate-200 text-black cursor-pointer'}`}>
                        {isUploading ? 'Uploading...' : url ? 'Edit Image' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadGalleryImage(f, index);
                          }}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
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

                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Price (EUR)</label>
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
                          <tr key={variant.clientId}>
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
                                  setFormData((prev) => ({ ...prev, price: String(variant.price || '') }));
                                }}
                              />
                            </td>
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
                  <label className="block text-xs font-medium text-foreground mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={editVariantDraft.discount}
                    min={0}
                    onChange={(e) => setEditVariantDraft((prev) => ({ ...prev, discount: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Discounted Price: <span className="font-semibold text-foreground">EUR {editVariantDiscountedPrice.toFixed(2)}</span>
                  </p>
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
          <Button type="submit" form="edit-product-form" disabled={isSaving}>
            {isSaving ? 'Updating...' : 'Update Product'}
          </Button>
          <Link href="/admin/products">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}










