'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function BusinessInfoPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contactContent, setContactContent] = useState({
    visitStoreLines: ['123 Fresh Street, Andheri West', 'Mumbai, Maharashtra 400001', 'India'],
    emailLines: ['General: hello@freshmart.com', 'Support: support@freshmart.com', 'Partnership: partners@freshmart.com'],
    phoneLines: ['Customer Service: +91 1800-123-4567', 'Order Support: +91 1800-123-4568', 'Mon - Sat: 9:00 AM - 8:00 PM'],
    hoursLines: ['Monday - Saturday: 9:00 AM - 8:00 PM', 'Sunday: 10:00 AM - 6:00 PM', 'Delivery: 7 Days a Week']
  });

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contact/info`);
        const result = await response.json();
        if (result.success && result.data) {
          setContactContent({
            visitStoreLines: result.data.visit_store_lines || [],
            emailLines: result.data.email_lines || [],
            phoneLines: result.data.phone_lines || [],
            hoursLines: result.data.hours_lines || []
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load contact info.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactInfo();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactContent),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }
      toast({
        title: 'Success',
        description: 'Business information saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save business information.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <Button variant="outline" size="sm" asChild className="mb-3 gap-2">
        <Link href="/admin/content?tab=contact">
          <ArrowLeft className="h-4 w-4" />
          Back to Contact
        </Link>
      </Button>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Business Information</h1>
        <p className="text-muted-foreground">Update the contact details shown on the Contact page.</p>
      </div>

      <Card className="p-6 mt-6 max-w-3xl">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Visit Our Store (one line per row)</label>
              <textarea
                value={contactContent.visitStoreLines.join('\n')}
                onChange={(e) => setContactContent({...contactContent, visitStoreLines: e.target.value.split('\n')})}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Us (one line per row)</label>
              <textarea
                value={contactContent.emailLines.join('\n')}
                onChange={(e) => setContactContent({...contactContent, emailLines: e.target.value.split('\n')})}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Call Us (one line per row)</label>
              <textarea
                value={contactContent.phoneLines.join('\n')}
                onChange={(e) => setContactContent({...contactContent, phoneLines: e.target.value.split('\n')})}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Hours (one line per row)</label>
              <textarea
                value={contactContent.hoursLines.join('\n')}
                onChange={(e) => setContactContent({...contactContent, hoursLines: e.target.value.split('\n')})}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Business Info'}
            </Button>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
