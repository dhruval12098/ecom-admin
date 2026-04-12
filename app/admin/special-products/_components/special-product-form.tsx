'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type SpecialProduct = {
  id: number;
  name: string;
  description?: string | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  price?: number | null;
  original_price?: number | null;
  discount_percentage?: string | null;
  discount_color?: string | null;
  label_id?: number | null;
  image_url?: string | null;
  preorder_only?: boolean | null;
  pickup_day?: string | null;
  pickup_time?: string | null;
  cutoff_time?: string | null;
  bulk_order_limit?: number | null;
  available_days?: string[] | null;
  status?: string | null;
};

type Props = {
  mode: 'add' | 'edit';
  initialCategories: any[];
  initialSubcategories: any[];
  initialProduct?: SpecialProduct | null;
};

export default function SpecialProductForm({
  mode,
  initialCategories,
  initialSubcategories,
  initialProduct
}: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [categories] = useState<any[]>(initialCategories || []);
  const [subcategories, setSubcategories] = useState<any[]>(initialSubcategories || []);
  const [labels, setLabels] = useState<any[]>([]);

  const buildInitialState = useMemo(() => {
    return () => {
      if (mode === 'edit' && initialProduct) {
        const rawDiscount = initialProduct.discount_percentage || '';
        const discountValue = rawDiscount
          ? String(rawDiscount).replace(/[^0-9.]/g, '')
          : '';
        return {
          name: initialProduct.name || '',
          description: initialProduct.description || '',
          categoryId: initialProduct.category_id ? String(initialProduct.category_id) : '',
          subcategoryId: initialProduct.subcategory_id ? String(initialProduct.subcategory_id) : '',
          price:
            initialProduct.price !== null && initialProduct.price !== undefined
              ? String(initialProduct.price)
              : '',
          discountPercent: discountValue,
          labelId: initialProduct.label_id ? String(initialProduct.label_id) : '',
          preorderOnly: initialProduct.preorder_only ?? true,
          pickupDay: initialProduct.pickup_day || '',
          pickupTime: initialProduct.pickup_time || '',
          cutoffTime: initialProduct.cutoff_time || '',
          bulkOrderLimit:
            initialProduct.bulk_order_limit !== null && initialProduct.bulk_order_limit !== undefined
              ? String(initialProduct.bulk_order_limit)
              : '',
          availableDays: Array.isArray(initialProduct.available_days) ? initialProduct.available_days : [],
          status: initialProduct.status || 'active'
        };
      }
      return {
        name: '',
        description: '',
        categoryId: '',
        subcategoryId: '',
        price: '',
        discountPercent: '',
        labelId: '',
        preorderOnly: true,
        pickupDay: '',
        pickupTime: '',
        cutoffTime: '',
        bulkOrderLimit: '',
        availableDays: [] as string[],
        status: 'active'
      };
    };
  }, [mode, initialProduct]);

  const [formData, setFormData] = useState(buildInitialState);
  const [primaryImage, setPrimaryImage] = useState(initialProduct?.image_url || '');
  const safeImage = primaryImage.trim();

  useEffect(() => {
    setFormData(buildInitialState());
    setPrimaryImage(initialProduct?.image_url || '');
  }, [buildInitialState, initialProduct]);

  useEffect(() => {
    setSubcategories(initialSubcategories || []);
  }, [initialSubcategories]);

  useEffect(() => {
    if (!formData.categoryId) {
      setSubcategories([]);
      setLabels([]);
      return;
    }
    const fetchSubcategories = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/special-subcategories?categoryId=${formData.categoryId}`
        );
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setSubcategories(result.data);
        }
      } catch {
        // ignore
      }
    };
    fetchSubcategories();
    const fetchLabels = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/special-category-labels?categoryId=${formData.categoryId}`
        );
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setLabels(result.data);
        } else {
          setLabels([]);
        }
      } catch {
        setLabels([]);
      }
    };
    fetchLabels();
  }, [formData.categoryId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.availableDays.includes(day);
      const next = exists ? prev.availableDays.filter((d) => d !== day) : [...prev.availableDays, day];
      return { ...prev, availableDays: next };
    });
  };

  const uploadMainImage = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2 MB.',
        variant: 'destructive'
      });
      return;
    }
    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('fileName', file.name);
      formDataUpload.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/special-products/upload-main`, {
        method: 'POST',
        body: formDataUpload
      });
      const result = await response.json();
      if (result.success) {
        setPrimaryImage(result.data.publicUrl);
        toast({ title: 'Success', description: 'Main image uploaded.' });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch {
      toast({ title: 'Error', description: 'Main image upload failed.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.price) {
      toast({
        title: 'Error',
        description: 'Name, category, and price are required.',
        variant: 'destructive'
      });
      return;
    }
    if (mode === 'edit' && !initialProduct?.id) {
      toast({
        title: 'Error',
        description: 'Missing product ID.',
        variant: 'destructive'
      });
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const basePrice = Number(formData.price || 0);
      const discountNum = Number((formData as any).discountPercent || 0);
      const hasDiscount = Number.isFinite(discountNum) && discountNum > 0;
      const originalPrice = hasDiscount ? basePrice + (basePrice * discountNum / 100) : null;
      const payload = {
        categoryId: Number(formData.categoryId),
        subcategoryId: formData.subcategoryId ? Number(formData.subcategoryId) : null,
        name: formData.name,
        description: formData.description || null,
        price: basePrice,
        originalPrice,
        discountPercentage: hasDiscount ? `${discountNum}% Off` : null,
        discountColor: hasDiscount ? 'bg-red-500' : null,
        labelId: formData.labelId ? Number(formData.labelId) : null,
        imageUrl: safeImage || null,
        preorder_only: formData.preorderOnly,
        pickup_day: (formData as any).pickupDay || null,
        pickup_time: (formData as any).pickupTime || null,
        cutoff_time: formData.cutoffTime || null,
        bulk_order_limit: formData.bulkOrderLimit ? Number(formData.bulkOrderLimit) : null,
        available_days: formData.availableDays.length ? formData.availableDays : null,
        status: formData.status || 'active'
      };
      const url =
        mode === 'edit'
          ? `${API_BASE_URL}/api/special-products/${initialProduct?.id}`
          : `${API_BASE_URL}/api/special-products`;
      const response = await fetch(url, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Save failed');
      toast({
        title: 'Success',
        description: mode === 'edit' ? 'Special product updated.' : 'Special product created.'
      });
      router.push('/admin/special-products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save special product.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'edit' && !initialProduct) {
    return (
      <AdminLayout>
        <div className="text-sm text-muted-foreground">Special product not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/special-products">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {mode === 'edit' ? 'Edit Special Product' : 'Add Special Product'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === 'edit' ? 'Update special menu details' : 'Create a preorder-only item for special menus'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Vada Pav"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Freshly made vada pav with chutney"
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Special Category</label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          categoryId: value,
                          subcategoryId: ''
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Special Subcategory</label>
                    <Select
                      value={formData.subcategoryId || 'none'}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, subcategoryId: value === 'none' ? '' : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No subcategory</SelectItem>
                        {subcategories.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Label Tag</label>
                    <Select
                      value={(formData as any).labelId || 'none'}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, labelId: value === 'none' ? '' : value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No label" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No label</SelectItem>
                        {labels.map((label: any) => (
                          <SelectItem key={label.id} value={String(label.id)}>
                            {label.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Pricing</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Price (EUR)</label>
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="12.50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Discount (%)</label>
                  <Input
                    type="number"
                    name="discountPercent"
                    value={(formData as any).discountPercent || ''}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.price && (formData as any).discountPercent
                      ? `Original price will be ${(
                          Number(formData.price) +
                          (Number(formData.price) * Number((formData as any).discountPercent || 0)) / 100
                        ).toFixed(2)}`
                      : 'Set a discount percentage to show strikethrough price.'}
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Availability</h2>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Preorder only</div>
                    <div className="text-xs text-muted-foreground">Disable to show instantly without cutoff times.</div>
                  </div>
                  <Switch
                    checked={formData.preorderOnly}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, preorderOnly: checked }))}
                  />
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Pickup Day</label>
                      <Select
                        value={(formData as any).pickupDay}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, pickupDay: value } as any))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select pickup day" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Pickup Time</label>
                      <Input
                        type="time"
                        name="pickupTime"
                        value={(formData as any).pickupTime}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Order By Time</label>
                      <Input
                        type="time"
                      name="cutoffTime"
                      value={formData.cutoffTime}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bulk Order Limit</label>
                    <Input
                      type="number"
                      name="bulkOrderLimit"
                      value={formData.bulkOrderLimit}
                      onChange={handleChange}
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Available Days</label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 text-sm rounded-full border ${
                          formData.availableDays.includes(day)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-foreground border-border'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Status</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Product Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <label className="block text-sm font-semibold text-foreground mb-4">Display Image</label>
                <div className="mb-4 w-full aspect-4/3 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {safeImage ? (
                    <img src={safeImage} alt="Product" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-sm text-muted-foreground">No image</div>
                  )}
                </div>
                <label className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    {safeImage ? 'Replace main image' : 'Upload image'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Click to choose a file</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadMainImage(f);
                    }}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {safeImage && (
                  <div className="mt-3">
                    <Button type="button" variant="outline" className="bg-transparent" onClick={() => setPrimaryImage('')}>
                      Remove Main Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Product'}
            </Button>
            <Link href="/admin/special-products">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
