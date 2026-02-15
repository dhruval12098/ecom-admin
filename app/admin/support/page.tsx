'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const SUPPORT_TABS = [
  { key: 'requests', label: 'Support Requests' },
  { key: 'faq', label: 'FAQ' },
];

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
};

type TicketItem = {
  id: string;
  user_id: string | null;
  user_name?: string | null;
  user_email?: string | null;
  guest_name?: string | null;
  guest_email?: string | null;
  subject?: string | null;
  message: string;
  status?: string | null;
  priority?: string | null;
  category?: string | null;
  created_at?: string | null;
};

type TicketMessage = {
  id: string;
  sender_role: string;
  message: string;
  created_at?: string | null;
};

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState(SUPPORT_TABS[0].key);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [faqFormOpen, setFaqFormOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    status: 'published',
    sortOrder: '0',
  });
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'pending' | 'closed'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [readTickets, setReadTickets] = useState<Record<string, boolean>>({});
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  const isFaqFormValid = useMemo(() => {
    return faqForm.question.trim().length > 0 && faqForm.answer.trim().length > 0;
  }, [faqForm.question, faqForm.answer]);

  const resetFaqForm = () => {
    setFaqForm({
      question: '',
      answer: '',
      status: 'published',
      sortOrder: '0',
    });
  };

  const loadFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/faqs`);
      if (!response.ok) {
        throw new Error(`Failed to load FAQs (${response.status})`);
      }
      const result = await response.json();
      setFaqs(result.data || []);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load FAQs. Please try again.',
        variant: 'destructive',
      });
      setFaqs([]);
    } finally {
      setLoadingFaqs(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/tickets`);
      if (!response.ok) {
        throw new Error(`Failed to load tickets (${response.status})`);
      }
      const result = await response.json();
      setTickets(result.data || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets.',
        variant: 'destructive',
      });
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const loadMessages = async (ticketId: string) => {
    setLoadingMessages(ticketId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/tickets/${ticketId}/messages`);
      if (!response.ok) {
        throw new Error(`Failed to load messages (${response.status})`);
      }
      const result = await response.json();
      setTicketMessages((prev) => ({ ...prev, [ticketId]: result.data || [] }));
    } catch (error) {
      console.error('Failed to fetch ticket messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket messages.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMessages(null);
    }
  };

  const handleCreateFaq = async () => {
    if (!isFaqFormValid) return;
    try {
      const payload = {
        question: faqForm.question.trim(),
        answer: faqForm.answer.trim(),
        is_published: faqForm.status === 'published',
        sort_order: Number(faqForm.sortOrder) || 0,
      };
      const response = await fetch(`${API_BASE_URL}/api/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`Failed to create FAQ (${response.status})`);
      }
      await loadFaqs();
      setFaqFormOpen(false);
      resetFaqForm();
      toast({
        title: 'Success',
        description: 'FAQ added successfully.',
      });
    } catch (error) {
      console.error('Failed to create FAQ:', error);
      toast({
        title: 'Error',
        description: 'Failed to add FAQ. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const statusOk = statusFilter === 'all' ? true : ticket.status === statusFilter;
      const isRead = !!readTickets[ticket.id];
      const readOk = readFilter === 'all' ? true : readFilter === 'read' ? isRead : !isRead;
      return statusOk && readOk;
    });
  }, [tickets, statusFilter, readFilter, readTickets]);

  const activeTicket = useMemo(() => {
    return tickets.find((ticket) => ticket.id === activeTicketId) || null;
  }, [tickets, activeTicketId]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage help requests and keep your FAQ up to date
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {SUPPORT_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Support Requests</CardTitle>
                    <CardDescription>Track and respond to customer issues.</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={readFilter} onValueChange={(value) => setReadFilter(value as any)}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Read" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="unread">Unread</SelectItem>
                        <SelectItem value="read">Read</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingTickets ? (
                  <div className="text-sm text-muted-foreground">Loading tickets...</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No tickets yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Subject</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">User</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Email</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Read</th>
                          <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.map((ticket) => {
                          const isRead = !!readTickets[ticket.id];
                          return (
                            <tr key={ticket.id} className="border-b border-border">
                              <td className="px-4 py-3">
                                <div className="font-medium text-foreground">
                                  {ticket.subject || 'Support Request'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {ticket.category || 'General'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-foreground">
                                {ticket.guest_name || ticket.user_name || (ticket.user_id ? 'Logged-in user' : 'Guest')}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {ticket.guest_email || ticket.user_email || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground capitalize">
                                  {ticket.status || 'open'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                                  {isRead ? 'Read' : 'Unread'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveTicketId(ticket.id);
                                    setTicketModalOpen(true);
                                    setReadTickets((prev) => ({ ...prev, [ticket.id]: true }));
                                    if (!ticketMessages[ticket.id]) {
                                      loadMessages(ticket.id);
                                    }
                                  }}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>FAQ</CardTitle>
                    <CardDescription>Maintain common answers for faster support.</CardDescription>
                  </div>
                  <Dialog open={faqFormOpen} onOpenChange={setFaqFormOpen}>
                    <DialogTrigger asChild>
                      <Button>Add FAQ</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Add FAQ</DialogTitle>
                        <DialogDescription>Create a new FAQ entry.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="faq-question">Question</Label>
                          <Input
                            id="faq-question"
                            placeholder="Enter FAQ question"
                            value={faqForm.question}
                            onChange={(event) =>
                              setFaqForm((prev) => ({ ...prev, question: event.target.value }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="faq-answer">Answer</Label>
                          <Textarea
                            id="faq-answer"
                            placeholder="Enter FAQ answer"
                            value={faqForm.answer}
                            onChange={(event) =>
                              setFaqForm((prev) => ({ ...prev, answer: event.target.value }))
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Status</Label>
                          <Select
                            value={faqForm.status}
                            onValueChange={(value) =>
                              setFaqForm((prev) => ({ ...prev, status: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="published">Published</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="faq-sort">Sort Order</Label>
                          <Input
                            id="faq-sort"
                            type="number"
                            value={faqForm.sortOrder}
                            onChange={(event) =>
                              setFaqForm((prev) => ({ ...prev, sortOrder: event.target.value }))
                            }
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setFaqFormOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateFaq} disabled={!isFaqFormValid}>
                            Save FAQ
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFaqs ? (
                  <div className="text-sm text-muted-foreground">Loading FAQs...</div>
                ) : faqs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No FAQs yet. Add one to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="border border-border rounded-lg p-4 bg-muted/20"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-foreground">{faq.question}</div>
                          <span className="text-xs text-muted-foreground">
                            {faq.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">{faq.answer}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={ticketModalOpen} onOpenChange={setTicketModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{activeTicket?.subject || 'Support Request'}</DialogTitle>
            <DialogDescription>Ticket details and conversation</DialogDescription>
          </DialogHeader>

          {activeTicket ? (
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Name</div>
                    <div className="font-medium text-foreground">
                      {activeTicket.guest_name || activeTicket.user_name || (activeTicket.user_id ? 'Logged-in user' : 'Guest')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="font-medium text-foreground">
                      {activeTicket.guest_email || activeTicket.user_email || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="font-medium text-foreground">
                      {activeTicket.category || 'General'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Priority</div>
                    <div className="font-medium text-foreground capitalize">
                      {activeTicket.priority || 'normal'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="font-medium text-foreground capitalize">
                      {activeTicket.status || 'open'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Created</div>
                    <div className="font-medium text-foreground">
                      {activeTicket.created_at ? new Date(activeTicket.created_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Original Message</div>
                  <div className="mt-1 text-sm text-foreground">{activeTicket.message}</div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <div className="text-sm font-medium text-foreground mb-2">Conversation</div>
                {loadingMessages === activeTicket.id ? (
                  <div className="text-xs text-muted-foreground">Loading messages...</div>
                ) : (ticketMessages[activeTicket.id] || []).length === 0 ? (
                  <div className="text-xs text-muted-foreground">No messages yet.</div>
                ) : (
                  <div className="space-y-2">
                    {(ticketMessages[activeTicket.id] || []).map((msg) => (
                      <div key={msg.id} className="rounded-md bg-muted/20 p-2 text-xs text-foreground">
                        <div className="text-[10px] uppercase text-muted-foreground mb-1">
                          {msg.sender_role}
                        </div>
                        {msg.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No ticket selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
