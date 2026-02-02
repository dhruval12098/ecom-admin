'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import categoriesData from '@/data/categories.json';
import { useParams } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  price: number;
  discount: string;
  image?: string;
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  image: string;
  productCount: number;
  products?: Product[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = parseInt(params.categoryId as string);
  
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    const found = categoriesData.find((cat: Category) => cat.id === categoryId);
    setCategory(found || null);
  }, [categoryId]);

  if (!category) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Category not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/categories">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
            <p className="text-muted-foreground mt-1">{category.subcategories.length} Subcategories</p>
          </div>
        </div>

        {/* Subcategories Grid - WITH IMAGES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.subcategories.map((subcat) => (
            <Link key={subcat.id} href={`/admin/categories/${categoryId}/${subcat.id}`}>
              <div className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg hover:border-primary/50 transition cursor-pointer h-full flex flex-col">
                {/* Subcategory Image */}
                <img 
                  src={subcat.image || "/placeholder.svg"} 
                  alt={subcat.name}
                  className="w-full h-48 object-cover"
                />
                
                {/* Subcategory Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{subcat.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <ShoppingBag className="w-4 h-4" />
                      {subcat.productCount} Products
                    </div>
                  </div>

                  {/* View Button */}
                  <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground mt-4">
                    <ShoppingBag className="w-4 h-4" />
                    View Products
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
