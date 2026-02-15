import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/currency';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';


export function RecentOrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setOrders(result.data.slice(0, 5));
        }
      } catch (e) {
        // keep UI stable on failure
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const statusColors: Record<string, string> = {
    'Delivered': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    'In Transit': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    'Confirmed': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    'Pending': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    'Cancelled': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  };

  const normalizeStatus = (status: string) => {
    if (!status) return 'Pending';
    const cleaned = status.replace(/_/g, ' ');
    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-6 py-6 text-sm text-muted-foreground" colSpan={6}>
                  Loading orders...
                </td>
              </tr>
            )}
            {!isLoading && orders.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{order.order_number || order.id}</td>
                <td className="px-6 py-4 text-sm text-foreground">{order.customer_name || '-'}</td>
                <td className="px-6 py-4 text-sm font-semibold text-foreground">{formatCurrency(Number(order.total_amount || 0))}</td>
                <td className="px-6 py-4 text-sm">
                  {(() => {
                    const label = normalizeStatus(String(order.status || 'Pending'));
                    return (
                      <Badge className={statusColors[label] || statusColors.Pending}>
                        {label}
                      </Badge>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
