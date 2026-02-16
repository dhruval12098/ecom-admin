'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


export default function OurStoryPage() {
  const { toast } = useToast();
  const [storyContent, setStoryContent] = useState({
    description: '',
    image: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Load existing story content
  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/about-story`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setStoryContent({
            description: result.data.description || '',
            image: result.data.image_url || ''
          });
        } else {
          // Set default values if no story exists
          setStoryContent({
            description: 'Our story begins with a passion for connecting local farmers with conscious consumers who care about quality and sustainability.',
            image: 'https://placehold.co/600x400?text=Our+Story'
          });
        }
      } catch (error) {
        console.error('Error fetching story:', error);
        toast({
          title: "Error",
          description: "Failed to load story content",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStory();
  }, [toast]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      const response = await fetch(`${API_BASE_URL}/api/about-story/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setStoryContent(prev => ({
          ...prev,
          image: result.data.publicUrl
        }));
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

  const handleSaveChanges = async () => {
    if (!storyContent.description.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    toast({
      title: "Saving",
      description: "Saving changes...",
    });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/about-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: storyContent.description,
          imageUrl: storyContent.image || null
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Our Story content saved successfully.",
        });
      } else {
        throw new Error(result.error || 'Save failed');
      }
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

  const handleRemoveImage = () => {
    setStoryContent(prev => ({ ...prev, image: '' }));
    toast({
      title: "Image removed",
      description: "Click Save Changes to apply.",
    });
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
            <h1 className="text-3xl font-bold text-foreground">Manage Our Story</h1>
            <p className="text-muted-foreground mt-1">Edit the description and image for the "Our Story" section on the frontend.</p>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading story content...</span>
          </div>
        )}

        {!isLoading && (

        <Card className="p-6 max-w-2xl">
          <div className="space-y-4">
            <div>
              <Label htmlFor="storyDescription">Description *</Label>
              <Textarea
                id="storyDescription"
                value={storyContent.description}
                onChange={(e) => setStoryContent({...storyContent, description: e.target.value})}
                placeholder="Enter your company's story here..."
                rows={8}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">This description will appear on the About Us page</p>
            </div>
            <div>
              <Label htmlFor="storyImage">Image</Label>
              <div className="mt-1 flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={storyContent.image || '/placeholder.svg'} 
                    alt="Our Story Preview" 
                    className="w-32 h-32 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg width="128" height="128" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="128" height="128" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-size="12" text-anchor="middle" dy=".3em" fill="%236b7280"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {storyContent.image && (
                    <ConfirmDialog
                      title="Remove image?"
                      description="This will remove the image from the story. You can upload a new one later."
                      confirmText="Remove"
                      confirmVariant="destructive"
                      onConfirm={handleRemoveImage}
                      trigger={
                        <button 
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90"
                          title="Remove image"
                        >
                          ×
                        </button>
                      }
                    />
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    id="storyImage"
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="mb-2"
                    disabled={isUploading}
                  />
                  <ConfirmDialog
                    title="Save changes?"
                    description="This will update the Our Story content on the frontend."
                    confirmText={isSaving ? "Saving..." : "Save Changes"}
                    onConfirm={handleSaveChanges}
                    disabled={isSaving || isLoading}
                    trigger={
                      <Button 
                        className="gap-2 bg-primary w-full"
                        disabled={isSaving || isLoading}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    }
                  />
                </div>
              </div>
              {uploadError && (
                <p className="text-destructive text-sm mt-2">{uploadError}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">Recommended size: 600x400 pixels</p>
            </div>
          </div>
        </Card>
        )}
      </div>
    </AdminLayout>
  );
}
