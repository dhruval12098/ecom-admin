'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import categoriesData from '@/data/categories.json';
import { useParams } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  sku: string;
  inStock: boolean;
  rating: number;
  imageGallery?: string[];
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  products?: Product[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export default function SubcategoryProductsPage() {
  const params = useParams();
  const categoryId = parseInt(params.categoryId as string);
  const subcategoryId = parseInt(params.subcategoryId as string);
  
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const found = categoriesData.find((cat: Category) => cat.id === categoryId);
    if (found) {
      setCategory(found);
      const subcat = found.subcategories.find((s: Subcategory) => s.id === subcategoryId);
      if (subcat) {
        setSubcategory(subcat);
        setProducts(subcat.products || []);
      }
    }
  }, [categoryId, subcategoryId]);

  if (!category || !subcategory) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Subcategory not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/categories" className="hover:text-foreground">Categories</Link>
          <span>/</span>
          <Link href={`/admin/categories/${categoryId}`} className="hover:text-foreground">{category.name}</Link>
          <span>/</span>
          <span className="text-foreground">{subcategory.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{subcategory.name}</h1>
            <p className="text-muted-foreground mt-1">{products.length} Products</p>
          </div>
          <Link href={`/admin/products/add?category=${categoryId}&subcategory=${subcategoryId}`}>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Products Grid/Cards */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="border border-border rounded-lg overflow-hidden bg-card hover:shadow-lg transition flex flex-col"
              >
                {/* Product Image */}
                <div className="relative bg-muted h-48 flex items-center justify-center overflow-hidden">
                  {product.imageGallery && product.imageGallery[0] ? (
                    <img 
                      src={product.imageGallery[0] || "/placeholder.svg"} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  )}
                  
                  {product.discount && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      {product.discount}
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      product.inStock 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                  </div>

                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-lg font-bold text-primary">€{product.price}</span>
                    <span className="text-sm text-muted-foreground line-through">€{product.originalPrice}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Link href={`/admin/products/edit/${product.id}`}>
                      <Button variant="outline" size="sm" className="w-full gap-1 bg-transparent">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="w-full gap-1 text-destructive hover:text-destructive bg-transparent">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No products in this subcategory</p>
            <Link href={`/admin/products/add?category=${categoryId}&subcategory=${subcategoryId}`}>
              <Button className="gap-2 bg-primary">
                <Plus className="w-4 h-4" />
                Add First Product
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
