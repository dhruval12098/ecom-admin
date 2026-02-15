'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {

  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

type Inquiry = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  created_at: string;
};

export default function InquiriesPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Inquiry[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/contact/messages?limit=50`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setMessages(result.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load inquiries.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [toast]);

  return (
    <AdminLayout>
      <Button variant="outline" size="sm" asChild className="mb-3 gap-2">
        <Link href="/admin/content?tab=contact">
          <ArrowLeft className="h-4 w-4" />
          Back to Contact
        </Link>
      </Button>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Inquiries</h1>
        <p className="text-muted-foreground">All Contact form submissions.</p>
      </div>

      <Card className="p-6 mt-6">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div>
            {messages.length === 0 && (
              <div className="text-muted-foreground">No inquiries yet.</div>
            )}
            {messages.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>{new Date(msg.created_at).toLocaleString()}</TableCell>
                      <TableCell>{msg.name}</TableCell>
                      <TableCell>{msg.email}</TableCell>
                      <TableCell>{msg.phone || '-'}</TableCell>
                      <TableCell>{msg.subject}</TableCell>
                      <TableCell className="whitespace-normal">{msg.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
