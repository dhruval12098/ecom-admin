'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {

  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ArrowLeft, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function AddPricingPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const scheduleTypeOptions = [
    'discount_campaign',
    'festival_pricing',
    'happy_hour'
  ];
  const [form, setForm] = useState({
    productId: '',
    normalPrice: '',
    scheduledPrice: '',
    scheduleType: 'discount_campaign',
    startAt: '',
    endAt: '',
    status: 'scheduled',
    notes: ''
  });
  const [scheduleTypeOption, setScheduleTypeOption] = useState('discount_campaign');
  const [customScheduleType, setCustomScheduleType] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setProducts(result.data);
        }
      } catch (error) {
        // keep UI stable on failure
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!form.productId) return;
    const selected = products.find((p) => String(p.id) === String(form.productId));
    if (selected && selected.price !== undefined && selected.price !== null) {
      setForm((prev) => ({ ...prev, normalPrice: String(selected.price) }));
    }
  }, [form.productId, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedScheduleType =
      scheduleTypeOption === '__custom'
        ? customScheduleType.trim()
        : scheduleTypeOption;
    if (!resolvedScheduleType) return;
    if (!form.productId || !form.normalPrice || !form.scheduledPrice || !form.startAt || !form.endAt) return;

    const normalPrice = Number(form.normalPrice);
    const scheduledPrice = Number(form.scheduledPrice);
    const discountPercent = normalPrice > 0 ? Math.round(((normalPrice - scheduledPrice) / normalPrice) * 100) : null;

    try {
      setIsSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/scheduled-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(form.productId),
          normalPrice,
          scheduledPrice,
          discountPercent,
          scheduleType: resolvedScheduleType,
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          status: form.status,
          notes: form.notes || null
        })
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Create failed');
      router.push('/admin/pricing');
    } catch (error) {
      // ignore to keep UI stable
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Link href="/admin/pricing">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Add Pricing Schedule</h1>
            <p className="text-muted-foreground text-sm mt-1">Create a time-based price for a product</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Product</label>
            <Popover open={productOpen} onOpenChange={setProductOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productOpen}
                  className="w-full justify-between bg-background"
                >
                  {form.productId
                    ? products.find((p) => String(p.id) === String(form.productId))?.name
                    : 'Select a product'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search products..." />
                  <CommandList>
                    <CommandEmpty>No products found.</CommandEmpty>
                    <CommandGroup>
                      {products.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.name ?? ''} ${p.id ?? ''}`}
                          onSelect={() => {
                            setForm((prev) => ({ ...prev, productId: String(p.id) }));
                            setProductOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              String(form.productId) === String(p.id) ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Normal Price</label>
              <input
                type="number"
                name="normalPrice"
                value={form.normalPrice}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Scheduled Price</label>
              <input
                type="number"
                name="scheduledPrice"
                value={form.scheduledPrice}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Schedule Type</label>
              <Select value={scheduleTypeOption} onValueChange={setScheduleTypeOption}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a schedule type" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {scheduleTypeOption === '__custom' && (
                <input
                  type="text"
                  value={customScheduleType}
                  onChange={(e) => setCustomScheduleType(e.target.value)}
                  placeholder="e.g. new_year_offer"
                  className="mt-2 w-full px-4 py-2 rounded-md bg-background border border-border"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Time</label>
              <input
                type="datetime-local"
                name="startAt"
                value={form.startAt}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Time</label>
              <input
                type="datetime-local"
                name="endAt"
                value={form.endAt}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-md bg-background border border-border"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Notes (optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 rounded-md bg-background border border-border"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Schedule
            </Button>
            <Link href="/admin/pricing">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
