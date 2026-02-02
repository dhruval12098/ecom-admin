'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import categoriesData from '@/data/categories.json';

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setCategories(categoriesData as Category[]);
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage product categories and subcategories</p>
          </div>
          <Link href="/admin/categories/add">
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </Link>
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {categories.map((category) => (
            <Link key={category.id} href={`/admin/categories/${category.id}`}>
              <div className="border border-border rounded-lg p-4 bg-card hover:bg-secondary/30 hover:border-primary/50 transition flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{category.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {category.subcategories.length} Subcategories
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
