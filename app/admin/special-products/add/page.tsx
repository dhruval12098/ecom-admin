import SpecialProductForm from '../_components/special-product-form';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
const fetchJson = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  const json = await res.json();
  if (!json?.success) return [];
  return json.data ?? [];
};

export default async function AddSpecialProductPage() {
  const categories = await fetchJson(`${API_BASE_URL}/api/special-categories`);
  return (
    <SpecialProductForm
      mode="add"
      initialCategories={categories}
      initialSubcategories={[]}
    />
  );
}
