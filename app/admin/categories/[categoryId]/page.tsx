'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Upload, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


type Product = {
  id: number;
  name: string;
  slug: string;
};

type Subcategory = {
  id: number;
  name: string;
  slug: string;
  image?: string;
  image_url?: string;
  category_id: number;
  products?: Product[];
};

export default function CategoryDetailsPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { toast } = useToast();
  const [categoryName, setCategoryName] = useState('Category');
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', slug: '', imageUrl: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editSub, setEditSub] = useState({ name: '', slug: '', imageUrl: '' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Subcategory | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const cat = result.data.find((c: any) => String(c.id) === categoryId);
          if (cat) {
            setCategoryName(cat.name);
            const normalized = (cat.subcategories || []).map((sub: any) => ({
              ...sub,
              image_url: sub.image_url || sub.image || null
            }));
            setSubcategories(normalized);
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load category.',
          variant: 'destructive',
        });
      }
    };
    if (categoryId) {
      fetchData();
    }
  }, [categoryId, toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/subcategories/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setNewSub(prev => ({ ...prev, imageUrl: result.data.publicUrl }));
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);
      const response = await fetch(`${API_BASE_URL}/api/subcategories/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setEditSub(prev => ({ ...prev, imageUrl: result.data.publicUrl }));
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

  const handleAddSubcategory = async () => {
    if (!newSub.name.trim()) {
      toast({
        title: 'Error',
        description: 'Subcategory name is required.',
        variant: 'destructive',
      });
      return;
    }
    const slug = newSub.slug || newSub.name.toLowerCase().replace(/\s+/g, '-');
    try {
      const response = await fetch(`${API_BASE_URL}/api/subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          name: newSub.name,
          slug,
          imageUrl: newSub.imageUrl || null
        })
      });
      const result = await response.json();
      if (result.success) {
        setSubcategories(prev => [...prev, result.data]);
        setNewSub({ name: '', slug: '', imageUrl: '' });
        setIsAdding(false);
        toast({
          title: 'Success',
          description: 'Subcategory added successfully.',
        });
      } else {
        throw new Error(result.error || 'Create failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add subcategory.',
        variant: 'destructive',
      });
    }
  };

  const handleEditSubcategory = async () => {
    if (!editingSubId) return;
    if (!editSub.name.trim()) {
      toast({
        title: 'Error',
        description: 'Subcategory name is required.',
        variant: 'destructive',
      });
      return;
    }
    const slug = editSub.slug || editSub.name.toLowerCase().replace(/\s+/g, '-');
    try {
      const response = await fetch(`${API_BASE_URL}/api/subcategories/${editingSubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          name: editSub.name,
          slug,
          imageUrl: editSub.imageUrl || null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSubcategories(prev =>
          prev.map(s =>
            s.id === editingSubId
              ? { ...s, name: editSub.name, slug, image_url: editSub.imageUrl || s.image_url }
              : s
          )
        );
        setEditingSubId(null);
        setEditSub({ name: '', slug: '', imageUrl: '' });
        setIsEditOpen(false);
        toast({
          title: 'Success',
          description: 'Subcategory updated successfully.',
        });
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subcategory.',
        variant: 'destructive',
      });
    }
  };

  const openDeleteModal = (sub: Subcategory) => {
    setDeleteTarget(sub);
    setIsDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/subcategories/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Delete failed');
      setSubcategories(prev => prev.filter(s => s.id !== deleteTarget.id));
      closeDeleteModal();
      toast({
        title: 'Deleted',
        description: 'Subcategory removed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subcategory.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{categoryName}</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage subcategories</p>
          </div>
          <div className="ml-auto">
            <Button className="gap-2" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4" />
              Add Subcategory
            </Button>
          </div>
        </div>

        {isAdding && (
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Subcategory Name</label>
              <input
                type="text"
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Slug (optional)</label>
              <input
                type="text"
                value={newSub.slug}
                onChange={(e) => setNewSub({ ...newSub, slug: e.target.value })}
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Image</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>
              {newSub.imageUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={newSub.imageUrl}
                    alt="Subcategory"
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddSubcategory}>Save</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subcategories.map((sub) => (
          <Card key={sub.id} className="p-5 border border-slate-200 rounded-none shadow-sm hover:shadow transition-shadow bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-none bg-slate-100 overflow-hidden flex items-center justify-center">
                    {sub.image_url ? (
                      <img src={sub.image_url} alt={sub.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-500">No Img</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{sub.name}</div>
                    <div className="text-xs text-slate-500">{sub.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingSubId(sub.id);
                      setEditSub({
                        name: sub.name,
                        slug: sub.slug,
                        imageUrl: sub.image_url || '',
                      });
                      setIsEditOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => openDeleteModal(sub)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {subcategories.length === 0 && (
            <div className="text-muted-foreground text-sm">No subcategories yet.</div>
          )}
        </div>
      </div>
      {isEditOpen && editingSubId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-lg rounded-none bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <div className="text-lg font-semibold text-slate-900">Edit Subcategory</div>
                <div className="text-xs text-slate-500">Update details for the selected subcategory</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingSubId(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">Subcategory Name</label>
                <input
                  type="text"
                  value={editSub.name}
                  onChange={(e) => setEditSub({ ...editSub, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">Slug (optional)</label>
                <input
                  type="text"
                  value={editSub.slug}
                  onChange={(e) => setEditSub({ ...editSub, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">Display Image</label>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" className="gap-2">
                      <label className="inline-flex items-center justify-center rounded-md bg-slate-200 text-black text-xs font-medium px-3 py-2 shadow-none border border-gray-300 cursor-pointer">
                        Choose File
                        <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageUpload}
                        disabled={isUploading}
                        className="sr-only"
                      />
                    </label>
                  </Button>
                  {editSub.imageUrl ? (
                    <img
                      src={editSub.imageUrl}
                      alt="Subcategory"
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No image</span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingSubId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSubcategory}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-xl rounded-none bg-white shadow-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="text-lg font-semibold text-slate-900">Delete Subcategory</div>
                  <div className="text-xs text-slate-500">This action cannot be undone.</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={closeDeleteModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="text-sm text-slate-700">
                Deleting <span className="font-semibold">{deleteTarget.name}</span> will also delete the products listed below.
              </div>
              <div className="border border-slate-200 rounded-lg max-h-56 overflow-auto">
                {deleteTarget.products && deleteTarget.products.length > 0 ? (
                  <ul className="divide-y divide-slate-100">
                    {deleteTarget.products.map((product) => (
                      <li key={product.id} className="px-4 py-2 text-sm text-slate-700">
                        {product.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">No products found in this subcategory.</div>
                )}
              </div>
              <div className="text-xs text-slate-500">
                If you want to keep these products, move them to another subcategory before deleting.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                Delete Subcategory
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
