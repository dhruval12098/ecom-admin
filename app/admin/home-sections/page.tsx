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
import { formatCurrency } from "@/lib/currency";

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
};

type SectionItem = {
  id: number;
  section: string;
  product_id: number;
  product?: Product | null;
};

export default function HomeSectionsPage() {
  const [activeTab, setActiveTab] = useState(SECTION_TABS[0].key);
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Record<string, SectionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

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

  const selectedIds = useMemo(() => {
    const current = sections[activeTab] || [];
    return new Set(current.map((item) => item.product_id));
  }, [sections, activeTab]);

  const availableProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (selectedIds.has(product.id)) return false;
      if (!term) return true;
      return product.name?.toLowerCase().includes(term);
    });
  }, [products, selectedIds, search]);

  const handleAdd = async (productId: number) => {
    try {
      setBusyId(productId);
      setErrorMessage("");
      const response = await fetch(`${API_BASE_URL}/api/homepage-sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: activeTab, productId })
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to add product");
      }

      await loadSection(activeTab);
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
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {availableProducts.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-sm text-muted-foreground">
                                    No available products.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                availableProducts.map((product) => (
                                  <TableRow key={product.id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{formatCurrency(Number(product.price || 0))}</TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        onClick={() => handleAdd(product.id)}
                                        disabled={busyId === product.id}
                                      >
                                        Add
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
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
                            <TableCell>{formatCurrency(Number(product?.price || 0))}</TableCell>
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
