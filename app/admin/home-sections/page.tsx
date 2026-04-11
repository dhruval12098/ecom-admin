"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


const DEFAULT_SECTION_TABS = [
  { key: "top_seller", label: "Top Seller" },
  { key: "best_deal", label: "Best Deal" },
  { key: "new_arrivals", label: "New Arrivals" }
];

type SectionDef = {
  id: number;
  section_key: string;
  title: string;
  subtitle?: string | null;
  type: "products" | "banner";
  image_url?: string | null;
  link_url?: string | null;
  cta_label?: string | null;
  card_size?: "wide" | "narrow" | null;
  sort_order?: number;
  is_active?: boolean;
};

type Product = {
  id: number;
  name: string;
  slug?: string;
  price?: number;
  original_price?: number;
  image_url?: string;
  variants?: Array<{
    id: number;
    name?: string | null;
    type?: string | null;
    price?: number | string | null;
  }>;
};

type AvailableProductRow = {
  product: Product;
  variantOptions: Array<{
    id: number | null;
    label: string;
    price: number;
  }>;
};

type SectionItem = {
  id: number;
  section: string;
  product_id: number;
  variant_id?: number | null;
  product?: Product | null;
  variant?: {
    id: number;
    name?: string | null;
    type?: string | null;
    price?: number | string | null;
  } | null;
};

export default function HomeSectionsPage() { 
  const { toast } = useToast(); 
  const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; 
  const [viewTab, setViewTab] = useState<"all" | "order">("all");
  const [sectionDefs, setSectionDefs] = useState<SectionDef[]>([]); 
  const [activeTab, setActiveTab] = useState(DEFAULT_SECTION_TABS[0].key); 
  const [products, setProducts] = useState<Product[]>([]); 
  const [sections, setSections] = useState<Record<string, SectionItem[]>>({}); 
  const [loading, setLoading] = useState(true); 
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [variantSelections, setVariantSelections] = useState<Record<number, number | null>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSectionKey, setNewSectionKey] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionType, setNewSectionType] = useState<SectionDef["type"]>("products");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerLinkUrl, setBannerLinkUrl] = useState(""); 
  const [bannerCtaLabel, setBannerCtaLabel] = useState(""); 
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false); 
  const [sectionOrderDrafts, setSectionOrderDrafts] = useState<Record<string, string>>({}); 
  const [sectionOrderList, setSectionOrderList] = useState<string[]>([]);

  const tabs = useMemo(() => {
    const activeDefs = (sectionDefs || [])
      .filter((def) => def && def.is_active !== false)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((def) => ({ key: def.section_key, label: def.title, type: def.type }));

    if (activeDefs.length > 0) return activeDefs;
    return DEFAULT_SECTION_TABS.map((tab) => ({ ...tab, type: "products" as const }));
  }, [sectionDefs]);

  const activeDef = useMemo(() => {
    return (sectionDefs || []).find((def) => def.section_key === activeTab) || null;
  }, [sectionDefs, activeTab]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [defsRes, productsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/homepage-section-defs?include_inactive=1`),
        fetch(`${API_BASE_URL}/api/products`),
      ]);

      const defsJson = await defsRes.json().catch(() => ({})); 
      const defsData = Array.isArray(defsJson?.data) ? defsJson.data : []; 
      setSectionDefs(defsData); 
      setSectionOrderDrafts( 
        Object.fromEntries( 
          defsData.map((def: any) => [def.section_key, String(def.sort_order ?? 0)]) 
        ) 
      ); 
      setSectionOrderList(
        (defsData || [])
          .filter((def: any) => def?.section_key && def?.is_active !== false)
          .slice()
          .sort((a: any, b: any) => {
            const aType = a?.type === "banner" ? 1 : 0;
            const bType = b?.type === "banner" ? 1 : 0;
            if (aType !== bType) return aType - bType;
            return Number(a?.sort_order || 0) - Number(b?.sort_order || 0);
          })
          .map((def: any) => def.section_key)
      );

      const productsJson = await productsRes.json();
      const productsData = productsJson?.data || [];
      setProducts(productsData);

      const productSectionKeys = (defsData || [])
        .filter((def: any) => def?.type === 'products' && def?.is_active !== false)
        .sort((a: any, b: any) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0))
        .map((def: any) => def.section_key)
        .filter(Boolean);

      const keysToLoad = productSectionKeys.length 
        ? productSectionKeys 
        : DEFAULT_SECTION_TABS.map((s) => s.key); 
      if (keysToLoad.length > 0 && !keysToLoad.includes(activeTab)) {
        setActiveTab(keysToLoad[0]);
      }

      const sectionResponses = await Promise.all( 
        keysToLoad.map((key: string) => 
          fetch(`${API_BASE_URL}/api/homepage-sections?section=${encodeURIComponent(key)}`) 
        ) 
      );

      const sectionEntries: Record<string, SectionItem[]> = {};
      for (let i = 0; i < keysToLoad.length; i++) {
        const sectionKey = keysToLoad[i];
        const response = sectionResponses[i];
        if (!response.ok) {
          sectionEntries[sectionKey] = [];
          continue;
        }
        const result = await response.json();
        sectionEntries[sectionKey] = Array.isArray(result?.data) ? result.data : [];
      }
      setSections(sectionEntries);
    } catch (error) {
      setSections({});
    } finally {
      setLoading(false);
    }
  };

  const loadSection = async (sectionKey: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/homepage-sections?section=${sectionKey}`);
      if (!response.ok) return;
      const result = await response.json();
      setSections((prev) => ({
        ...prev,
        [sectionKey]: Array.isArray(result?.data) ? result.data : []
      }));
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!activeDef || activeDef.type !== 'banner') return;
    setBannerSubtitle(String(activeDef.subtitle || ''));
    setBannerImageUrl(String(activeDef.image_url || ''));
    setBannerLinkUrl(String(activeDef.link_url || ''));
    setBannerCtaLabel(String(activeDef.cta_label || ''));
    setSectionOrderDrafts((prev) => ({
      ...prev,
      [activeDef.section_key]: String(activeDef.sort_order ?? 0)
    }));
  }, [activeDef?.id]);

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const selectedKeys = useMemo(() => {
    const current = sections[activeTab] || [];
    return new Set(
      current.map((item) => `${item.product_id}:${item.variant_id ?? "base"}`)
    );
  }, [sections, activeTab]);

  const availableProducts = useMemo<AvailableProductRow[]>(() => {
    const term = search.trim().toLowerCase();
    return products
      .map((product) => {
        const productName = String(product.name || "").toLowerCase();
        if (term && !productName.includes(term)) return null;

      const variants = Array.isArray(product.variants) ? product.variants : [];
        const hasDefaultSelected = selectedKeys.has(`${product.id}:base`);

        const variantOptions =
          variants.length > 0
            ? variants
                .filter((variant) => !selectedKeys.has(`${product.id}:${variant.id}`))
                .map((variant) => ({
                  id: variant.id,
                  label: variant.name || variant.type || `Variant #${variant.id}`,
                  price: Number(variant.price || 0)
                }))
            : hasDefaultSelected
              ? []
              : [
                  {
                    id: null,
                    label: "Default",
                    price: Number(product.price || 0)
                  }
                ];

        if (variantOptions.length === 0) return null;
        return { product, variantOptions };
      })
      .filter(Boolean) as AvailableProductRow[];
  }, [products, selectedKeys, search]);

  const handleAdd = async (productId: number, variantId?: number | null) => {
    try {
      setBusyId(productId);
      setErrorMessage("");
      const response = await fetch(`${API_BASE_URL}/api/homepage-sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeTab, productId, variantId: variantId ?? null })
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to add product");
      }

      await loadSection(activeTab);
      toast({
        title: "Added",
        description: "Product added to homepage section."
      });
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to add product");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      setBusyId(itemId);
      setErrorMessage("");
      const response = await fetch(`${API_BASE_URL}/api/homepage-sections/${itemId}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to remove product");
      }
      await loadSection(activeTab);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to remove product");
    } finally {
      setBusyId(null);
    }
  };

  const currentItems = sections[activeTab] || [];

  const handleCreateSection = async () => { 
    try { 
      setErrorMessage(""); 
      const activeDefs = (sectionDefs || []).filter((def) => def && def.is_active !== false);
      const productOrders = activeDefs.filter((d) => d.type === "products").map((d) => Number(d.sort_order || 0));
      const bannerOrders = activeDefs.filter((d) => d.type === "banner").map((d) => Number(d.sort_order || 0));
      const minBannerOrder = bannerOrders.length ? Math.min(...bannerOrders) : null;
      const maxProductOrder = productOrders.length ? Math.max(...productOrders) : 0;
      const maxAnyOrder = activeDefs.length ? Math.max(...activeDefs.map((d) => Number(d.sort_order || 0))) : 0;
      const defaultSortOrder =
        newSectionType === "products"
          ? (minBannerOrder !== null ? minBannerOrder - 1 : maxProductOrder + 1)
          : maxAnyOrder + 1;
      const payload = { 
        section_key: newSectionKey.trim(), 
        title: newSectionTitle.trim(), 
        type: newSectionType, 
        is_active: true, 
        sort_order: defaultSortOrder
      }; 
 
      const response = await fetch(`${API_BASE_URL}/api/homepage-section-defs`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to create section");
      }

      setCreateDialogOpen(false);
      setNewSectionKey("");
      setNewSectionTitle("");
      setNewSectionType("products");

      await loadAll();
      setActiveTab(result.data.section_key);
      toast({ title: "Saved", description: "Homepage section created." });
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to create section");
    }
  };

  const handleSaveBanner = async () => {
    try {
      if (!activeDef || activeDef.type !== 'banner') return;
      setErrorMessage("");
      const payload = {
        section_key: activeDef.section_key,
        title: activeDef.title,
        type: "banner",
        subtitle: bannerSubtitle,
        image_url: bannerImageUrl,
        link_url: bannerLinkUrl,
        cta_label: bannerCtaLabel,
        sort_order: activeDef.sort_order ?? 0,
        is_active: activeDef.is_active !== false
      };
      const response = await fetch(`${API_BASE_URL}/api/homepage-section-defs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to save banner");
      }
      await loadAll();
      toast({ title: "Saved", description: "Banner section updated." });
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to save banner");
    }
  };

  const handleSaveSectionOrder = async () => { 
    try { 
      if (!activeDef) return; 
      setErrorMessage(""); 
      const sortOrderRaw = sectionOrderDrafts[activeDef.section_key]; 
      const sortOrder = Number(sortOrderRaw);
      const payload = {
        section_key: activeDef.section_key,
        title: activeDef.title,
        type: activeDef.type,
        subtitle: activeDef.subtitle ?? null,
        image_url: activeDef.image_url ?? null,
        link_url: activeDef.link_url ?? null,
        cta_label: activeDef.cta_label ?? null,
        card_size: activeDef.card_size ?? null,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        is_active: activeDef.is_active !== false
      };

      const response = await fetch(`${API_BASE_URL}/api/homepage-section-defs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to save section order");
      }

      await loadAll();
      toast({ title: "Saved", description: "Section order updated." });
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to save section order");
    } 
  }; 

  const moveSectionOrderItem = (fromIndex: number, toIndex: number) => {
    setSectionOrderList((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = prev.slice();
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const handleSaveSectionOrderList = async () => {
    try {
      setErrorMessage("");
      const defsMap = new Map((sectionDefs || []).map((d) => [d.section_key, d]));
      const keys = (sectionOrderList || []).filter((k) => defsMap.has(k));
      for (let i = 0; i < keys.length; i++) {
        const def = defsMap.get(keys[i]);
        if (!def) continue;
        const payload = {
          section_key: def.section_key,
          title: def.title,
          type: def.type,
          subtitle: def.subtitle ?? null,
          image_url: def.image_url ?? null,
          link_url: def.link_url ?? null,
          cta_label: def.cta_label ?? null,
          card_size: def.card_size ?? null,
          sort_order: i,
          is_active: def.is_active !== false,
        };
        const response = await fetch(`${API_BASE_URL}/api/homepage-section-defs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.success) {
          throw new Error(result?.error || "Failed to save section order");
        }
      }
      await loadAll();
      toast({ title: "Saved", description: "Section order updated." });
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to save section order");
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("contentType", file.type);
    formData.append("folder", folder);

    const response = await fetch(`${API_BASE_URL}/api/storage`, {
      method: "POST",
      body: formData
    });
    const result = await response.json();
    if (!result?.success) {
      throw new Error(result?.error || "Upload failed");
    }
    return result?.data?.publicUrl as string;
  };

  const handleBannerImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2 MB.",
        variant: "destructive"
      });
      if (input) input.value = "";
      return;
    }

    setUploadingBannerImage(true);
    setErrorMessage("");
    try {
      const url = await uploadImage(file, "homepage-sections");
      setBannerImageUrl(url);
      toast({ title: "Uploaded", description: "Banner image uploaded." });
    } catch (error: any) {
      setErrorMessage(error?.message || "Upload failed");
    } finally {
      setUploadingBannerImage(false);
      if (input) input.value = "";
    }
  };

  const handleDeleteSectionDef = async (def: SectionDef) => {
    if (!def?.id) return;
    try {
      setDeletingSectionId(def.id);
      setErrorMessage("");
      const response = await fetch(`${API_BASE_URL}/api/homepage-section-defs/${def.id}`, {
        method: "DELETE"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to delete section");
      }
      toast({ title: "Deleted", description: "Homepage section deleted." });
      await loadAll();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Failed to delete section.",
        variant: "destructive"
      });
    } finally {
      setDeletingSectionId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Homepage Sections</h1>
          <p className="text-sm text-muted-foreground">Manage homepage product sections and banners.</p>
        </div>

        <Tabs value={viewTab} onValueChange={(value) => setViewTab(value as any)}>
          <TabsList className="inline-flex bg-transparent p-0 gap-2">
            <TabsTrigger value="all">All Sections</TabsTrigger>
            <TabsTrigger value="order">Section Order</TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Reorder Sections</h2>
                  <p className="text-sm text-muted-foreground">
                    Set the section display order. Products first, banners last.
                  </p>
                </div>
                <Button onClick={handleSaveSectionOrderList} disabled={sectionOrderList.length === 0}>
                  Save Order
                </Button>
              </div>
              {errorMessage ? <div className="mt-2 text-sm text-destructive">{errorMessage}</div> : null}
              <Separator className="my-4" />
              {sectionOrderList.length === 0 ? (
                <div className="text-sm text-muted-foreground">No sections found.</div>
              ) : (
                <div className="space-y-2">
                  {sectionOrderList.map((key, idx) => {
                    const def = (sectionDefs || []).find((d) => d.section_key === key);
                    if (!def) return null;
                    return (
                      <div
                        key={key}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3"
                      >
                        <div className="min-w-[240px]">
                          <div className="text-sm font-medium text-foreground">{def.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {def.type === "banner" ? "Banner" : "Products"} • {def.section_key}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => moveSectionOrderItem(idx, idx - 1)}
                            disabled={idx === 0}
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => moveSectionOrderItem(idx, idx + 1)}
                            disabled={idx === sectionOrderList.length - 1}
                          >
                            Down
                          </Button>
                          <ConfirmDialog
                            trigger={
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={deletingSectionId === def.id}
                              >
                                Delete
                              </Button>
                            }
                            title="Delete section?"
                            description="This deletes the section definition. (Products already assigned may remain in the database.)"
                            confirmText="Delete"
                            confirmVariant="destructive"
                            onConfirm={() => handleDeleteSectionDef(def)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {tabs.map((section) => (
                  <TabsTrigger key={section.key} value={section.key}>
                    {section.label}
                  </TabsTrigger>
                ))}
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="ml-2" onClick={() => setCreateDialogOpen(true)}>
                      + Add Section
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create Homepage Section</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Section Key</div>
                        <Input
                          value={newSectionKey}
                          onChange={(e) => setNewSectionKey(e.target.value)}
                          placeholder="e.g. weekly_specials"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Title</div>
                        <Input
                          value={newSectionTitle}
                          onChange={(e) => setNewSectionTitle(e.target.value)}
                          placeholder="e.g. Weekly Specials"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Type</div>
                        <Select value={newSectionType} onValueChange={(value) => setNewSectionType(value as any)}>
                          <SelectTrigger className="h-9 w-full rounded-lg border border-gray-200 bg-white">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="products">Products</SelectItem>
                            <SelectItem value="banner">Banner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {errorMessage ? <div className="text-sm text-destructive">{errorMessage}</div> : null}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateSection} disabled={!newSectionKey.trim() || !newSectionTitle.trim()}>
                        Save
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsList>

              {tabs.map((section) => (
                <TabsContent key={section.key} value={section.key} className="space-y-4">
                  <Card className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{section.label}</h2>
                        <p className="text-sm text-muted-foreground">
                          {section.type === "banner" ? "Banner content for this section." : "Selected products for this section."}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {section.type === "products" ? (
                          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild> 
                            <Button onClick={() => setDialogOpen(true)}>Add Products</Button> 
                          </DialogTrigger> 
                          <DialogContent className="sm:max-w-3xl"> 
                            <DialogHeader>
                              <DialogTitle>Add products to {tabs.find((s) => s.key === activeTab)?.label}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                              />
                              {errorMessage ? (
                                <div className="text-sm text-destructive">{errorMessage}</div>
                              ) : null}
                              <div className="max-h-[360px] overflow-y-auto border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead>Variant</TableHead>
                                      <TableHead>Price</TableHead>
                                      <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {availableProducts.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-sm text-muted-foreground">
                                          No available products.
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      availableProducts.map((row) => {
                                        const selectedVariantId =
                                          Object.prototype.hasOwnProperty.call(variantSelections, row.product.id)
                                            ? variantSelections[row.product.id]
                                            : row.variantOptions[0]?.id ?? null;
                                        const selectedOption =
                                          row.variantOptions.find((opt) => opt.id === selectedVariantId) ||
                                          row.variantOptions[0];
                                        return (
                                          <TableRow key={`${row.product.id}`}>
                                            <TableCell className="font-medium">{row.product.name}</TableCell>
                                            <TableCell>
                                              <Select
                                                value={selectedOption?.id === null ? "base" : String(selectedOption?.id)}
                                                onValueChange={(value) => {
                                                  setVariantSelections((prev) => ({
                                                    ...prev,
                                                    [row.product.id]: value === "base" ? null : Number(value)
                                                  }));
                                                }}
                                              >
                                                <SelectTrigger className="h-9 w-full min-w-[120px] rounded-lg border border-gray-200 bg-white">
                                                  <SelectValue placeholder="Select variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {row.variantOptions.map((option) => (
                                                    <SelectItem
                                                      key={`${row.product.id}-${option.id ?? "base"}`}
                                                      value={option.id === null ? "base" : String(option.id)}
                                                    >
                                                      {option.label}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </TableCell>
                                            <TableCell>{formatCurrency(Number(selectedOption?.price || 0))}</TableCell>
                                            <TableCell className="text-right">
                                              <Button
                                                size="sm"
                                                onClick={() => handleAdd(row.product.id, selectedOption?.id ?? null)}
                                                disabled={busyId === row.product.id || !selectedOption}
                                              >
                                                Add
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Close
                              </Button>
                            </DialogFooter>
                          </DialogContent> 
                        </Dialog>
                        ) : null}
                      </div>
                    </div>
                <Separator className="my-4" />
                {section.type === "banner" ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Configure banner content here (saved to <span className="font-medium">homepage_section_defs</span>).
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Subtitle</div>
                        <Input value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">CTA Label</div>
                        <Input value={bannerCtaLabel} onChange={(e) => setBannerCtaLabel(e.target.value)} placeholder="e.g. Shop now" />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <div className="text-sm font-medium">Banner Image</div>
                        <div className="flex flex-col gap-2">
                          <Input type="file" accept="image/*" onChange={handleBannerImageUpload} disabled={uploadingBannerImage} />
                          <div className="text-xs text-muted-foreground">
                            {uploadingBannerImage ? "Uploading..." : bannerImageUrl ? `Uploaded: ${bannerImageUrl}` : "No image uploaded yet."}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <div className="text-sm font-medium">Link URL</div>
                        <Input value={bannerLinkUrl} onChange={(e) => setBannerLinkUrl(e.target.value)} placeholder="/specials or https://..." />
                      </div>
                    </div>
                    {errorMessage ? <div className="text-sm text-destructive">{errorMessage}</div> : null}
                    <div className="flex justify-end">
                      <Button onClick={handleSaveBanner} disabled={!activeDef}>
                        Save Banner
                      </Button>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="text-sm text-muted-foreground">Loading products...</div>
                ) : currentItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No products selected yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Variant</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((item) => {
                        const product = item.product || productMap.get(item.product_id);
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{product?.name || "Unknown product"}</TableCell>
                            <TableCell>{item.variant?.name || (item.variant_id ? `Variant #${item.variant_id}` : "Default")}</TableCell>
                            <TableCell>
                              {formatCurrency(Number(item.variant?.price ?? product?.price ?? 0))}
                            </TableCell>
                            <TableCell className="text-right">
                              <ConfirmDialog
                                trigger={
                                  <Button variant="outline" size="sm" disabled={busyId === item.id}>
                                    Remove
                                  </Button>
                                }
                                title="Remove product?"
                                description="This product will be removed from the homepage section."
                                confirmText="Remove"
                                confirmVariant="destructive"
                                onConfirm={() => handleRemove(item.id)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
          ))}
            </Tabs>
          </TabsContent>
        </Tabs>
      </div> 
    </AdminLayout> 
  ); 
}
