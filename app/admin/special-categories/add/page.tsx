"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/slugify';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type SpecialLabel = {
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

export default function AddSpecialCategoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...emptyForm });
  const [labels, setLabels] = useState<SpecialLabel[]>([]);
  const [labelDraft, setLabelDraft] = useState({ ...emptyLabel });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addLabel = () => {
    if (!labelDraft.name.trim()) return;
    setLabels((prev) => [
      ...prev,
      { name: labelDraft.name.trim(), color: labelDraft.color, is_active: labelDraft.is_active }
    ]);
    setLabelDraft({ ...emptyLabel });
  };

  const removeLabel = (idx: number) => {
    setLabels((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
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
        status: form.status || 'active'
      };
      const response = await fetch(`${API_BASE_URL}/api/special-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Failed to create');
      const createdCategory = result.data;
      if (createdCategory?.id && labels.length > 0) {
        await Promise.allSettled(
          labels.map((label) =>
            fetch(`${API_BASE_URL}/api/special-category-labels`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                categoryId: Number(createdCategory.id),
                name: label.name,
                color: label.color || null,
                is_active: label.is_active !== false
              })
            })
          )
        );
      }
      toast({ title: 'Success', description: 'Special category created.' });
      router.push('/admin/special-categories');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create special category.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
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
            <h1 className="text-3xl font-semibold text-foreground">Add Special Category</h1>
            <p className="text-muted-foreground text-sm mt-1">Create a special menu category</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Weekly Specials"
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
              placeholder="Koningin Astridlaan 210, Gent"
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground"
            />
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
            <Button type="button" onClick={addLabel}>
              Add Label
            </Button>
          </div>
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {labels.map((label, idx) => (
                <div key={`${label.name}-${idx}`} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
                  <span className="inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: label.color || '#166534' }} />
                  <span>{label.name}</span>
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => removeLabel(idx)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Create'}
          </Button>
          <Link href="/admin/special-categories">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
