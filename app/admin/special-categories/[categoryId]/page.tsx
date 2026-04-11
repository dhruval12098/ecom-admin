"use client";

import { type ChangeEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

type SpecialCategory = {
  id: number;
  name: string;
  slug: string;
};

type SpecialSubcategory = {
  id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  status?: string | null;
};

export default function SpecialSubcategoriesPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { toast } = useToast();
  const [categoryName, setCategoryName] = useState('Special Category');
  const [subcategories, setSubcategories] = useState<SpecialSubcategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newSub, setNewSub] = useState({ name: '', description: '', status: 'active' });
  const [newSubImageUrl, setNewSubImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSub, setEditSub] = useState({ name: '', description: '', status: 'active' });
  const [editSubImageUrl, setEditSubImageUrl] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpecialSubcategory | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    mode: 'new' | 'edit'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2 MB.',
        variant: 'destructive'
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
      const response = await fetch(`${API_BASE_URL}/api/special-subcategories/upload`, {
        method: 'POST',
        body: formDataUpload
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload failed');
      if (mode === 'new') setNewSubImageUrl(result.data.publicUrl);
      else setEditSubImageUrl(result.data.publicUrl);
      toast({ title: 'Success', description: 'Image uploaded successfully.' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Image upload failed.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/special-categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const found = result.data.find((c: SpecialCategory) => String(c.id) === String(categoryId));
          if (found) setCategoryName(found.name);
        }
      } catch {
        // ignore
      }
    };
    const fetchSubcategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/special-subcategories?categoryId=${categoryId}`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setSubcategories(result.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load special subcategories.',
          variant: 'destructive'
        });
      }
    };
    if (categoryId) {
      fetchCategory();
      fetchSubcategories();
    }
  }, [categoryId, toast]);

  const handleAddSubcategory = async () => {
    if (!newSub.name.trim()) {
      toast({
        title: 'Error',
        description: 'Subcategory name is required.',
        variant: 'destructive'
      });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-subcategories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          name: newSub.name,
          description: newSub.description || null,
          imageUrl: newSubImageUrl || null,
          status: newSub.status || 'active'
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Create failed');
      setSubcategories((prev) => [...prev, result.data]);
      setNewSub({ name: '', description: '', status: 'active' });
      setNewSubImageUrl('');
      setIsAdding(false);
      toast({ title: 'Success', description: 'Subcategory added.' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add subcategory.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (sub: SpecialSubcategory) => {
    setEditingId(sub.id);
    setEditSub({
      name: sub.name,
      description: sub.description || '',
      status: (sub.status || 'active').toLowerCase()
    });
    setEditSubImageUrl(sub.image_url || sub.imageUrl || '');
    setIsEditOpen(true);
  };

  const handleEditSubcategory = async () => {
    if (!editingId) return;
    if (!editSub.name.trim()) {
      toast({
        title: 'Error',
        description: 'Subcategory name is required.',
        variant: 'destructive'
      });
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-subcategories/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          name: editSub.name,
          description: editSub.description || null,
          imageUrl: editSubImageUrl || null,
          status: editSub.status || 'active'
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Update failed');
      setSubcategories((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...result.data } : s))
      );
      setIsEditOpen(false);
      setEditingId(null);
      setEditSubImageUrl('');
      toast({ title: 'Success', description: 'Subcategory updated.' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update subcategory.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (sub: SpecialSubcategory) => {
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
      const response = await fetch(`${API_BASE_URL}/api/special-subcategories/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Delete failed');
      setSubcategories((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      closeDeleteModal();
      toast({ title: 'Deleted', description: 'Subcategory removed.' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete subcategory.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/special-categories">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">{categoryName}</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage special subcategories</p>
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
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Subcategory Image</label>
              <div className="rounded-lg border-2 border-dashed border-border p-5 text-center">
                <Upload className="mx-auto mb-2 w-6 h-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Upload an image for this subcategory</p>
                <p className="text-xs text-muted-foreground mt-1">Shown in the frontend nav and subcategory cards</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'new')}
                  className="mt-3"
                  disabled={isUploading}
                />
                {newSubImageUrl && <p className="text-xs text-muted-foreground mt-2">Image selected</p>}
              </div>
            </div>
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
              <label className="block text-sm font-medium text-foreground mb-2">Description</label>
              <textarea
                value={newSub.description}
                onChange={(e) => setNewSub({ ...newSub, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <select
                value={newSub.status}
                onChange={(e) => setNewSub({ ...newSub, status: e.target.value })}
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddSubcategory} disabled={isSaving || isUploading}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subcategories.map((sub) => (
            <Card key={sub.id} className="p-5 border border-slate-200 rounded-none shadow-sm hover:shadow transition-shadow bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{sub.name}</div>
                  {(sub.image_url || sub.imageUrl) && (
                    <div className="mt-2 h-24 w-full max-w-[180px] overflow-hidden rounded-md border border-slate-200">
                      <img
                        src={sub.image_url || sub.imageUrl || ''}
                        alt={sub.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="text-xs text-slate-500">{sub.description || 'No description'}</div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">{sub.status || 'active'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openEdit(sub)}
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

      <Dialog open={isEditOpen && editingId !== null} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="block text-xs font-medium text-foreground">Subcategory Image</label>
              <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                <Upload className="mx-auto mb-2 w-5 h-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'edit')}
                  disabled={isUploading}
                />
                {editSubImageUrl && (
                  <div className="mt-3 h-24 overflow-hidden rounded-md border border-border">
                    <img src={editSubImageUrl} alt="Subcategory" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
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
              <label className="block text-xs font-medium text-foreground mb-2">Description</label>
              <textarea
                value={editSub.description}
                onChange={(e) => setEditSub({ ...editSub, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-2">Status</label>
              <select
                value={editSub.status}
                onChange={(e) => setEditSub({ ...editSub, status: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubcategory} disabled={isSaving || isUploading}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Subcategory?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            This will remove the subcategory and unlink any special products under it.
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
