"use client";

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


const emptyRate = {
  id: null,
  name: '',
  type: 'basic',
  min_order: null,
  max_order: null,
  price: 0,
  zone: '',
  estimated_days: '',
  active: true
};

export default function ShippingPage() {
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<any>(emptyRate);
  const [categories, setCategories] = useState<any[]>([]);
  const [excludedCategoryIds, setExcludedCategoryIds] = useState<number[]>([]);
  const [isSavingExclusions, setIsSavingExclusions] = useState(false);
  const [exclusionDialogOpen, setExclusionDialogOpen] = useState(false);
  const [exclusionSearch, setExclusionSearch] = useState('');

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/shipping-rates`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setShippingRates(result.data);
        }
      } catch (e) {
        // keep UI stable on failure
      } finally {
        setIsLoading(false);
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch (e) {
        // keep UI stable on failure
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        const result = await response.json();
        if (result.success && result.data) {
          const raw = result.data.excluded_free_shipping_category_ids || [];
          const parsed = Array.isArray(raw) ? raw : [];
          setExcludedCategoryIds(parsed.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id)));
        }
      } catch (e) {
        // keep UI stable on failure
      }
    };
    loadSettings();
  }, []);

  const deliveryZones = useMemo(() => {
    return shippingRates
      .filter((rate) => rate.type === 'basic')
      .map((rate) => ({
        id: rate.id,
        zone: rate.zone || rate.name,
        charge: rate.price,
        estimatedDays: rate.estimated_days || '-',
        type: rate.type
      }));
  }, [shippingRates]);

  const hasBasicRate = useMemo(
    () => shippingRates.some((rate) => rate.type === 'basic'),
    [shippingRates]
  );
  const hasFreeRate = useMemo(
    () => shippingRates.some((rate) => rate.type === 'free'),
    [shippingRates]
  );
  const canAddRate = !hasBasicRate || !hasFreeRate;

  const openCreate = () => {
    setDraft({
      ...emptyRate,
      type: hasBasicRate && !hasFreeRate ? 'free' : 'basic'
    });
    setDialogOpen(true);
  };

  const openEdit = (rate: any) => {
    setDraft({
      id: rate.id,
      name: rate.name || '',
      type: rate.type || 'basic',
      min_order: rate.min_order ?? null,
      max_order: rate.max_order ?? null,
      price: Number(rate.price || 0),
      zone: rate.zone || '',
      estimated_days: rate.estimated_days || '',
      active: !!rate.active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaveMessage('');
      if (draft.id) {
        await fetch(`${API_BASE_URL}/api/shipping-rates/${draft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft)
        });
      } else {
        const response = await fetch(`${API_BASE_URL}/api/shipping-rates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft)
        });
        const result = await response.json();
        if (result.success) {
          setShippingRates((prev) => [...prev, result.data]);
        }
      }

      if (draft.id) {
        setShippingRates((prev) => prev.map((r) => (r.id === draft.id ? { ...r, ...draft } : r)));
      }

      setDialogOpen(false);
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (e) {
      setSaveMessage('Save failed');
    }
  };

  const toggleExcludedCategory = (id: number) => {
    setExcludedCategoryIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((cid) => cid !== id);
      }
      return [...prev, id];
    });
  };

  const saveExcludedCategories = async () => {
    try {
      setIsSavingExclusions(true);
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excluded_free_shipping_category_ids: excludedCategoryIds
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }
      setSaveMessage('Saved');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (e) {
      setSaveMessage('Save failed');
    } finally {
      setIsSavingExclusions(false);
    }
  };

  const excludedCategoryNames = useMemo(() => {
    const map = new Map(categories.map((c) => [Number(c.id), c.name]));
    return excludedCategoryIds.map((id) => map.get(Number(id)) || `Category #${id}`);
  }, [categories, excludedCategoryIds]);

  const filteredCategories = useMemo(() => {
    const q = exclusionSearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => String(c.name || '').toLowerCase().includes(q));
  }, [categories, exclusionSearch]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-foreground">Shipping and Delivery</h1>
          <p className="text-muted-foreground text-sm">Manage shipping types, rates and delivery zones</p>
        </div>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Shipping Rates</h2>
              <p className="text-sm text-muted-foreground">Add and manage one standard rate plus one conditional free rate.</p>
            </div>
            <div className="flex items-center gap-3">
              {saveMessage && <span className="text-sm text-muted-foreground">{saveMessage}</span>}
              {!canAddRate && (
                <span className="text-xs text-muted-foreground">You already have both rates.</span>
              )}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary" onClick={openCreate} disabled={!canAddRate}>
                    Add Shipping Rate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{draft.id ? 'Edit Shipping Rate' : 'Add Shipping Rate'}</DialogTitle>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={draft.type} onValueChange={(value) => setDraft({ ...draft, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">standard</SelectItem>
                          <SelectItem value="free">conditional free</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value || 0) })} />
                      <p className="text-xs text-muted-foreground">{formatCurrency(Number(draft.price || 0))}</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Input value={draft.zone} onChange={(e) => setDraft({ ...draft, zone: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Min Order (€)</Label>
                      <Input type="number" value={draft.min_order ?? ''} onChange={(e) => setDraft({ ...draft, min_order: e.target.value === '' ? null : Number(e.target.value) })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Order (€)</Label>
                      <Input type="number" value={draft.max_order ?? ''} onChange={(e) => setDraft({ ...draft, max_order: e.target.value === '' ? null : Number(e.target.value) })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Days</Label>
                      <Input value={draft.estimated_days} onChange={(e) => setDraft({ ...draft, estimated_days: e.target.value })} />
                    </div>

                    <div className="space-y-2 flex items-center gap-3 pt-6">
                      <Switch checked={!!draft.active} onCheckedChange={(checked) => setDraft({ ...draft, active: checked })} />
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            Free shipping (conditional) is evaluated first, then standard rate applies.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Free Shipping Exclusions</h2>
              <p className="text-sm text-muted-foreground">
                Excluded categories do not count toward the free-shipping threshold.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setExclusionDialogOpen(true)}>
                Select Categories
              </Button>
              <Button onClick={saveExcludedCategories} disabled={isSavingExclusions}>
                {isSavingExclusions ? 'Saving...' : 'Save Exclusions'}
              </Button>
            </div>
          </div>
          <Separator />
          {excludedCategoryIds.length === 0 ? (
            <div className="text-sm text-muted-foreground">No excluded categories selected.</div>
          ) : (
            <div className="flex flex-wrap gap-2 text-sm">
              {excludedCategoryNames.map((name, index) => (
                <span key={`${name}-${index}`} className="rounded-full border border-border bg-muted/40 px-3 py-1 text-muted-foreground">
                  {name}
                </span>
              ))}
            </div>
          )}
        </Card>

        <Dialog open={exclusionDialogOpen} onOpenChange={setExclusionDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Excluded Categories</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Search categories</Label>
                <Input
                  value={exclusionSearch}
                  onChange={(e) => setExclusionSearch(e.target.value)}
                  placeholder="Search by category name"
                />
              </div>
              <div className="max-h-80 overflow-auto rounded-md border border-border">
                {filteredCategories.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No matching categories.</div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border"
                          checked={excludedCategoryIds.includes(Number(cat.id))}
                          onChange={() => toggleExcludedCategory(Number(cat.id))}
                        />
                        <span className="text-foreground">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExclusionDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setExclusionDialogOpen(false);
                saveExcludedCategories();
              }} disabled={isSavingExclusions}>
                {isSavingExclusions ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">All Shipping Rates</h2>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading shipping rates...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingRates.filter((rate) => rate.type === 'basic' || rate.type === 'free').map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>{rate.type === 'basic' ? 'standard' : 'conditional free'}</TableCell>
                    <TableCell>{formatCurrency(Number(rate.price || 0))}</TableCell>
                    <TableCell>{rate.min_order ?? '-'}</TableCell>
                    <TableCell>{rate.max_order ?? '-'}</TableCell>
                    <TableCell>{rate.zone || '-'}</TableCell>
                    <TableCell>{rate.estimated_days || '-'}</TableCell>
                    <TableCell>{rate.active ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(rate)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 border-2">
            <h3 className="font-semibold text-foreground mb-2">Standard Shipping Zones</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {deliveryZones.filter((z) => z.type === 'basic').map((z) => (
                <div key={z.id}>
                  {z.zone} - {formatCurrency(Number(z.charge || 0))} ({z.estimatedDays})
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
