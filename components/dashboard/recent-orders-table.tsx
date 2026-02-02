import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export function RecentOrdersTable() {
  const orders = [
    { id: 'ORD-001', customer: 'John Doe', amount: '₹450', status: 'Delivered', date: '2024-01-20' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: '₹320', status: 'In Transit', date: '2024-01-20' },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: '₹580', status: 'Confirmed', date: '2024-01-20' },
    { id: 'ORD-004', customer: 'Sarah Wilson', amount: '₹290', status: 'Pending', date: '2024-01-19' },
    { id: 'ORD-005', customer: 'Tom Brown', amount: '₹720', status: 'Delivered', date: '2024-01-19' },
  ];

  const statusColors: Record<string, string> = {
    'Delivered': 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    'In Transit': 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    'Confirmed': 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    'Pending': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    'Cancelled': 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
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
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-muted/30 transition">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{order.id}</td>
                <td className="px-6 py-4 text-sm text-foreground">{order.customer}</td>
                <td className="px-6 py-4 text-sm font-semibold text-foreground">{order.amount}</td>
                <td className="px-6 py-4 text-sm">
                  <Badge className={statusColors[order.status] || statusColors.Pending}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
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
