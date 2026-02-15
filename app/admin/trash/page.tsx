'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


type StorageImage = {
  name: string;
  publicUrl: string;
  createdAt: string;
};

type SectionKey =
  | 'hero'
  | 'products-main'
  | 'products-gallery'
  | 'categories'
  | 'subcategories'
  | 'about-story'
  | 'founders'
  | 'leadership'
  | 'trends';

type SectionState = {
  images: StorageImage[];
  usedUrls: Set<string>;
  selected: Record<string, boolean>;
  isLoading: boolean;
  isDeleting: boolean;
  showAll: boolean;
};

type SourceKey =
  | 'hero'
  | 'trends'
  | 'products'
  | 'productImages'
  | 'categories'
  | 'subcategories'
  | 'aboutStory'
  | 'founders'
  | 'leadership';

const trashSections: Array<{
  key: SectionKey;
  label: string;
  prefix: string;
  sources: SourceKey[];
  hint?: string;
}> = [
  {
    key: 'hero',
    label: 'Hero (Banner)',
    prefix: 'hero-folder',
    sources: ['hero', 'trends'],
    hint: 'Includes hero banners and any trends uploaded via storage.'
  },
  {
    key: 'products-main',
    label: 'Products (Main)',
    prefix: 'products/main',
    sources: ['products']
  },
  {
    key: 'products-gallery',
    label: 'Products (Gallery)',
    prefix: 'products/gallery',
    sources: ['productImages']
  },
  {
    key: 'categories',
    label: 'Categories',
    prefix: 'categories',
    sources: ['categories']
  },
  {
    key: 'subcategories',
    label: 'Subcategories',
    prefix: 'subcategories',
    sources: ['subcategories']
  },
  {
    key: 'about-story',
    label: 'About Story',
    prefix: 'about-story',
    sources: ['aboutStory']
  },
  {
    key: 'founders',
    label: 'Founders',
    prefix: 'about/founders',
    sources: ['founders']
  },
  {
    key: 'leadership',
    label: 'Leadership',
    prefix: 'about/leadership',
    sources: ['leadership']
  },
  {
    key: 'trends',
    label: 'Trends (Folder)',
    prefix: 'trends',
    sources: ['trends'],
    hint: 'If trends are still uploaded via storage, they may appear under Hero (Banner).'
  }
];

const emptyState: SectionState = {
  images: [],
  usedUrls: new Set<string>(),
  selected: {},
  isLoading: false,
  isDeleting: false,
  showAll: false
};

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json?.success) {
    throw new Error(json?.error || 'Request failed');
  }
  return Array.isArray(json.data) ? json.data : [];
};

const normalizeUrl = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const loadUrlsFromRows = (rows: any[], keys: string[]) => {
  const urls = new Set<string>();
  if (!Array.isArray(rows)) return urls;
  rows.forEach((row) => {
    keys.forEach((key) => {
      const value = normalizeUrl(row?.[key]);
      if (value) urls.add(value);
    });
  });
  return urls;
};

const sourceLoaders: Record<SourceKey, () => Promise<Set<string>>> = {
  hero: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/hero-slides`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl', 'mobile_image_url', 'mobileImageUrl']);
  },
  trends: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/trends`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  },
  products: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/products`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  },
  productImages: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/product-images`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  },
  categories: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/categories`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  },
  subcategories: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/subcategories`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  },
  aboutStory: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/about-story`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  },
  founders: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/founders`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  },
  leadership: async () => {
    const data = await fetchJson(`${API_BASE_URL}/api/leadership`);
    return loadUrlsFromRows(data, ['image_url', 'imageUrl']);
  }
};

const mergeUrlSets = (sets: Set<string>[]) => {
  const merged = new Set<string>();
  sets.forEach((set) => {
    set.forEach((value) => merged.add(value));
  });
  return merged;
};

export default function AdminTrashPage() {
  const { toast } = useToast();
  const [activeKey, setActiveKey] = useState<SectionKey>('hero');
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>(() => {
    const initial: Record<SectionKey, SectionState> = {} as Record<SectionKey, SectionState>;
    trashSections.forEach((section) => {
      initial[section.key] = { ...emptyState };
    });
    return initial;
  });

  const activeSection = trashSections.find((section) => section.key === activeKey) ?? trashSections[0];
  const sectionState = sections[activeKey];

  const loadSectionData = async (key: SectionKey) => {
    const section = trashSections.find((s) => s.key === key);
    if (!section) return;
    setSections((prev) => ({
      ...prev,
      [key]: { ...prev[key], isLoading: true }
    }));

    try {
      const [images, ...usedSets] = await Promise.all([
        fetchJson(`${API_BASE_URL}/api/storage/images?prefix=${encodeURIComponent(section.prefix)}`),
        ...section.sources.map((source) => sourceLoaders[source]())
      ]);
      const usedUrls = mergeUrlSets(usedSets);
      setSections((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          images,
          usedUrls,
          isLoading: false,
          selected: {}
        }
      }));
    } catch (error: any) {
      setSections((prev) => ({
        ...prev,
        [key]: { ...prev[key], isLoading: false }
      }));
      toast({
        title: 'Load failed',
        description: error?.message || 'Unable to load images.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    const preloadAll = async () => {
      for (const section of trashSections) {
        if (cancelled) return;
        await loadSectionData(section.key);
      }
    };
    preloadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sectionState.images.length && !sectionState.isLoading) {
      loadSectionData(activeKey);
    }
  }, [activeKey]);

  const unusedImages = useMemo(
    () => sectionState.images.filter((img) => !sectionState.usedUrls.has(img.publicUrl)),
    [sectionState.images, sectionState.usedUrls]
  );

  const displayImages = useMemo(
    () => (sectionState.showAll ? sectionState.images : unusedImages),
    [sectionState.showAll, sectionState.images, unusedImages]
  );

  const allSelected =
    unusedImages.length > 0 && unusedImages.every((img) => sectionState.selected[img.name]);

  const toggleAll = () => {
    setSections((prev) => {
      const next = { ...prev };
      const selected: Record<string, boolean> = {};
      if (!allSelected) {
        unusedImages.forEach((img) => {
          selected[img.name] = true;
        });
      }
      next[activeKey] = { ...next[activeKey], selected };
      return next;
    });
  };

  const toggleOne = (name: string, checked: boolean) => {
    setSections((prev) => ({
      ...prev,
      [activeKey]: {
        ...prev[activeKey],
        selected: { ...prev[activeKey].selected, [name]: checked }
      }
    }));
  };

  const handleDelete = async () => {
    const paths = unusedImages.filter((img) => sectionState.selected[img.name]).map((img) => img.name);
    if (paths.length === 0) {
      toast({
        title: 'No selection',
        description: 'Select at least one image to delete.'
      });
      return;
    }

    setSections((prev) => ({
      ...prev,
      [activeKey]: { ...prev[activeKey], isDeleting: true }
    }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/storage`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Delete failed');
      setSections((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          images: prev[activeKey].images.filter((img) => !paths.includes(img.name)),
          selected: {},
          isDeleting: false
        }
      }));
      toast({
        title: 'Deleted',
        description: 'Selected images were removed from storage.'
      });
    } catch (error: any) {
      setSections((prev) => ({
        ...prev,
        [activeKey]: { ...prev[activeKey], isDeleting: false }
      }));
      toast({
        title: 'Delete failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Storage Trash</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review unused images per folder and delete them in bulk.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {trashSections.map((section) => {
            const state = sections[section.key];
            const unusedCount = state.images.filter((img) => !state.usedUrls.has(img.publicUrl)).length;
            return (
              <button
                key={section.key}
                onClick={() => setActiveKey(section.key)}
                className={cn(
                  'rounded-lg border border-border bg-card p-4 text-left transition hover:border-foreground/30',
                  activeKey === section.key && 'border-foreground/40 ring-1 ring-foreground/10'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">{section.label}</div>
                  <span className="text-xs text-muted-foreground">Unused: {unusedCount}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{section.prefix}</div>
                {section.hint ? (
                  <div className="mt-2 text-xs text-muted-foreground">{section.hint}</div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              {unusedImages.length} unused image{unusedImages.length === 1 ? '' : 's'} in{' '}
              <span className="text-foreground font-medium">{activeSection.label}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {sectionState.showAll ? 'all images' : 'unused images only'}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setSections((prev) => ({
                  ...prev,
                  [activeKey]: { ...prev[activeKey], showAll: !prev[activeKey].showAll, selected: {} }
                }))
              }
            >
              {sectionState.showAll ? 'Show Unused Only' : 'Show All Images'}
            </Button>
            <ConfirmDialog
              title="Delete selected images?"
              description="This will permanently remove the selected images from storage."
              confirmText="Delete"
              confirmVariant="destructive"
              onConfirm={handleDelete}
              disabled={sectionState.isDeleting || unusedImages.length === 0}
              trigger={
                <Button variant="destructive" disabled={sectionState.isDeleting || unusedImages.length === 0}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              }
            />
          </div>
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
                {sectionState.isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-muted-foreground">
                      Loading images...
                    </td>
                  </tr>
                )}
                {!sectionState.isLoading && displayImages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-muted-foreground">
                      No images found for this folder.
                    </td>
                  </tr>
                )}
                {!sectionState.isLoading &&
                  displayImages.map((img) => {
                    const isUsed = sectionState.usedUrls.has(img.publicUrl);
                    const checkboxDisabled = sectionState.showAll && isUsed;
                    return (
                      <tr key={img.name} className="border-b border-border hover:bg-muted/30 transition">
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={Boolean(sectionState.selected[img.name])}
                            onCheckedChange={(checked) => toggleOne(img.name, Boolean(checked))}
                            disabled={checkboxDisabled}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <img src={img.publicUrl} alt={img.name} className="w-20 h-12 object-cover rounded-md border" />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{img.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{img.createdAt ? new Date(img.createdAt).toLocaleString() : '-'}</span>
                            {sectionState.showAll && (
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                  isUsed ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'
                                )}
                              >
                                {isUsed ? 'Used' : 'Unused'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
