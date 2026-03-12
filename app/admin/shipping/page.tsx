"use client";

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useMemo, useState, Dispatch, SetStateAction } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const emptyZone = {
  id: null,
  country: 'Belgium',
  city: '',
  postal_code: '',
  phase_label: '',
  conditional: null,
  min_order_amount: null,
  delivery_fee: null,
  active: true
};

export default function ShippingPage() {
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(true);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [zoneDraft, setZoneDraft] = useState<any>(emptyZone);
  const [categories, setCategories] = useState<any[]>([]);
  const [excludedCategoryIds, setExcludedCategoryIds] = useState<number[]>([]);
  const [isSavingExclusions, setIsSavingExclusions] = useState(false);
  const [exclusionDialogOpen, setExclusionDialogOpen] = useState(false);
  const [exclusionSearch, setExclusionSearch] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [orderAcceptDays, setOrderAcceptDays] = useState<string[]>([]);
  const [deliveryDays, setDeliveryDays] = useState<string[]>([]);
  const [deliveryFromHour, setDeliveryFromHour] = useState('10');
  const [deliveryFromMinute, setDeliveryFromMinute] = useState('00');
  const [deliveryFromMeridiem, setDeliveryFromMeridiem] = useState<'AM' | 'PM'>('AM');
  const [deliveryToHour, setDeliveryToHour] = useState('09');
  const [deliveryToMinute, setDeliveryToMinute] = useState('00');
  const [deliveryToMeridiem, setDeliveryToMeridiem] = useState<'AM' | 'PM'>('PM');
  const [scheduleError, setScheduleError] = useState('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoadingZones(true);
        const response = await fetch(`${API_BASE_URL}/api/delivery-zones`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setDeliveryZones(result.data);
        }
      } catch (e) {
        // keep UI stable on failure
      } finally {
        setIsLoadingZones(false);
      }
    };
    fetchZones();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories?includeInactive=true&includeEmpty=true`);
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
          setScheduleEnabled(Boolean(result.data.delivery_schedule_enabled));
          const acceptRaw = Array.isArray(result.data.order_accept_days) ? result.data.order_accept_days : [];
          const deliveryRaw = Array.isArray(result.data.delivery_days) ? result.data.delivery_days : [];
          setOrderAcceptDays(acceptRaw.map((d: any) => String(d)));
          setDeliveryDays(deliveryRaw.map((d: any) => String(d)));
          const range = result.data.delivery_time_blocks || null;
          if (range?.from && range?.to) {
            const from = range.from || {};
            const to = range.to || {};
            if (from.hour) setDeliveryFromHour(String(from.hour).padStart(2, '0'));
            if (from.minute !== undefined) setDeliveryFromMinute(String(from.minute).padStart(2, '0'));
            if (from.meridiem) setDeliveryFromMeridiem(String(from.meridiem).toUpperCase() === 'PM' ? 'PM' : 'AM');
            if (to.hour) setDeliveryToHour(String(to.hour).padStart(2, '0'));
            if (to.minute !== undefined) setDeliveryToMinute(String(to.minute).padStart(2, '0'));
            if (to.meridiem) setDeliveryToMeridiem(String(to.meridiem).toUpperCase() === 'AM' ? 'AM' : 'PM');
          }
        }
      } catch (e) {
        // keep UI stable on failure
      }
    };
    loadSettings();
  }, []);

  const openZoneCreate = () => {
    setZoneDraft({ ...emptyZone });
    setZoneDialogOpen(true);
  };

  const openZoneEdit = (zone: any) => {
    setZoneDraft({
      id: zone.id,
      country: zone.country || 'Belgium',
      city: zone.city || '',
      postal_code: zone.postal_code || '',
      phase_label: zone.phase_label || '',
      conditional: zone.conditional ?? null,
      min_order_amount: zone.min_order_amount ?? null,
      delivery_fee: zone.delivery_fee ?? null,
      active: !!zone.active
    });
    setZoneDialogOpen(true);
  };

  const handleZoneSave = async () => {
    try {
      if (zoneDraft.id) {
        const response = await fetch(`${API_BASE_URL}/api/delivery-zones/${zoneDraft.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zoneDraft)
        });
        const result = await response.json();
        if (result.success) {
          setDeliveryZones((prev) => prev.map((z) => (z.id === zoneDraft.id ? result.data : z)));
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/api/delivery-zones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zoneDraft)
        });
        const result = await response.json();
        if (result.success) {
          setDeliveryZones((prev) => [...prev, result.data]);
        }
      }
      setZoneDialogOpen(false);
      toast({ title: 'Saved', description: 'Delivery zone updated.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Unable to save delivery zone.', variant: 'destructive' });
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
      toast({ title: 'Saved', description: 'Exclusions updated.' });
    } catch {
      toast({ title: 'Save failed', description: 'Unable to save exclusions.', variant: 'destructive' });
    } finally {
      setIsSavingExclusions(false);
    }
  };

  const toggleDay = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]));
  };

  const toMinutes = (hour: string, minute: string, meridiem: 'AM' | 'PM') => {
    let h = parseInt(hour, 10) % 12;
    if (meridiem === 'PM') h += 12;
    return h * 60 + parseInt(minute, 10);
  };

  const saveScheduleSettings = async () => {
    try {
      setIsSavingSchedule(true);
      setScheduleError('');
      const canSaveRange =
        deliveryFromHour && deliveryFromMinute && deliveryFromMeridiem &&
        deliveryToHour && deliveryToMinute && deliveryToMeridiem;
      if (scheduleEnabled && !canSaveRange) {
        setScheduleError('Select a valid delivery time range.');
        return;
      }
      if (scheduleEnabled && canSaveRange) {
        const fromTotal = toMinutes(deliveryFromHour, deliveryFromMinute, deliveryFromMeridiem);
        const toTotal = toMinutes(deliveryToHour, deliveryToMinute, deliveryToMeridiem);
        if (fromTotal === toTotal) {
          setScheduleError('Delivery time range must be at least 30 minutes.');
          return;
        }
      }
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_schedule_enabled: scheduleEnabled,
          order_accept_days: orderAcceptDays,
          delivery_days: deliveryDays,
          delivery_time_blocks: {
            from: {
              hour: deliveryFromHour,
              minute: deliveryFromMinute,
              meridiem: deliveryFromMeridiem
            },
            to: {
              hour: deliveryToHour,
              minute: deliveryToMinute,
              meridiem: deliveryToMeridiem
            }
          }
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }
      toast({ title: 'Schedule saved', description: 'Delivery schedule updated successfully.' });
    } catch (e) {
      toast({ title: 'Save failed', description: 'Unable to save schedule. Please try again.', variant: 'destructive' });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const hourOptions = ['01','02','03','04','05','06','07','08','09','10','11','12'];
  const minuteOptions = ['00','15','30','45'];
  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
          <p className="text-muted-foreground text-sm">Manage delivery zones and per-phase shipping rules</p>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Delivery Zones (Allowed Areas)</h2>
              <p className="text-sm text-muted-foreground">
                Orders are accepted only if the address matches an active zone. Fees are per phase.
              </p>
            </div>
            <Button onClick={openZoneCreate}>Add Delivery Zone</Button>
          </div>
          {isLoadingZones ? (
            <div className="text-sm text-muted-foreground">Loading delivery zones...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Postal Code</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Conditional</TableHead>
                  <TableHead>Min Order Amount</TableHead>
                  <TableHead>Standard</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryZones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.country || '-'}</TableCell>
                    <TableCell>{zone.city || '-'}</TableCell>
                    <TableCell>{zone.postal_code || '-'}</TableCell>
                    <TableCell>{zone.phase_label || '-'}</TableCell>
                    <TableCell>{zone.conditional ?? '-'}</TableCell>
                    <TableCell>{zone.min_order_amount ?? '-'}</TableCell>
                    <TableCell>{zone.delivery_fee ?? '-'}</TableCell>
                    <TableCell>{zone.active ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openZoneEdit(zone)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Delivery Schedule</h2>
              <p className="text-sm text-muted-foreground">
                Control order acceptance days and delivery windows shown at checkout.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={saveScheduleSettings} disabled={isSavingSchedule}>
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </Button>
            </div>
          </div>
          <Separator className="my-4" />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Enable Schedule</p>
                  <p className="text-xs text-muted-foreground">Show on checkout</p>
                </div>
                <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              </div>
              <div className="mt-4">
                <Label>Delivery Time Range</Label>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={deliveryFromHour} onValueChange={setDeliveryFromHour}>
                      <SelectTrigger>
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((h) => (
                          <SelectItem key={`from-h-${h}`} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={deliveryFromMinute} onValueChange={setDeliveryFromMinute}>
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((m) => (
                          <SelectItem key={`from-m-${m}`} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={deliveryFromMeridiem} onValueChange={(v) => setDeliveryFromMeridiem(v as 'AM' | 'PM')}>
                      <SelectTrigger>
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={deliveryToHour} onValueChange={setDeliveryToHour}>
                      <SelectTrigger>
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((h) => (
                          <SelectItem key={`to-h-${h}`} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={deliveryToMinute} onValueChange={setDeliveryToMinute}>
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((m) => (
                          <SelectItem key={`to-m-${m}`} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={deliveryToMeridiem} onValueChange={(v) => setDeliveryToMeridiem(v as 'AM' | 'PM')}>
                      <SelectTrigger>
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {scheduleError && <div className="text-xs text-red-600">{scheduleError}</div>}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Order Accept Days</p>
              <p className="text-xs text-muted-foreground">Choose days you accept orders</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {dayOptions.map((day) => {
                  const selected = orderAcceptDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => toggleDay(day, setOrderAcceptDays)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Delivery Days</p>
              <p className="text-xs text-muted-foreground">Choose delivery days shown at checkout</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {dayOptions.map((day) => {
                  const selected = deliveryDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => toggleDay(day, setDeliveryDays)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Leave empty to use the same days as Order Accept Days.
              </p>
            </div>
          </div>
        </Card>

        <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{zoneDraft.id ? 'Edit Delivery Zone' : 'Add Delivery Zone'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={zoneDraft.country} onChange={(e) => setZoneDraft({ ...zoneDraft, country: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phase Label</Label>
                <Input value={zoneDraft.phase_label} onChange={(e) => setZoneDraft({ ...zoneDraft, phase_label: e.target.value })} placeholder="Phase 1" />
              </div>
              <div className="space-y-2">
                <Label>Conditional (Free ≥ Amount)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{'\u20AC'}</span>
                  <Input
                    type="number"
                    className="pl-7"
                    value={zoneDraft.conditional ?? ''}
                    onChange={(e) => setZoneDraft({ ...zoneDraft, conditional: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Min Order Amount (Required to Place Order)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{'\u20AC'}</span>
                  <Input
                    type="number"
                    className="pl-7"
                    value={zoneDraft.min_order_amount ?? ''}
                    onChange={(e) => setZoneDraft({ ...zoneDraft, min_order_amount: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Standard (Below Threshold)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{'\u20AC'}</span>
                  <Input
                    type="number"
                    className="pl-7"
                    value={zoneDraft.delivery_fee ?? ''}
                    onChange={(e) => setZoneDraft({ ...zoneDraft, delivery_fee: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="e.g. 7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>City (optional)</Label>
                <Input value={zoneDraft.city} onChange={(e) => setZoneDraft({ ...zoneDraft, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Postal Code (optional)</Label>
                <Input value={zoneDraft.postal_code} onChange={(e) => setZoneDraft({ ...zoneDraft, postal_code: e.target.value })} />
              </div>
              <div className="space-y-2 flex items-center gap-3 pt-6">
                <Switch checked={!!zoneDraft.active} onCheckedChange={(checked) => setZoneDraft({ ...zoneDraft, active: checked })} />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleZoneSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  );
}
