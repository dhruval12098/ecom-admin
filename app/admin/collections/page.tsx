'use client';

import Link from 'next/link';
import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CollectionsPage() {
  const collections = [
    {
      id: 1,
      name: 'Best Sellers',
      description: 'Most popular items from our menu',
      productCount: 8,
      status: 'Active',
      icon: TrendingUp
    },
    {
      id: 2,
      name: 'Chef Specials',
      description: 'Chef recommended dishes',
      productCount: 5,
      status: 'Active',
      icon: TrendingUp
    },
    {
      id: 3,
      name: 'New Arrivals',
      description: 'Recently added to our menu',
      productCount: 12,
      status: 'Active',
      icon: TrendingUp
    },
    {
      id: 4,
      name: 'Recommended',
      description: 'AI recommended based on customer orders',
      productCount: 15,
      status: 'Active',
      icon: TrendingUp
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Collections</h1>
            <p className="text-muted-foreground text-sm mt-1">Create curated product collections</p>
          </div>
          <Link href="/admin/collections/add">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Collection
            </Button>
          </Link>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => {
            const IconComponent = collection.icon;
            return (
              <div key={collection.id} className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {collection.status}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">{collection.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{collection.description}</p>

                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{collection.productCount}</span> products
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/admin/collections/edit/${collection.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
