'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SpecialProductForm from '../../_components/special-product-form';
import { AdminLayout } from '@/components/admin/admin-layout';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const fetchJson = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  if (!json?.success) return null;
  return json.data ?? null;
};

export default function EditSpecialProductPage() {
  const params = useParams();
  const productId = params?.id as string | undefined;
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [catData, productData] = await Promise.all([
          fetchJson(`${API_BASE_URL}/api/special-categories`),
          fetchJson(`${API_BASE_URL}/api/special-products/${productId}`)
        ]);
        setCategories(Array.isArray(catData) ? catData : []);
        setProduct(productData || null);
        const categoryId = productData?.category_id ? Number(productData.category_id) : null;
        if (categoryId) {
          const subData = await fetchJson(
            `${API_BASE_URL}/api/special-subcategories?categoryId=${categoryId}`
          );
          setSubcategories(Array.isArray(subData) ? subData : []);
        } else {
          setSubcategories([]);
        }
      } catch {
        setCategories([]);
        setSubcategories([]);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [productId]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <SpecialProductForm
      mode="edit"
      initialCategories={categories}
      initialSubcategories={subcategories}
      initialProduct={product}
    />
  );
}
