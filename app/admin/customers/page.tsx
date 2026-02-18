'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoadingCustomers(true);
        setCustomersError(null);
        const response = await fetch(`${API_BASE_URL}/api/customers`);
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch');
        setCustomers(Array.isArray(result.data) ? result.data : []);
      } catch (err: any) {
        setCustomersError(err?.message || 'Failed to load customers');
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, []);

  const query = search.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    if (!query) return true;
    const name = String(customer.full_name || '').toLowerCase();
    const email = String(customer.email || '').toLowerCase();
    const phone = String(customer.phone || '').toLowerCase();
    const id = String(customer.id || '').toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query) || id.includes(query);
  });

  useEffect(() => {
    setPage(1);
  }, [search, customers.length]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pagedCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);

  return (
    <AdminLayout>
        <div className="space-y-6 text-[13px]">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Customers</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your customer database</p>
          </div>

          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Name</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Email</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Phone</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Orders</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Status</th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCustomers && (
                    <tr>
                      <td className="px-6 py-6 text-[13px] text-muted-foreground" colSpan={6}>
                        Loading customers...
                      </td>
                    </tr>
                  )}
                  {!isLoadingCustomers && customersError && (
                    <tr>
                      <td className="px-6 py-6 text-[13px] text-destructive" colSpan={6}>
                        {customersError}
                      </td>
                    </tr>
                  )}
                  {!isLoadingCustomers && !customersError && pagedCustomers.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-[13px] text-muted-foreground" colSpan={6}>
                        No customers found.
                      </td>
                    </tr>
                  )}
                  {!isLoadingCustomers && !customersError && pagedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border hover:bg-muted/30 transition">
                      <td className="px-4 py-2 text-[13px] font-medium text-foreground">{customer.full_name || '-'}</td>
                      <td className="px-4 py-2 text-[13px] text-muted-foreground">{customer.email || '-'}</td>
                      <td className="px-4 py-2 text-[13px] text-muted-foreground">{customer.phone || '-'}</td>
                      <td className="px-4 py-2 text-[13px] font-semibold text-foreground">-</td>
                      <td className="px-4 py-2 text-[13px]">
                        <Badge
                          className={
                            customer.status === 'Active'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }
                        >
                          {customer.status || 'Active'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-[13px] space-x-2">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <div>
              Showing {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)} of {totalItems}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <div className="min-w-[80px] text-center">
                Page {safePage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
