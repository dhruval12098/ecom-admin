'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit } from 'lucide-react';
import { useState } from 'react';

type ShippingType = 'free' | 'basic' | 'custom';

interface ShippingRate {
  type: ShippingType;
  name: string;
  description: string;
  cost: string;
  enabled: boolean;
  minOrderValue?: string;
}

export default function ShippingPage() {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([
    {
      type: 'free',
      name: 'Free Shipping',
      description: 'Free delivery on orders above minimum value',
      cost: 'Free',
      enabled: true,
      minOrderValue: '500'
    },
    {
      type: 'basic',
      name: 'Basic Shipping',
      description: 'Standard delivery for all zones',
      cost: '₹75-150',
      enabled: true
    },
    {
      type: 'custom',
      name: 'Custom Shipping',
      description: 'Zone-based and product-specific rates',
      cost: 'Varies',
      enabled: true
    }
  ]);

  const deliveryZones = [
    { id: 1, zone: 'Zone 1 - Central', charge: '₹50', estimatedDays: '2-3 days', type: 'basic' },
    { id: 2, zone: 'Zone 2 - North', charge: '₹75', estimatedDays: '3-4 days', type: 'basic' },
    { id: 3, zone: 'Zone 3 - South', charge: '₹75', estimatedDays: '3-4 days', type: 'basic' },
    { id: 4, zone: 'Zone 4 - Suburbs', charge: '₹100', estimatedDays: '4-5 days', type: 'basic' },
    { id: 5, zone: 'Express - Premium', charge: '₹150', estimatedDays: '1-2 days', type: 'custom' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Shipping & Delivery</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage shipping types, rates and delivery zones</p>
        </div>

        {/* Shipping Types */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Shipping Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shippingRates.map((rate) => (
              <Card key={rate.type} className="p-4 border-2 hover:border-primary/50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{rate.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{rate.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={rate.enabled}
                    onChange={(e) => {
                      setShippingRates(shippingRates.map(r => 
                        r.type === rate.type ? {...r, enabled: e.target.checked} : r
                      ));
                    }}
                    className="w-4 h-4 rounded"
                  />
                </div>
                <p className="text-lg font-bold text-primary mb-3">{rate.cost}</p>
                {rate.minOrderValue && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Min Order: ₹{rate.minOrderValue}
                  </p>
                )}
                <Button variant="outline" size="sm" className="w-full gap-1 bg-transparent">
                  <Edit className="w-4 h-4" />
                  Configure
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Free Shipping Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Free Shipping Configuration</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Minimum Order Value for Free Shipping
              </label>
              <input
                type="number"
                placeholder="e.g., 500"
                defaultValue="500"
                className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Enable Free Shipping</label>
              <select className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          </div>
        </div>

        {/* Basic Shipping Zones */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Basic Shipping - Delivery Zones</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Shipping Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Estimated Delivery</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveryZones.filter(z => z.type === 'basic').map((zone) => (
                  <tr key={zone.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{zone.zone}</td>
                    <td className="px-4 py-4 text-sm text-foreground font-semibold text-primary">{zone.charge}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{zone.estimatedDays}</td>
                    <td className="px-4 py-4 text-sm">
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Shipping Zones */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Custom Shipping - Premium Zones</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Shipping Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Estimated Delivery</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {deliveryZones.filter(z => z.type === 'custom').map((zone) => (
                  <tr key={zone.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-4 text-sm font-medium text-foreground">{zone.zone}</td>
                    <td className="px-4 py-4 text-sm text-foreground font-semibold text-primary">{zone.charge}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{zone.estimatedDays}</td>
                    <td className="px-4 py-4 text-sm">
                      <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button className="bg-primary">Save All Settings</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
