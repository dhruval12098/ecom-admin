import { formatCurrency } from '@/lib/currency';

interface BestSellingProductsProps {
  products: { name: string; sales: number; revenue: number }[];
  isLoading?: boolean;
}

export function BestSellingProducts({ products, isLoading }: BestSellingProductsProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">Best Selling Products</h2>

      <div className="space-y-3">
        {isLoading && <div className="text-sm text-muted-foreground">Loading products...</div>}
        {!isLoading && products.length === 0 && (
          <div className="text-sm text-muted-foreground">No sales data yet.</div>
        )}
        {!isLoading && products.map((product) => (
          <div key={product.name} className="flex items-center justify-between pb-3 border-b border-border last:border-b-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sales} sales</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{formatCurrency(product.revenue)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
