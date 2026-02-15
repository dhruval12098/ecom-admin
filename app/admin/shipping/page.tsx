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

  const deliveryZones = useMemo(() => {
    return shippingRates
      .filter((rate) => rate.type === 'basic' || rate.type === 'custom')
      .map((rate) => ({
        id: rate.id,
        zone: rate.zone || rate.name,
        charge: rate.price,
        estimatedDays: rate.estimated_days || '-',
        type: rate.type
      }));
  }, [shippingRates]);

  const openCreate = () => {
    setDraft({ ...emptyRate });
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
              <p className="text-sm text-muted-foreground">Add, edit, and activate rules used at checkout.</p>
            </div>
            <div className="flex items-center gap-3">
              {saveMessage && <span className="text-sm text-muted-foreground">{saveMessage}</span>}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary" onClick={openCreate}>Add Shipping Rate</Button>
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
                          <SelectItem value="free">free</SelectItem>
                          <SelectItem value="basic">basic</SelectItem>
                          <SelectItem value="custom">custom</SelectItem>
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
                      <Label>Min Order</Label>
                      <Input type="number" value={draft.min_order ?? ''} onChange={(e) => setDraft({ ...draft, min_order: e.target.value === '' ? null : Number(e.target.value) })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Max Order</Label>
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
            Free shipping rules are evaluated first, then basic, then custom.
          </p>
        </Card>

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
                {shippingRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>{rate.type}</TableCell>
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
            <h3 className="font-semibold text-foreground mb-2">Basic Shipping Zones</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {deliveryZones.filter((z) => z.type === 'basic').map((z) => (
                <div key={z.id}>
                  {z.zone} - {formatCurrency(Number(z.charge || 0))} ({z.estimatedDays})
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4 border-2">
            <h3 className="font-semibold text-foreground mb-2">Custom Shipping Zones</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              {deliveryZones.filter((z) => z.type === 'custom').map((z) => (
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