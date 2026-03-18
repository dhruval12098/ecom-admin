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


const SECTION_TABS = [
  { key: "top_seller", label: "Top Seller" },
  { key: "best_deal", label: "Best Deal" },
  { key: "new_arrivals", label: "New Arrivals" }
];

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
  const [activeTab, setActiveTab] = useState(SECTION_TABS[0].key);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Record<string, SectionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [variantSelections, setVariantSelections] = useState<Record<number, number | null>>({});

  const loadAll = async () => {
    try {
      setLoading(true);
      const [productsRes, ...sectionResponses] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products`),
        ...SECTION_TABS.map((section) =>
          fetch(`${API_BASE_URL}/api/homepage-sections?section=${section.key}`)
        )
      ]);

      const productsJson = await productsRes.json();
      const productsData = productsJson?.data || [];
      setProducts(productsData);

      const sectionEntries: Record<string, SectionItem[]> = {};
      for (let i = 0; i < SECTION_TABS.length; i++) {
        const sectionKey = SECTION_TABS[i].key;
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Homepage Sections</h1>
          <p className="text-sm text-muted-foreground">Pick which products appear in Top Seller, Best Deal, and New Arrivals.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {SECTION_TABS.map((section) => (
              <TabsTrigger key={section.key} value={section.key}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SECTION_TABS.map((section) => (
            <TabsContent key={section.key} value={section.key} className="space-y-4">
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{section.label}</h2>
                    <p className="text-sm text-muted-foreground">Selected products for this section.</p>
                  </div>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setDialogOpen(true)}>Add Products</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Add products to {SECTION_TABS.find((s) => s.key === activeTab)?.label}</DialogTitle>
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
                                )})
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
                </div>
                <Separator className="my-4" />
                {loading ? (
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
                              {formatCurrency(
                                Number(item.variant?.price ?? product?.price ?? 0)
                              )}
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
      </div>
    </AdminLayout>
  );
}
