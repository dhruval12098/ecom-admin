'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Save } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

type Trend = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
};

export default function EditTrendPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const trendId = params?.id;

  const [trend, setTrend] = useState<Trend | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [linkIsSelection, setLinkIsSelection] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [useSelector, setUseSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrend = async () => {
      if (!trendId) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/trends/${trendId}`);
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load trend');
        }
        setTrend({
          id: result.data.id,
          title: result.data.title || '',
          description: result.data.description || '',
          imageUrl: result.data.image_url || '',
          linkUrl: result.data.link_url || ''
        });
      } catch (err: any) {
        setError(err?.message || 'Failed to load trend');
      }
    };
    fetchTrend();
  }, [trendId]);

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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !trend) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError('Max file size is 2 MB.');
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2 MB.',
        variant: 'destructive'
      });
      event.currentTarget.value = '';
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);
      formData.append('folder', 'trends');

      const response = await fetch(`${API_BASE_URL}/api/storage`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      setTrend((prev) => (prev ? { ...prev, imageUrl: result.data.publicUrl } : prev));
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!trend) return;
    if (!trend.title || !trend.description || !trend.imageUrl) {
      setError('Title, description, and image are required.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/trends/${trend.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trend.title,
          description: trend.description,
          imageUrl: trend.imageUrl,
          linkUrl: trend.linkUrl || null
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }
      toast({
        title: 'Saved',
        description: 'Trend updated successfully.'
      });
      router.push('/admin/content?tab=trends');
    } catch (err: any) {
      setError(err?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const LinkWizard = ({
    open,
    onOpenChange,
    onApply
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Link Target for Trend</DialogTitle>
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
              <Button type="button" variant="outline" onClick={() => setStep((prev) => Math.max(prev - 1, 1))} disabled={step === 1}>
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

  if (!trend) {
    return (
      <AdminLayout>
        <div className="text-muted-foreground">Loading trend...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/content?tab=trends">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Edit Trend</h1>
            <p className="text-muted-foreground text-sm mt-1">Update trend content and link.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={trend.title} onChange={(e) => setTrend({ ...trend, title: e.target.value })} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={trend.description} onChange={(e) => setTrend({ ...trend, description: e.target.value })} rows={3} />
          </div>
          <div>
            <Label>Image</Label>
            <div className="flex items-center gap-4">
              <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
              {trend.imageUrl && <img src={trend.imageUrl} alt="Trend" className="w-24 h-16 object-cover rounded" />}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Use Category Selector</Label>
              <Switch
                checked={useSelector}
                onCheckedChange={(checked) => {
                  setUseSelector(checked);
                  if (checked) {
                    setTrend({ ...trend, linkUrl: '' });
                    setLinkIsSelection(true);
                  } else {
                    setLinkIsSelection(false);
                  }
                }}
              />
            </div>
            <div>
              <Label>Link</Label>
              <Input
                value={trend.linkUrl}
                onChange={(e) => {
                  setTrend({ ...trend, linkUrl: e.target.value });
                  if (e.target.value) setLinkIsSelection(false);
                }}
                placeholder="https://example.com/collection"
                readOnly={useSelector}
              />
            </div>
            {useSelector && (
              <Button type="button" variant="outline" onClick={() => setWizardOpen(true)} className="mt-3">
                Select Category / Product / Variant
              </Button>
            )}
          </div>
          {error && <div className="text-destructive text-sm">{error}</div>}
          <div className="flex gap-2">
            <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Link href="/admin/content?tab=trends">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
        <LinkWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onApply={(link) => {
            setLinkIsSelection(true);
            setTrend((prev) => (prev ? { ...prev, linkUrl: link } : prev));
          }}
        />
      </div>
    </AdminLayout>
  );
}
