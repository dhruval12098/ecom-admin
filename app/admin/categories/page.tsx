'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


interface Subcategory {
  id: number;
  name: string;
  slug: string;
  image: string;
  products?: any[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load categories.',
          variant: 'destructive',
        });
      }
    };

    fetchCategories();
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/admin/categories/${category.id}`}>
              <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-sm hover:shadow transition-shadow flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-semibold">
                    {category.name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{category.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {category.subcategories.length} Subcategories
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
