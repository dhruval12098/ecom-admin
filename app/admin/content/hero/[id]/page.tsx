'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Save } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;


type HeroSlide = {
  id: number;
  imageUrl: string;
  mobileImageUrl: string;
  buttonLink?: string;
};

export default function EditHeroSlidePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const slideId = params?.id;

  const [slide, setSlide] = useState<HeroSlide | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [linkIsSelection, setLinkIsSelection] = useState(false);
  const [linkWizardOpen, setLinkWizardOpen] = useState(false);
  const [useSelector, setUseSelector] = useState(false);
  const [linkSelection, setLinkSelection] = useState({
    category: '',
    subcategory: '',
    product: '',
    variant: ''
  });
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
          mobileImageUrl: result.data.mobile_image_url || result.data.mobileImageUrl || '',
          buttonLink: result.data.button_link || result.data.link_url || ''
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to load banner');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlide();
  }, [slideId]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories?includeInactive=true&includeEmpty=true`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCatalog(result.data);
        }
      } catch {
        // keep UI stable
      }
    };
    fetchCatalog();
  }, []);

  const buildProductLink = (selection: { category: string; subcategory: string; product: string; variant: string }) => {
    const category = catalog.find((c) => String(c.id) === selection.category);
    const sub = category?.subcategories?.find((s: any) => String(s.id) === selection.subcategory);
    const product = sub?.products?.find((p: any) => String(p.id) === selection.product);
    if (!category || !sub || !product) return '';
    const base = `/${category.slug}/${sub.slug}/${product.slug || product.id}`;
    if (selection.variant) {
      return `${base}?variant=${selection.variant}`;
    }
    return base;
  };

  const LinkWizard = ({
    open,
    onOpenChange,
    title,
    onApply
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    onApply: (link: string) => void;
  }) => {
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ category: '', subcategory: '', product: '', variant: '' });
    const category = catalog.find((c) => String(c.id) === selection.category);
    const sub = category?.subcategories?.find((s: any) => String(s.id) === selection.subcategory);
    const product = sub?.products?.find((p: any) => String(p.id) === selection.product);
    const variants = product?.variants || [];

    useEffect(() => {
      if (!open) {
        setStep(1);
        setSelection({ category: '', subcategory: '', product: '', variant: '' });
      }
    }, [open]);

    const canNext =
      (step === 1 && selection.category) ||
      (step === 2 && selection.subcategory) ||
      (step === 3 && selection.product) ||
      (step === 4 && selection.variant);

    const handleNext = () => {
      if (step === 3 && (!variants || variants.length === 0)) {
        const link = buildProductLink(selection);
        onApply(link);
        onOpenChange(false);
        return;
      }
      setStep((prev) => Math.min(prev + 1, variants.length > 0 ? 4 : 3));
    };

    const handleBack = () => {
      setStep((prev) => Math.max(prev - 1, 1));
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground">Step {step} of {variants.length > 0 ? 4 : 3}</div>
          <div className="mt-4 space-y-3">
            {step === 1 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Choose Category</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {catalog.map((c: any) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`px-3 py-2 rounded-md border text-left ${selection.category === String(c.id) ? 'border-primary bg-primary/10' : 'border-border'}`}
                      onClick={() => setSelection({ category: String(c.id), subcategory: '', product: '', variant: '' })}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Choose Subcategory</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(category?.subcategories || []).map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`px-3 py-2 rounded-md border text-left ${selection.subcategory === String(s.id) ? 'border-primary bg-primary/10' : 'border-border'}`}
                      onClick={() => setSelection((prev) => ({ ...prev, subcategory: String(s.id), product: '', variant: '' }))}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Choose Product</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(sub?.products || []).map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`px-3 py-2 rounded-md border text-left ${selection.product === String(p.id) ? 'border-primary bg-primary/10' : 'border-border'}`}
                      onClick={() => setSelection((prev) => ({ ...prev, product: String(p.id), variant: '' }))}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Choose Variant</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {variants.map((v: any) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`px-3 py-2 rounded-md border text-left ${selection.variant === String(v.id) ? 'border-primary bg-primary/10' : 'border-border'}`}
                      onClick={() => setSelection((prev) => ({ ...prev, variant: String(v.id) }))}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <div className="flex justify-between w-full">
              <Button type="button" variant="outline" onClick={handleBack} disabled={step === 1}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                {step === (variants.length > 0 ? 4 : 3) ? (
                  <Button
                    type="button"
                    onClick={() => {
                      const link = buildProductLink(selection);
                      onApply(link);
                      onOpenChange(false);
                    }}
                    disabled={!canNext}
                  >
                    Use Link
                  </Button>
                ) : (
                  <Button type="button" onClick={handleNext} disabled={!canNext}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

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
          mobileImageUrl: slide.mobileImageUrl || null,
          buttonLink: slide.buttonLink || null
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Use Category Selector</Label>
                <Switch
                  checked={useSelector}
                  onCheckedChange={(checked) => {
                    setUseSelector(checked);
                    if (checked) {
                      setSlide((prev) => (prev ? { ...prev, buttonLink: '' } : prev));
                      setLinkIsSelection(true);
                    } else {
                      setLinkIsSelection(false);
                    }
                  }}
                />
              </div>
              <div>
                <Label>Banner Link</Label>
                <Input
                  type="url"
                  value={slide.buttonLink || ''}
                  onChange={(e) => {
                    setSlide((prev) => (prev ? { ...prev, buttonLink: e.target.value } : prev));
                    if (e.target.value) {
                      setLinkSelection({ category: '', subcategory: '', product: '', variant: '' });
                      setLinkIsSelection(false);
                    }
                  }}
                  placeholder="https://example.com/collection"
                  readOnly={useSelector}
                />
                <p className="text-xs text-muted-foreground">
                  {useSelector ? 'This link is generated from your selection.' : 'This link will open when the banner is clicked on the homepage.'}
                </p>
              </div>
              {useSelector && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLinkWizardOpen(true)}
                >
                  Select Category / Product / Variant
                </Button>
              )}
            </div>
            <LinkWizard
              open={linkWizardOpen}
              onOpenChange={setLinkWizardOpen}
              title="Select Link Target for Banner"
              onApply={(link) => {
                setLinkIsSelection(true);
                setSlide((prev) => (prev ? { ...prev, buttonLink: link } : prev));
              }}
            />

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
