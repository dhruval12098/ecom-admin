'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Edit } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type DocPage = {
  id: number;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not updated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not updated';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function DocsAdminPage() {
  const { toast } = useToast();
  const [docs, setDocs] = useState<DocPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/docs`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setDocs(result.data);
        } else {
          throw new Error(result.error || 'Failed to load docs');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: (error as Error).message || 'Failed to load docs.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [toast]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Docs</h1>
          <p className="text-muted-foreground mt-1">
            Manage Terms, Privacy Policy, and Returns content.
          </p>
        </div>

        {loading && <div className="text-muted-foreground">Loading docs...</div>}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {docs.map((doc) => (
              <Card key={doc.slug} className="p-5 border border-slate-200 rounded-lg shadow-sm bg-white">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900">{doc.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Last updated: {formatDate(doc.updated_at)}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">/{doc.slug}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href={`/admin/docs/${doc.slug}`}>
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}

            {!docs.length && (
              <Card className="p-6 border border-dashed text-center text-muted-foreground">
                No docs found. Please confirm the seed rows exist in `docs_pages`.
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
