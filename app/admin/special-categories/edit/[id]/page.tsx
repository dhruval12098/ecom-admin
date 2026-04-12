"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/slugify';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

type SpecialLabel = {
  id?: number;
  name: string;
  color?: string | null;
  is_active?: boolean | null;
};

const emptyForm = {
  name: '',
  description: '',
  pickup_address: '',
  status: 'active'
};

const emptyLabel = {
  name: '',
  color: '#166534',
  is_active: true
};

export default function EditSpecialCategoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState({ ...emptyForm });
  const [labels, setLabels] = useState<SpecialLabel[]>([]);
  const [labelDraft, setLabelDraft] = useState({ ...emptyLabel });
  const [isSaving, setIsSaving] = useState(false);
  const [isLabelSaving, setIsLabelSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchCategory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/special-categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const found = result.data.find((c: any) => String(c.id) === String(id));
          if (found) {
            setForm({
              name: found.name || '',
              description: found.description || '',
              pickup_address: found.pickup_address || '',
              status: (found.status || 'active').toLowerCase()
            });
            setImageUrl(found.image_url || found.imageUrl || '');
          }
        }
      } catch {
        // ignore
      }
    };
    const fetchLabels = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/special-category-labels?categoryId=${id}`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setLabels(result.data);
        }
      } catch {
        setLabels([]);
      }
    };
    fetchCategory();
    fetchLabels();
  }, [id]);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const uploadImage = async (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 2 MB.', variant: 'destructive' });
      return;
    }
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/special-products/upload-main`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload failed');
      setImageUrl(result.data.publicUrl);
      toast({ title: 'Success', description: 'Category image uploaded.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Image upload failed.', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Name is required.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: slugify(form.name),
        description: form.description || null,
        pickup_address: form.pickup_address || null,
        image_url: imageUrl || null,
        status: form.status || 'active'
      };
      const response = await fetch(`${API_BASE_URL}/api/special-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to update');
      toast({ title: 'Success', description: 'Special category updated.' });
      router.push('/admin/special-categories');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update special category.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addLabel = async () => {
    if (!labelDraft.name.trim()) return;
    setIsLabelSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-category-labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: Number(id),
          name: labelDraft.name.trim(),
          color: labelDraft.color || null,
          is_active: labelDraft.is_active !== false
        })
      });
      const result = await response.json();
      if (result.success && result.data) {
        setLabels((prev) => [...prev, result.data]);
        setLabelDraft({ ...emptyLabel });
      }
    } finally {
      setIsLabelSaving(false);
    }
  };

  const updateLabel = async (label: SpecialLabel) => {
    if (!label.id) return;
    setIsLabelSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-category-labels/${label.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: label.name,
          color: label.color || null,
          is_active: label.is_active !== false
        })
      });
      const result = await response.json();
      if (result.success && result.data) {
        setLabels((prev) => prev.map((l) => (l.id === label.id ? result.data : l)));
      }
    } finally {
      setIsLabelSaving(false);
    }
  };

  const deleteLabel = async (labelId?: number) => {
    if (!labelId) return;
    setIsLabelSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-category-labels/${labelId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setLabels((prev) => prev.filter((l) => l.id !== labelId));
      }
    } finally {
      setIsLabelSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/special-categories">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Edit Special Category</h1>
            <p className="text-muted-foreground text-sm mt-1">Update category details and labels</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Pickup Address</label>
            <input
              type="text"
              value={form.pickup_address}
              onChange={(e) => handleChange('pickup_address', e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">Category Image</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-foreground hover:bg-muted/50">
              <Upload className="h-4 w-4" />
              {isUploadingImage ? 'Uploading...' : imageUrl ? 'Replace image' : 'Upload image'}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                disabled={isSaving || isUploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            {imageUrl && (
              <div className="mt-3 flex items-center gap-3">
                <img src={imageUrl} alt="Category preview" className="h-16 w-24 rounded-md border border-border object-cover" />
                <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setImageUrl('')}>
                  Remove image
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm font-semibold text-foreground">Label Tags</div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-foreground mb-2">Label Name</label>
              <input
                type="text"
                value={labelDraft.name}
                onChange={(e) => setLabelDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Veg, Bestseller"
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">Color</label>
              <input
                type="color"
                value={labelDraft.color}
                onChange={(e) => setLabelDraft((prev) => ({ ...prev, color: e.target.value }))}
                className="h-10 w-full rounded-md border border-border bg-background px-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">Status</label>
              <select
                value={labelDraft.is_active ? 'active' : 'inactive'}
                onChange={(e) => setLabelDraft((prev) => ({ ...prev, is_active: e.target.value === 'active' }))}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={addLabel} disabled={isLabelSaving}>
              {isLabelSaving ? 'Saving...' : 'Add Label'}
            </Button>
          </div>
          {labels.length > 0 && (
            <div className="space-y-2">
              {labels.map((label) => (
                <div key={label.id} className="grid gap-2 md:grid-cols-5 items-end border border-border rounded-md p-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-foreground mb-2">Name</label>
                    <input
                      type="text"
                      value={label.name}
                      onChange={(e) =>
                        setLabels((prev) => prev.map((l) => (l.id === label.id ? { ...l, name: e.target.value } : l)))
                      }
                      className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">Color</label>
                    <input
                      type="color"
                      value={label.color || '#166534'}
                      onChange={(e) =>
                        setLabels((prev) => prev.map((l) => (l.id === label.id ? { ...l, color: e.target.value } : l)))
                      }
                      className="h-10 w-full rounded-md border border-border bg-background px-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-2">Status</label>
                    <select
                      value={label.is_active === false ? 'inactive' : 'active'}
                      onChange={(e) =>
                        setLabels((prev) => prev.map((l) => (l.id === label.id ? { ...l, is_active: e.target.value === 'active' } : l)))
                      }
                      className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => updateLabel(label)}>
                      Save
                    </Button>
                    <Button type="button" variant="outline" onClick={() => deleteLabel(label.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/admin/special-categories">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
