'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure your store settings</p>
        </div>

        {/* Store Information */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Store Information</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Store Name</label>
            <input
              type="text"
              placeholder="FoodHub"
              defaultValue="FoodHub"
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Store Email</label>
            <input
              type="email"
              placeholder="contact@foodhub.com"
              defaultValue="contact@foodhub.com"
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Contact Number</label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              defaultValue="+91 98765 43210"
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Logo Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Logo</h2>
          <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded bg-primary mx-auto mb-2 flex items-center justify-center">
                <span className="text-white font-bold">FH</span>
              </div>
              <p className="text-xs text-muted-foreground">Current Logo</p>
            </div>
          </div>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Upload new logo</p>
          </div>
        </div>

        {/* Tax & Currency Settings */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Tax & Currency</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">GST Tax Rate (%)</label>
            <input
              type="number"
              placeholder="5"
              defaultValue="5"
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
            <select className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Indian Rupee (₹)</option>
              <option>US Dollar ($)</option>
              <option>Euro (€)</option>
            </select>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Maintenance Mode</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Enable Maintenance Mode</label>
              <select className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, customers will see a maintenance message instead of your store.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button>Save Settings</Button>
      </div>
    </AdminLayout>
  );
}
