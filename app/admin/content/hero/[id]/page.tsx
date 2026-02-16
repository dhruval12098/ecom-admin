'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Save } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


type HeroSlide = {
  id: number;
  imageUrl: string;
  mobileImageUrl: string;
};

export default function EditHeroSlidePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const slideId = params?.id;

  const [slide, setSlide] = useState<HeroSlide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
    const [uploadingTarget, setUploadingTarget] = useState<null | 'desktop' | 'mobile'>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSlide = async () => {
      if (!slideId) return;
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/hero-slides/${slideId}`);
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load banner');
        }
        setSlide({
          id: result.data.id,
          imageUrl: result.data.image_url || result.data.imageUrl || '',
          mobileImageUrl: result.data.mobile_image_url || result.data.mobileImageUrl || ''
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to load banner');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlide();
  }, [slideId]);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('contentType', file.type);

    const response = await fetch(`${API_BASE_URL}/api/storage`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Upload failed');
    return result.data.publicUrl as string;
  };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'desktop' | 'mobile') => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_UPLOAD_BYTES) {
        setError('Max file size is 2 MB.');
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 2 MB.',
          variant: 'destructive',
        });
        event.currentTarget.value = '';
        return;
      }
    setUploadingTarget(target);
      setError('');
      try {
        const url = await uploadImage(file);
      setSlide((prev) =>
        prev
          ? {
              ...prev,
              imageUrl: target === 'desktop' ? url : prev.imageUrl,
              mobileImageUrl: target === 'mobile' ? url : prev.mobileImageUrl
            }
          : prev
      );
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploadingTarget(null);
    }
    };

  const handleSave = async () => {
    if (!slide) return;
    if (!slide.imageUrl) {
      setError('Desktop image is required.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/hero-slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: slide.imageUrl,
          mobileImageUrl: slide.mobileImageUrl || null
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Save failed');
      toast({
        title: 'Updated',
        description: 'Hero banner updated successfully.'
      });
      router.push('/admin/content?tab=hero');
    } catch (err: any) {
      setError(err?.message || 'Save failed');
      toast({
        title: 'Error',
        description: 'Failed to update banner.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/content?tab=hero">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Edit Hero Banner</h1>
            <p className="text-muted-foreground text-sm mt-1">Update desktop and mobile images for this slide.</p>
          </div>
        </div>

        {isLoading && (
          <div className="text-muted-foreground">Loading banner...</div>
        )}

        {!isLoading && slide && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Desktop Image *</Label>
                <div className="flex gap-3">
                  <Input
                    type="file"
                    ref={desktopRef}
                    accept="image/*"
                    onChange={(e) => handleUpload(e, 'desktop')}
                    disabled={uploadingTarget === 'desktop'}
                  />
                </div>
                {slide.imageUrl && (
                  <img src={slide.imageUrl} alt="Desktop preview" className="w-full h-48 rounded-lg object-cover border" />
                )}
              </div>
              <div className="space-y-3">
                <Label>Mobile Image (optional)</Label>
                <div className="flex gap-3">
                  <Input
                    type="file"
                    ref={mobileRef}
                    accept="image/*"
                    onChange={(e) => handleUpload(e, 'mobile')}
                    disabled={uploadingTarget === 'mobile'}
                  />
                </div>
                {slide.mobileImageUrl && (
                  <img src={slide.mobileImageUrl} alt="Mobile preview" className="w-full h-48 rounded-lg object-cover border" />
                )}
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isSaving || uploadingTarget !== null || !slide.imageUrl}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/admin/content?tab=hero">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
