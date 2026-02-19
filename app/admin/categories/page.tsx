'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
    setIsEditOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setIsEditOpen(false);
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
      setIsEditOpen(false);
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

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Delete failed');
      }
      setCategories(prev => prev.filter(cat => cat.id !== deleteTarget.id));
      toast({
        title: 'Deleted',
        description: 'Category removed successfully.',
      });
      setDeleteTarget(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
              className="relative border border-slate-200 rounded-none bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <button
                type="button"
                aria-label="Delete category"
                className="absolute right-3 top-3 text-destructive hover:text-destructive/80"
                onClick={() => setDeleteTarget(category)}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex gap-4 p-4">
                <div className="h-16 w-16 rounded-none bg-slate-100 overflow-hidden flex items-center justify-center text-slate-500 text-xs font-semibold shrink-0">
                  {category.image ? (
                    <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{category.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">{category.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {category.subcategories.length} Subcategories
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/admin/categories/${category.id}`}>
                      <Button variant="outline" className="h-8 px-3 text-xs">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs gap-1"
                      onClick={() => startEdit(category)}
                    >
                      <Pencil className="w-3 h-3" />
                      Edit Name
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) cancelEdit();
        else setIsEditOpen(true);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Category Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>Cancel</Button>
            <Button
              onClick={() => {
                const category = categories.find((c) => c.id === editingId);
                if (category) saveEdit(category);
              }}
              disabled={isSaving || !editName.trim()}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {
        if (!open) setDeleteTarget(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Deleting this category will also delete all subcategories and products.
                  For safety, move products to another category before deleting.
                </span>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
