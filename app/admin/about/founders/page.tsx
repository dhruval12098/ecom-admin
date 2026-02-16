'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Save, Plus, Trash2, X, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


type Founder = {
  id: number;
  name: string;
  title: string;
  description: string;
  image: string;
};

export default function FoundersPage() {
  const { toast } = useToast();
  const [founders, setFounders] = useState<Founder[]>([]);
  const [newFounder, setNewFounder] = useState<Omit<Founder, 'id'>>({
    name: '',
    title: '',
    description: '',
    image: ''
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchFounders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/founders`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setFounders(
            result.data.map((f: any) => ({
              id: f.id,
              name: f.name || '',
              title: f.role || '',
              description: f.bio || '',
              image: f.image_url || ''
            }))
          );
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load founders.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFounders();
  }, [toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, founderId?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('Max file size is 2 MB.');
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2 MB.",
        variant: "destructive",
      });
      event.currentTarget.value = '';
      return;
    }

    setIsUploading(true);
    setUploadError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);

      const response = await fetch(`${API_BASE_URL}/api/founders/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        const imageUrl = result.data.publicUrl;
        if (founderId) {
          setFounders(prev => prev.map(f => f.id === founderId ? { ...f, image: imageUrl } : f));
        } else {
          setNewFounder(prev => ({ ...prev, image: imageUrl }));
        }
        toast({
          title: "Success",
          description: "Image uploaded successfully.",
        });
      } else {
        setUploadError(result.error || 'Upload failed');
        toast({
          title: "Error",
          description: result.error || 'Upload failed',
          variant: "destructive",
        });
      }
    } catch (error) {
      setUploadError('Upload failed: ' + (error as Error).message);
      toast({
        title: "Error",
        description: 'Upload failed: ' + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFounder = async () => {
    if (!newFounder.name || !newFounder.title || !newFounder.description || !newFounder.image) {
      toast({
        title: "Error",
        description: "Please fill all fields and upload an image for the new founder.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/founders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFounder.name,
          role: newFounder.title,
          bio: newFounder.description,
          imageUrl: newFounder.image,
          sortOrder: founders.length
        })
      });
      const result = await response.json();
      if (result.success) {
        setFounders(prev => [
          ...prev,
          {
            id: result.data.id,
            name: result.data.name,
            title: result.data.role,
            description: result.data.bio,
            image: result.data.image_url || ''
          }
        ]);
        setNewFounder({ name: '', title: '', description: '', image: '' });
        setIsAddingNew(false);
        toast({
          title: "Success",
          description: "Founder added successfully.",
        });
      } else {
        throw new Error(result.error || 'Failed to add founder');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to add founder: ' + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateFounder = (id: number, field: keyof Omit<Founder, 'id'>, value: string) => {
    setFounders(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleDeleteFounder = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/founders/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setFounders(prev => prev.filter(f => f.id !== id));
        toast({
          title: "Success",
          description: "Founder deleted successfully.",
        });
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to delete: ' + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      if (isAddingNew) {
        await handleAddFounder();
      }
      const updates = founders.map((founder, index) =>
        fetch(`${API_BASE_URL}/api/founders/${founder.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: founder.name,
            role: founder.title,
            bio: founder.description,
            imageUrl: founder.image,
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
        title: "Success",
        description: "Founders content saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: 'Failed to save: ' + (error as Error).message,
        variant: "destructive",
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
            <Button variant="outline" size="sm" asChild className="mb-3 gap-2">
              <Link href="/admin/content?tab=about">
                <ArrowLeft className="w-4 h-4" />
                Back to About
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Manage Founders</h1>
            <p className="text-muted-foreground mt-1">Add, edit, or remove founder profiles.</p>
          </div>
          <Button onClick={() => setIsAddingNew(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Founder
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading founders...
          </div>
        )}

        {isAddingNew && (
          <Card className="p-6 border-2 border-primary/20 bg-primary/5">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add New Founder</h3>
                <Button variant="outline" size="sm" onClick={() => setIsAddingNew(false)} className="gap-1">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
              <div>
                <Label htmlFor="newName">Name</Label>
                <Input
                  id="newName"
                  value={newFounder.name}
                  onChange={(e) => setNewFounder(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newTitle">Title</Label>
                <Input
                  id="newTitle"
                  value={newFounder.title}
                  onChange={(e) => setNewFounder(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newDescription">Description</Label>
                <Textarea
                  id="newDescription"
                  value={newFounder.description}
                  onChange={(e) => setNewFounder(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newImage">Image</Label>
                <div className="mt-1 flex items-center gap-4">
                  {newFounder.image && (
                    <img 
                      src={newFounder.image} 
                      alt="New Founder" 
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  )}
                  <Input
                    id="newImage"
                    type="file"
                    onChange={(e) => handleImageUpload(e)}
                    accept="image/*"
                    className="flex-1"
                    disabled={isUploading}
                  />
                </div>
                {uploadError && (
                  <p className="text-destructive text-sm mt-2">{uploadError}</p>
                )}
              </div>
              <Button onClick={handleAddFounder} className="gap-2">
                <Save className="w-4 h-4" />
                Save Founder
              </Button>
            </div>
          </Card>
        )}

        {!isLoading && (
        <div className="grid gap-4">
          {founders.map((founder) => (
            <Card key={founder.id} className="p-6">
              <div className="flex items-start gap-4">
                <img 
                  src={founder.image} 
                  alt={founder.name} 
                  className="w-24 h-24 object-cover rounded-lg border"
                />
                <div className="flex-1 space-y-2">
                  <div>
                    <Label htmlFor={`founderName-${founder.id}`}>Name</Label>
                    <Input
                      id={`founderName-${founder.id}`}
                      value={founder.name}
                      onChange={(e) => handleUpdateFounder(founder.id, 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                      <Label htmlFor={`founderTitle-${founder.id}`}>Role</Label>
                    <Input
                      id={`founderTitle-${founder.id}`}
                      value={founder.title}
                      onChange={(e) => handleUpdateFounder(founder.id, 'title', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                      <Label htmlFor={`founderDescription-${founder.id}`}>Bio</Label>
                    <Textarea
                      id={`founderDescription-${founder.id}`}
                      value={founder.description}
                      onChange={(e) => handleUpdateFounder(founder.id, 'description', e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`founderImage-${founder.id}`}>Image</Label>
                    <div className="mt-1 flex items-center gap-4">
                      <Input
                        id={`founderImage-${founder.id}`}
                        type="file"
                        onChange={(e) => handleImageUpload(e, founder.id)}
                        accept="image/*"
                        className="flex-1"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteFounder(founder.id)}
                  className="gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} className="gap-2" disabled={isSaving || isLoading}>
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
