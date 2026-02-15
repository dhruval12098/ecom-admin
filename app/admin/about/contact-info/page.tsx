'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type ContactInfo = {
  email: string;
  phone: string;
  address: string;
  businessHours: string;
};

export default function ContactInfoPage() {
  const { toast } = useToast();
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    address: '',
    businessHours: '',
  });

  useEffect(() => {
    // Simulate fetching existing contact info
    const storedContactInfo = localStorage.getItem('contactInfo');
    if (storedContactInfo) {
      setContactInfo(JSON.parse(storedContactInfo));
    }
  }, []);

  const handleChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('contactInfo', JSON.stringify(contactInfo));
    toast({
      title: 'Success',
      description: 'Contact information saved successfully.',
    });
  };

  return (
    <AdminLayout>
      <Button variant="outline" size="sm" asChild className="mb-3 gap-2">
        <Link href="/admin/content?tab=about">
          <ArrowLeft className="h-4 w-4" />
          Back to About
        </Link>
      </Button>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Get in Touch</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Manage Contact Information</CardTitle>
          <CardDescription>Update your business's contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={contactInfo.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="businessHours">Business Hours</Label>
              <Input
                id="businessHours"
                value={contactInfo.businessHours}
                onChange={(e) => handleChange('businessHours', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
