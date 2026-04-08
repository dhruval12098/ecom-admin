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
import { Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type SpecialProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  status?: string | null;
  sort_order?: number | null;
};

export default function SpecialProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<SpecialProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SpecialProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-products`);
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setProducts(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load special products.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-products/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: 'Deleted', description: 'Special product removed.' });
        setDeleteTarget(null);
        fetchProducts();
      } else {
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete special product.',
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
            <h1 className="text-3xl font-semibold text-foreground">Special Products</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage preorder-only products for special categories.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/special-categories">
              <Button variant="outline">Manage Special Categories</Button>
            </Link>
            <Link href="/admin/special-products/add">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Special Product
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">All Special Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && sorted.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                      No special products yet.
                    </td>
                  </tr>
                )}
                {sorted.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{product.name}</div>
                      <div className="text-xs text-muted-foreground">/{product.slug}</div>
                    </td>
                    <td className="px-4 py-3">€{Number(product.price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 capitalize">{product.status || 'active'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/special-products/edit/${product.id}`}
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
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
            <AlertDialogTitle>Delete Special Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the special product.
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
