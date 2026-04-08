"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type SpecialCategory = {
  id: number;
  name: string;
  slug: string;
};

type SpecialSubcategory = {
  id: number;
  name: string;
  description?: string | null;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSub, setEditSub] = useState({ name: '', description: '', status: 'active' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SpecialSubcategory | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
          status: newSub.status || 'active'
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Create failed');
      setSubcategories((prev) => [...prev, result.data]);
      setNewSub({ name: '', description: '', status: 'active' });
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
              <Button onClick={handleAddSubcategory} disabled={isSaving}>
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
            <Button onClick={handleEditSubcategory} disabled={isSaving}>
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
