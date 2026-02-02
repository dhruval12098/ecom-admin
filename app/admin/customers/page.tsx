'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Loading from './loading';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const searchParams = useSearchParams();

  const customers = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+91 98765 43210', status: 'Active', orders: 12 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+91 98765 43211', status: 'Active', orders: 8 },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '+91 98765 43212', status: 'Active', orders: 15 },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+91 98765 43213', status: 'Blocked', orders: 3 },
    { id: 5, name: 'Tom Brown', email: 'tom@example.com', phone: '+91 98765 43214', status: 'Active', orders: 22 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{customer.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{customer.phone}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{customer.orders}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        className={
                          customer.status === 'Active'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }
                      >
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        View
                      </Link>
                      <button className={`font-medium ${customer.status === 'Active' ? 'text-destructive hover:text-destructive/80' : 'text-primary hover:text-primary/80'}`}>
                        {customer.status === 'Active' ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export function Loading() {
  return null;
}
