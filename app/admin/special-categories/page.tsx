'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type SpecialCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  pickup_only?: boolean | null;
  pickup_address?: string | null;
  status?: string | null;
};

export default function SpecialCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<SpecialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SpecialCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-categories`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load special categories.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);


  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-categories/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: 'Deleted', description: 'Special category removed.' });
        setDeleteTarget(null);
        fetchCategories();
      } else {
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete special category.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Special Categories</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create and manage special menus with preorder and pickup settings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/special-products">
              <Button variant="outline">Manage Special Products</Button>
            </Link>
            <Link href="/admin/special-categories/add">
              <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Special Category
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">All Special Categories</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Image</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Pickup</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && categories.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                      No special categories yet.
                    </td>
                  </tr>
                )}
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{cat.name}</div>
                      <div className="text-xs text-muted-foreground">/{cat.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      {(cat.image_url || cat.imageUrl) ? (
                        <img
                          src={cat.image_url || cat.imageUrl || ''}
                          alt={cat.name}
                          className="h-12 w-16 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No image</span>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{cat.status || 'active'}</td>
                    <td className="px-4 py-3">{cat.pickup_address ? 'Pickup' : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/special-categories/${cat.id}`} className="text-xs font-semibold text-primary hover:underline">
                          Subcategories
                        </Link>
                        <Link href={`/admin/special-categories/edit/${cat.id}`} className="p-1.5 text-muted-foreground hover:text-foreground" aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 text-muted-foreground hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Special Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will also remove linked special subcategories and products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
