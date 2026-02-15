'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


type StorageImage = {
  name: string;
  publicUrl: string;
  createdAt: string;
};

type HeroSlide = {
  id: number;
  image_url?: string;
  mobile_image_url?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
};

export default function HeroTrashPage() {
  const { toast } = useToast();
  const [images, setImages] = useState<StorageImage[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [imagesRes, slidesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/storage/images?prefix=hero-folder`),
          fetch(`${API_BASE_URL}/api/hero-slides`)
        ]);
        const imagesJson = await imagesRes.json();
        const slidesJson = await slidesRes.json();
        if (imagesJson.success && Array.isArray(imagesJson.data)) {
          setImages(imagesJson.data);
        }
        if (slidesJson.success && Array.isArray(slidesJson.data)) {
          setHeroSlides(slidesJson.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load hero storage.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const usedUrls = useMemo(() => {
    const urls = new Set<string>();
    heroSlides.forEach((slide) => {
      const desktop = slide.image_url || slide.imageUrl;
      const mobile = slide.mobile_image_url || slide.mobileImageUrl;
      if (desktop) urls.add(desktop);
      if (mobile) urls.add(mobile);
    });
    return urls;
  }, [heroSlides]);

  const unusedImages = useMemo(
    () => images.filter((img) => !usedUrls.has(img.publicUrl)),
    [images, usedUrls]
  );

  const allSelected = unusedImages.length > 0 && unusedImages.every((img) => selected[img.name]);

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      unusedImages.forEach((img) => {
        next[img.name] = true;
      });
      setSelected(next);
    }
  };

  const handleDelete = async () => {
    const paths = unusedImages.filter((img) => selected[img.name]).map((img) => img.name);
    if (paths.length === 0) {
      toast({
        title: 'No selection',
        description: 'Select at least one image to delete.',
      });
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`${API_BASE_URL}/api/storage`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      setImages((prev) => prev.filter((img) => !paths.includes(img.name)));
      setSelected({});
      toast({
        title: 'Deleted',
        description: 'Selected images were removed from storage.'
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error?.message || 'Please try again.',
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
          <Link href="/admin/content?tab=hero">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Hero Banner Trash</h1>
            <p className="text-muted-foreground text-sm mt-1">Delete unused hero images from storage.</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {unusedImages.length} unused image{unusedImages.length === 1 ? '' : 's'}
          </div>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting || unusedImages.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">File</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-muted-foreground">
                      Loading images...
                    </td>
                  </tr>
                )}
                {!isLoading && unusedImages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-muted-foreground">
                      No unused hero images found.
                    </td>
                  </tr>
                )}
                {!isLoading && unusedImages.map((img) => (
                  <tr key={img.name} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={Boolean(selected[img.name])}
                        onCheckedChange={(checked) =>
                          setSelected((prev) => ({ ...prev, [img.name]: Boolean(checked) }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <img src={img.publicUrl} alt={img.name} className="w-20 h-12 object-cover rounded-md border" />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{img.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {img.createdAt ? new Date(img.createdAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
