'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type DocPage = {
  id: number;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
};

export default function EditDocPage() {
  const { toast } = useToast();
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [doc, setDoc] = useState<DocPage | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchDoc = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/docs/${encodeURIComponent(slug)}`);
        const result = await response.json();
        if (result.success && result.data) {
          setDoc(result.data);
          setContent(result.data.content || '');
        } else {
          throw new Error(result.error || 'Doc not found');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: (error as Error).message || 'Failed to load doc.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [slug, toast]);

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/docs/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save doc');
      }
      setDoc(result.data);
      toast({
        title: 'Saved',
        description: 'Doc updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to save doc.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href="/admin/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Docs
            </Link>
            <h1 className="text-3xl font-bold text-foreground mt-2">
              {doc?.title || 'Edit Doc'}
            </h1>
            <p className="text-muted-foreground mt-1">/{slug}</p>
          </div>
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Card className="p-5">
          {loading ? (
            <div className="text-muted-foreground">Loading content...</div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">Content</div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                placeholder="Write the policy content here..."
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use blank lines to separate sections. This will be displayed with line breaks on the public site.
              </p>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
