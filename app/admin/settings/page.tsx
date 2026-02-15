'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building2, Upload, ShieldCheck, Truck, Receipt, Mail, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


  const initialForm = {
    storeName: 'FoodHub',
    storeEmail: 'contact@foodhub.com',
    phone: '+91 98765 43210',
    supportEmail: 'support@foodhub.com',
    address: '221B Baker Street, London',
    smtpEmail: '',
    smtpPassword: '',
    smtpHost: '',
    smtpPort: '587',
    smtpSecure: false,
    taxRate: '5',
    currency: 'EUR',
    maintenanceEnabled: false,
    maintenanceMessage: 'We are performing scheduled maintenance. Please check back soon.',
    shippingNote: 'Standard delivery within 2-3 business days.',
  logoUrl: ''
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [initialValues, setInitialValues] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingStoreInfo, setIsEditingStoreInfo] = useState(false);
  const [isEditingEmailConfig, setIsEditingEmailConfig] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [emailDraft, setEmailDraft] = useState({
    smtpEmail: initialForm.smtpEmail,
    smtpPassword: initialForm.smtpPassword,
    smtpHost: initialForm.smtpHost,
    smtpPort: initialForm.smtpPort,
    smtpSecure: initialForm.smtpSecure
  });

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialValues),
    [form, initialValues]
  );

  const initials = useMemo(() => {
    const parts = form.storeName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'FH';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [form.storeName]);

  const handleChange = (key: keyof typeof initialForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/settings`);
        const result = await response.json();
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load settings');
        }
        const data = result.data;
          const next = {
            storeName: data.store_name ?? initialForm.storeName,
            storeEmail: data.store_email ?? initialForm.storeEmail,
            supportEmail: data.support_email ?? initialForm.supportEmail,
            phone: data.phone ?? initialForm.phone,
            address: data.address ?? initialForm.address,
            smtpEmail: data.smtp_email ?? initialForm.smtpEmail,
            smtpPassword: data.smtp_password ?? initialForm.smtpPassword,
            smtpHost: data.smtp_host ?? initialForm.smtpHost,
            smtpPort: data.smtp_port !== null && data.smtp_port !== undefined ? String(data.smtp_port) : initialForm.smtpPort,
            smtpSecure: Boolean(data.smtp_secure),
            taxRate: data.tax_rate !== null && data.tax_rate !== undefined ? String(data.tax_rate) : initialForm.taxRate,
            currency: data.currency_code ?? initialForm.currency,
            maintenanceEnabled: Boolean(data.maintenance_enabled),
            maintenanceMessage: data.maintenance_message ?? initialForm.maintenanceMessage,
            shippingNote: data.shipping_note ?? initialForm.shippingNote,
            logoUrl: data.logo_url ?? ''
        };
        setForm(next);
        setInitialValues(next);
        setEmailDraft({
          smtpEmail: next.smtpEmail,
          smtpPassword: next.smtpPassword,
          smtpHost: next.smtpHost,
          smtpPort: next.smtpPort,
          smtpSecure: next.smtpSecure
        });
      } catch (error: any) {
        toast({
          title: 'Failed to load settings',
          description: error?.message || 'Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleSave = async (nextForm = form) => {
    try {
      const payload = {
        store_name: nextForm.storeName,
        store_email: nextForm.storeEmail,
        support_email: nextForm.supportEmail,
        phone: nextForm.phone,
        address: nextForm.address,
        smtp_email: nextForm.smtpEmail,
        smtp_password: nextForm.smtpPassword,
        smtp_host: nextForm.smtpHost,
        smtp_port: nextForm.smtpPort ? Number(nextForm.smtpPort) : null,
        smtp_secure: nextForm.smtpSecure,
        tax_rate: nextForm.taxRate ? Number(nextForm.taxRate) : null,
        currency_code: nextForm.currency,
        maintenance_enabled: nextForm.maintenanceEnabled,
        maintenance_message: nextForm.maintenanceMessage,
        shipping_note: nextForm.shippingNote,
        logo_url: nextForm.logoUrl || null
      };
      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Save failed');
      setInitialValues(nextForm);
      toast({
        title: 'Settings saved',
        description: 'Your store preferences were updated successfully.'
      });
      return true;
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const handleStoreInfoSave = async () => {
    const ok = await handleSave();
    if (ok) setIsEditingStoreInfo(false);
  };

  const handleEmailConfigSave = async () => {
    const next = {
      ...form,
      smtpEmail: emailDraft.smtpEmail || '',
      smtpPassword: emailDraft.smtpPassword || '',
      smtpHost: emailDraft.smtpHost || '',
      smtpPort: emailDraft.smtpPort || '',
      smtpSecure: Boolean(emailDraft.smtpSecure)
    };
    setForm(next);
    const ok = await handleSave(next);
    if (ok) setIsEditingEmailConfig(false);
  };

  const handleReset = () => {
    setForm(initialValues);
    toast({
      title: 'Changes discarded',
      description: 'Settings were restored to the last saved state.'
    });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('contentType', file.type);
      formData.append('folder', 'settings/logo');

      const response = await fetch(`${API_BASE_URL}/api/storage`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Upload failed');

      const next = { ...form, logoUrl: result.data.publicUrl };
      setForm(next);
      const ok = await handleSave(next);
      if (ok) {
        toast({ title: 'Logo updated', description: 'Logo saved successfully.' });
      }
    } catch (error: any) {
      toast({
        title: 'Logo upload failed',
        description: error?.message || 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingLogo(false);
      if (event.currentTarget) {
        event.currentTarget.value = '';
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">Configure your store, billing, and operational preferences</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={!isDirty || isLoading}>
              Reset
            </Button>
            <Button onClick={() => handleSave()} disabled={!isDirty || isLoading}>
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Main Column */}
          <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Store Information
                    </CardTitle>
                    <CardDescription>Core contact details shown on invoices and customer emails.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditingStoreInfo ? (
                      <Button variant="outline" onClick={() => setIsEditingStoreInfo(true)} disabled={isLoading}>
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => {
                          setForm(initialValues);
                          setIsEditingStoreInfo(false);
                        }} disabled={isLoading}>
                          Cancel
                        </Button>
                        <Button onClick={handleStoreInfoSave} disabled={!isDirty || isLoading}>
                          Save
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Store Name</label>
                    <Input
                      value={form.storeName ?? ''}
                      onChange={(e) => handleChange('storeName', e.target.value)}
                      placeholder="FoodHub"
                      disabled={isLoading || !isEditingStoreInfo}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Store Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.storeEmail ?? ''}
                        onChange={(e) => handleChange('storeEmail', e.target.value)}
                        type="email"
                        placeholder="contact@foodhub.com"
                        className="pl-9"
                        disabled={isLoading || !isEditingStoreInfo}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Support Email</label>
                    <Input
                      value={form.supportEmail ?? ''}
                      onChange={(e) => handleChange('supportEmail', e.target.value)}
                      type="email"
                      placeholder="support@foodhub.com"
                      disabled={isLoading || !isEditingStoreInfo}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.phone ?? ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-9"
                        disabled={isLoading || !isEditingStoreInfo}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Store Address</label>
                    <Textarea
                      value={form.address ?? ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      rows={3}
                      placeholder="Street, City, Country"
                      disabled={isLoading || !isEditingStoreInfo}
                    />
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Tax & Currency
                </CardTitle>
                <CardDescription>Pricing defaults used across checkout and invoices.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">GST Tax Rate (%)</label>
                  <Input
                    value={form.taxRate}
                    onChange={(e) => handleChange('taxRate', e.target.value)}
                    type="number"
                    placeholder="5"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Default Currency</label>
                  <Select value={form.currency} onValueChange={(value) => handleChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Notes
                </CardTitle>
                <CardDescription>Displayed on the checkout confirmation and receipts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.shippingNote}
                  onChange={(e) => handleChange('shippingNote', e.target.value)}
                  rows={3}
                  placeholder="Add delivery expectations or internal notes..."
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Maintenance Mode
                </CardTitle>
                <CardDescription>Temporarily take your storefront offline for updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">Enable maintenance mode</p>
                    <p className="text-sm text-muted-foreground">Customers will see a maintenance message.</p>
                  </div>
                  <Switch
                    checked={form.maintenanceEnabled}
                    onCheckedChange={(checked) => handleChange('maintenanceEnabled', checked)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Maintenance message</label>
                  <Textarea
                    value={form.maintenanceMessage}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                    rows={3}
                    placeholder="Add a friendly message for customers"
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Assets</CardTitle>
                <CardDescription>Upload logo or adjust brand mark.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                  <div className="h-14 w-14 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold overflow-hidden">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Store logo" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Current Logo</p>
                    <p className="text-xs text-muted-foreground">PNG or SVG, 512x512 recommended</p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm font-medium text-foreground hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  {isUploadingLogo ? 'Uploading...' : 'Upload new logo'}
                  <input type="file" className="hidden" accept="image/*" disabled={isLoading || isUploadingLogo} onChange={handleLogoUpload} />
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>SMTP settings used to send transactional emails.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailDraft({
                      smtpEmail: form.smtpEmail || '',
                      smtpPassword: form.smtpPassword || '',
                      smtpHost: form.smtpHost || '',
                      smtpPort: form.smtpPort || '',
                      smtpSecure: Boolean(form.smtpSecure)
                    });
                    setIsEditingEmailConfig(true);
                  }}
                  disabled={isLoading}
                >
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>SMTP Email</span>
                  <span className="text-foreground">{form.smtpEmail || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SMTP Host</span>
                  <span className="text-foreground">{form.smtpHost || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SMTP Port</span>
                  <span className="text-foreground">{form.smtpPort || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SSL/TLS</span>
                  <span className="text-foreground">{form.smtpSecure ? 'Enabled' : 'Disabled'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Dialog open={isEditingEmailConfig} onOpenChange={setIsEditingEmailConfig}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Email Configuration</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">SMTP Email</label>
                <Input
                  value={emailDraft.smtpEmail ?? ''}
                  onChange={(e) => setEmailDraft((prev) => ({ ...prev, smtpEmail: e.target.value }))}
                  placeholder="noreply@yourdomain.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">SMTP App Password</label>
                <Input
                  value={emailDraft.smtpPassword ?? ''}
                  onChange={(e) => setEmailDraft((prev) => ({ ...prev, smtpPassword: e.target.value }))}
                  type="password"
                  placeholder="App password"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">SMTP Host</label>
                <Input
                  value={emailDraft.smtpHost ?? ''}
                  onChange={(e) => setEmailDraft((prev) => ({ ...prev, smtpHost: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">SMTP Port</label>
                <Input
                  value={emailDraft.smtpPort ?? ''}
                  onChange={(e) => setEmailDraft((prev) => ({ ...prev, smtpPort: e.target.value }))}
                  placeholder="587"
                  disabled={isLoading}
                />
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Use SSL/TLS</p>
                  <p className="text-sm text-muted-foreground">Enable for port 465 or secure SMTP servers.</p>
                </div>
                <Switch
                  checked={Boolean(emailDraft.smtpSecure)}
                  onCheckedChange={(checked) => setEmailDraft((prev) => ({ ...prev, smtpSecure: checked }))}
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsEditingEmailConfig(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleEmailConfigSave} disabled={isLoading}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
