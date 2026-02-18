'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


interface Subcategory {
  id: number;
  name: string;
  slug: string;
  image: string;
  products?: any[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  sort_order?: number | null;
  subcategories: Subcategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load categories.',
          variant: 'destructive',
        });
      }
    };

    fetchCategories();
  }, []);

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (category: Category) => {
    const nextName = editName.trim();
    if (!nextName) {
      toast({
        title: 'Error',
        description: 'Category name is required.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nextName,
          slug: category.slug,
          description: category.description ?? null,
          imageUrl: category.image ?? null,
          sortOrder: category.sort_order ?? undefined
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      setCategories(prev =>
        prev.map(item =>
          item.id === category.id ? { ...item, name: nextName } : item
        )
      );
      setEditingId(null);
      setEditName('');
      toast({
        title: 'Success',
        description: 'Category updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage product categories and subcategories</p>
          </div>
          <Link href="/admin/categories/add">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </Link>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="border border-slate-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4 p-4">
                <div className="h-16 w-16 rounded-md bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 text-xs font-semibold shrink-0">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{category.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === category.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-sm font-semibold text-slate-900 px-2 py-1 rounded-md border border-slate-200"
                    />
                  ) : (
                    <div className="text-sm font-semibold text-slate-900 truncate">{category.name}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">
                    {category.subcategories.length} Subcategories
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/admin/categories/${category.id}`}>
                      <Button variant="outline" className="h-8 px-3 text-xs">
                        View
                      </Button>
                    </Link>
                    {editingId === category.id ? (
                      <>
                        <Button
                          className="h-8 px-3 text-xs gap-1"
                          onClick={() => saveEdit(category)}
                          disabled={isSaving}
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 px-3 text-xs gap-1"
                          onClick={cancelEdit}
                          disabled={isSaving}
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs gap-1"
                        onClick={() => startEdit(category)}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit Name
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
