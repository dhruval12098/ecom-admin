'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Label } from '../../../../components/ui/label';
import { Upload, Save, Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


type Leader = {
  id: number;
  name: string;
  title: string;
  description: string;
  image: string;
};

export default function LeadershipPage() {
  const { toast } = useToast();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [newLeader, setNewLeader] = useState<Omit<Leader, 'id'>>({ name: '', title: '', description: '', image: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingLeaderId, setEditingLeaderId] = useState<number | null>(null);
  const [uploadingImageId, setUploadingImageId] = useState<number | 'new' | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/leadership`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setLeaders(
            result.data.map((l: any) => ({
              id: l.id,
              name: l.name || '',
              title: l.title || '',
              description: l.description || '',
              image: l.image_url || ''
            }))
          );
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load leadership data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaders();
  }, [toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, leaderId: number | 'new') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('Max file size is 2 MB.');
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2 MB.',
        variant: 'destructive',
      });
      event.currentTarget.value = '';
      return;
    }

    setUploadingImageId(leaderId);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);

      const response = await fetch(`${API_BASE_URL}/api/leadership/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const imageUrl = result.data.publicUrl;
        if (leaderId === 'new') {
          setNewLeader(prev => ({ ...prev, image: imageUrl }));
        } else {
          setLeaders(prev =>
            prev.map(leader =>
              leader.id === leaderId ? { ...leader, image: imageUrl } : leader
            )
          );
        }
        toast({
          title: 'Success',
          description: 'Image uploaded successfully.',
        });
      } else {
        setUploadError(result.error || 'Upload failed');
        toast({
          title: 'Error',
          description: result.error || 'Upload failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setUploadError('Upload failed: ' + (error as Error).message);
      toast({
        title: 'Error',
        description: 'Upload failed: ' + (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploadingImageId(null);
    }
  };

  const handleAddLeader = async () => {
    if (!newLeader.name || !newLeader.title || !newLeader.description || !newLeader.image) {
      toast({
        title: 'Error',
        description: 'Please fill all fields and upload an image for the new leader.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/leadership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLeader.name,
          title: newLeader.title,
          description: newLeader.description,
          imageUrl: newLeader.image,
          sortOrder: leaders.length
        })
      });
      const result = await response.json();
      if (result.success) {
        setLeaders(prev => [
          ...prev,
          {
            id: result.data.id,
            name: result.data.name,
            title: result.data.title,
            description: result.data.description,
            image: result.data.image_url || ''
          }
        ]);
        setNewLeader({ name: '', title: '', description: '', image: '' });
        setIsAddingNew(false);
        toast({
          title: 'Success',
          description: 'Leader added successfully.',
        });
      } else {
        throw new Error(result.error || 'Failed to add leader');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add leader: ' + (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateLeader = (id: number, field: keyof Omit<Leader, 'id'>, value: string) => {
    setLeaders(prev =>
      prev.map(leader =>
        leader.id === id ? { ...leader, [field]: value } : leader
      )
    );
  };

  const handleDeleteLeader = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/leadership/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setLeaders(prev => prev.filter(leader => leader.id !== id));
        toast({
          title: 'Success',
          description: 'Leader deleted successfully.',
        });
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete: ' + (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isAddingNew) {
        await handleAddLeader();
      }
      const updates = leaders.map((leader, index) =>
        fetch(`${API_BASE_URL}/api/leadership/${leader.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: leader.name,
            title: leader.title,
            description: leader.description,
            imageUrl: leader.image,
            sortOrder: index
          })
        })
      );
      const results = await Promise.all(updates);
      const jsonResults = await Promise.all(results.map(r => r.json()));
      const hasError = jsonResults.some(r => !r.success);
      if (hasError) {
        throw new Error('One or more updates failed');
      }
      toast({
        title: 'Success',
        description: 'Leadership team data saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save leadership data.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Button variant="outline" size="sm" asChild className="mb-3 gap-2">
        <Link href="/admin/content?tab=about">
          <ArrowLeft className="h-4 w-4" />
          Back to About
        </Link>
      </Button>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Our Leadership Team</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Manage Leadership Profiles</CardTitle>
          <CardDescription>Add, edit, or remove members of your leadership team.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="text-muted-foreground">Loading...</div>
          )}
          <div className="space-y-6">
            {leaders.map(leader => (
              <div key={leader.id} className="border p-4 rounded-md shadow-sm">
                {editingLeaderId === leader.id ? (
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor={`leader-name-${leader.id}`}>Name</Label>
                      <Input
                        id={`leader-name-${leader.id}`}
                        value={leader.name}
                        onChange={(e) => handleUpdateLeader(leader.id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`leader-title-${leader.id}`}>Title</Label>
                      <Input
                        id={`leader-title-${leader.id}`}
                        value={leader.title}
                        onChange={(e) => handleUpdateLeader(leader.id, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`leader-description-${leader.id}`}>Description</Label>
                      <Textarea
                        id={`leader-description-${leader.id}`}
                        value={leader.description}
                        onChange={(e) => handleUpdateLeader(leader.id, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Image</Label>
                      {leader.image && (
                        <img src={leader.image} alt={leader.name} className="mt-2 h-24 w-24 object-cover rounded-md" />
                      )}
                      <Input
                        type="file"
                        className="mt-2"
                        onChange={(e) => handleImageUpload(e, leader.id)}
                        disabled={uploadingImageId === leader.id}
                      />
                      {uploadingImageId === leader.id && <p className="text-sm text-muted-foreground">Uploading...</p>}
                      {uploadError && uploadingImageId === leader.id && <p className="text-sm text-red-500">{uploadError}</p>}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingLeaderId(null)}>Cancel</Button>
                      <Button onClick={() => setEditingLeaderId(null)}>Done</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    {leader.image && (
                      <img src={leader.image} alt={leader.name} className="h-20 w-20 object-cover rounded-full" />
                    )}
                    <div className="grow">
                      <h4 className="font-semibold">{leader.name}</h4>
                      <p className="text-sm text-muted-foreground">{leader.title}</p>
                      <p className="text-sm mt-1">{leader.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingLeaderId(leader.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteLeader(leader.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isAddingNew ? (
              <div className="border p-4 rounded-md shadow-sm bg-muted/40">
                <h4 className="font-semibold mb-4">Add New Leader</h4>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="new-leader-name">Name</Label>
                    <Input
                      id="new-leader-name"
                      value={newLeader.name}
                      onChange={(e) => setNewLeader(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-leader-title">Title</Label>
                    <Input
                      id="new-leader-title"
                      value={newLeader.title}
                      onChange={(e) => setNewLeader(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-leader-description">Description</Label>
                    <Textarea
                      id="new-leader-description"
                      value={newLeader.description}
                      onChange={(e) => setNewLeader(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Image</Label>
                    {newLeader.image && (
                      <img src={newLeader.image} alt="New Leader" className="mt-2 h-24 w-24 object-cover rounded-md" />
                    )}
                    <Input
                      type="file"
                      className="mt-2"
                      onChange={(e) => handleImageUpload(e, 'new')}
                      disabled={uploadingImageId === 'new'}
                    />
                    {uploadingImageId === 'new' && <p className="text-sm text-muted-foreground">Uploading...</p>}
                    {uploadError && uploadingImageId === 'new' && <p className="text-sm text-red-500">{uploadError}</p>}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingNew(false)}>Cancel</Button>
                    <Button onClick={handleAddLeader}>
                      <Plus className="mr-2 h-4 w-4" /> Add Leader
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full mt-4" onClick={() => setIsAddingNew(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add New Leader
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
