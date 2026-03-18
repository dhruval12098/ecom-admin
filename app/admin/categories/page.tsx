'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/slugify';
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
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


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
  status?: string | null;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  sort_order?: number | null;
  subcategories: Subcategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories?includeInactive=true&includeEmpty=true`);
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
    setEditSlug(category.slug || '');
    setEditStatus((category.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active');
    setEditImageUrl(category.image || category.image_url || '');
    setIsEditOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditSlug('');
    setEditStatus('active');
    setEditImageUrl('');
    setIsEditOpen(false);
  };

  const handleEditImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2 MB.',
        variant: 'destructive',
      });
      event.currentTarget.value = '';
      return;
    }
    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('fileName', file.name);
      formDataUpload.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/categories/upload`, {
        method: 'POST',
        body: formDataUpload,
      });
      const result = await response.json();
      if (result.success) {
        setEditImageUrl(result.data.publicUrl);
        toast({
          title: 'Success',
          description: 'Image uploaded successfully.',
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Image upload failed.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
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
    const nextSlug = editSlug.trim()
      ? slugify(editSlug.trim())
      : slugify(nextName);
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nextName,
          slug: nextSlug,
          description: category.description ?? null,
          imageUrl: editImageUrl || null,
          sortOrder: category.sort_order ?? undefined,
          status: editStatus
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      setCategories(prev =>
        prev.map(item =>
          item.id === category.id
            ? { ...item, name: nextName, slug: nextSlug, status: editStatus, image: editImageUrl || null }
            : item
        )
      );
      setEditingId(null);
      setEditName('');
      setEditSlug('');
      setEditStatus('active');
      setEditImageUrl('');
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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = categories.filter((category) => {
    if (!normalizedSearch) return true;
    return String(category.name || '').toLowerCase().includes(normalizedSearch);
  });

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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredCategories.length} of {categories.length} categories
          </div>
        </div>

        {/* Categories Table */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Subcategories</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCategories.map((category) => {
                  const status = (category.status || 'active').toLowerCase();
                  const isInactive = status === 'inactive';
                  return (
                    <tr key={category.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground overflow-hidden">
                            {category.image || category.image_url ? (
                              <img
                                src={category.image || category.image_url || ''}
                                alt={category.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span>{category.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">{category.name}</div>
                            <div className="text-xs text-muted-foreground">/{category.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isInactive
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isInactive ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {category.subcategories.length}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
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
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-xs text-destructive border-destructive/40 hover:border-destructive"
                            onClick={() => setDeleteTarget(category)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) cancelEdit();
        else setIsEditOpen(true);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category Image</label>
              <div className="mb-3 w-full h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                {editImageUrl ? (
                  <img
                    src={editImageUrl}
                    alt="Category"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-muted-foreground">No image</div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleEditImageUpload}
                className="mt-1 text-sm"
                disabled={isUploading}
              />
            </div>
            <label className="block text-sm font-medium text-foreground">Category Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground"
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Slug (optional)</label>
              <input
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="auto-generated from name if blank"
                className="w-full text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to auto-generate from the category name.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value === 'inactive' ? 'inactive' : 'active')}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={cancelEdit} disabled={isSaving}>Cancel</Button>
            <Button
              onClick={() => {
                const category = categories.find((c) => c.id === editingId);
                if (category) saveEdit(category);
              }}
              disabled={isSaving || isUploading || !editName.trim()}
            >
              {isSaving ? 'Saving...' : isUploading ? 'Uploading...' : 'Save'}
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

