export function BestSellingProducts() {
  const products = [
    { id: 1, name: 'Biryani', sales: 342, revenue: '₹12,450' },
    { id: 2, name: 'Butter Chicken', sales: 298, revenue: '₹10,920' },
    { id: 3, name: 'Paneer Tikka', sales: 267, revenue: '₹8,010' },
    { id: 4, name: 'Dosa', sales: 245, revenue: '₹4,410' },
    { id: 5, name: 'Samosas', sales: 198, revenue: '₹2,970' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">Best Selling Products</h2>

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between pb-3 border-b border-border last:border-b-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.sales} sales</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{product.revenue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
