'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { StatCard } from '@/components/dashboard/stat-card';
import { RecentOrdersTable } from '@/components/dashboard/recent-orders-table';
import { OrdersChart } from '@/components/dashboard/orders-chart';
import { BestSellingProducts } from '@/components/dashboard/best-selling-products';
import {

  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '@/lib/currency';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/orders`),
          fetch(`${API_BASE_URL}/api/products`),
        ]);
        const ordersJson = await ordersRes.json();
        const productsJson = await productsRes.json();

        if (ordersJson.success && Array.isArray(ordersJson.data)) {
          setOrders(ordersJson.data);
        }
        if (productsJson.success && Array.isArray(productsJson.data)) {
          setProducts(productsJson.data);
        }
      } catch (e) {
        // keep UI stable on failure
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchOrderItems = async () => {
      setItemsLoading(true);
      try {
        const details = await Promise.all(
          orders.map(async (order) => {
            const res = await fetch(`${API_BASE_URL}/api/orders/${order.id}`);
            const result = await res.json();
            if (!result.success || !result.data) return [];
            const items = Array.isArray(result.data.items) ? result.data.items : [];
            return items.map((item: any) => ({
              product_name: item.product_name,
              quantity: Number(item.quantity || 0),
              line_total: Number(item.total_price || Number(item.unit_price || 0) * Number(item.quantity || 0))
            }));
          })
        );
        setOrderItems(details.flat());
      } catch (e) {
        setOrderItems([]);
      } finally {
        setItemsLoading(false);
      }
    };

    if (orders.length === 0) {
      setOrderItems([]);
      setItemsLoading(false);
      return;
    }

    fetchOrderItems();
  }, [orders]);

  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}`;

  const monthStats = useMemo(() => {
    const now = new Date();
    const currentKey = monthKey(now);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = monthKey(prev);

    let currentOrders = 0;
    let prevOrders = 0;
    let currentRevenue = 0;
    let prevRevenue = 0;

    orders.forEach((order) => {
      if (!order.created_at) return;
      const created = new Date(order.created_at);
      const key = monthKey(created);
      const amount = Number(order.total_amount || 0);
      if (key === currentKey) {
        currentOrders += 1;
        currentRevenue += amount;
      } else if (key === prevKey) {
        prevOrders += 1;
        prevRevenue += amount;
      }
    });

    return { currentOrders, prevOrders, currentRevenue, prevRevenue };
  }, [orders]);

  const formatChange = (current: number, previous: number) => {
    if (previous <= 0) return '0%';
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
  };

  const todayStats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);

    let todayOrders = 0;
    let yesterdayOrders = 0;

    orders.forEach((order) => {
      if (!order.created_at) return;
      const key = new Date(order.created_at).toISOString().slice(0, 10);
      if (key === todayKey) todayOrders += 1;
      if (key === yKey) yesterdayOrders += 1;
    });

    return { todayOrders, yesterdayOrders };
  }, [orders]);

  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders]
  );

  const totalUsers = useMemo(() => {
    const ids = new Set<string>();
    orders.forEach((order) => {
      const key = String(order.customer_id || order.customer_email || order.customer_phone || order.customer_name || '').trim();
      if (key) ids.add(key);
    });
    return ids.size;
  }, [orders]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => Number(p.stock_quantity || 0) <= 5 || p.in_stock === false).length;
  }, [products]);

  const chartData = useMemo(() => {
    const days = 7;
    const buckets: Record<string, { orders: number; revenue: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { orders: 0, revenue: 0 };
    }

    orders.forEach((order) => {
      if (!order.created_at) return;
      const key = new Date(order.created_at).toISOString().slice(0, 10);
      if (!buckets[key]) return;
      buckets[key].orders += 1;
      buckets[key].revenue += Number(order.total_amount || 0);
    });

    return Object.entries(buckets).map(([date, values]) => ({
      date,
      orders: values.orders,
      revenue: values.revenue
    }));
  }, [orders]);

  const bestSellers = useMemo(() => {
    const byProduct: Record<string, { name: string; sales: number; revenue: number }> = {};
    orderItems.forEach((item) => {
      const name = item.product_name || 'Unknown';
      if (!byProduct[name]) byProduct[name] = { name, sales: 0, revenue: 0 };
      byProduct[name].sales += Number(item.quantity || 0);
      byProduct[name].revenue += Number(item.line_total || 0);
    });

    return Object.values(byProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orderItems]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Orders"
            value={`${orders.length}`}
            change={formatChange(monthStats.currentOrders, monthStats.prevOrders)}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            change={formatChange(monthStats.currentRevenue, monthStats.prevRevenue)}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Total Products"
            value={`${products.length}`}
            change="0%"
            icon={Package}
            color="purple"
          />
          <StatCard
            title="Total Users"
            value={`${totalUsers}`}
            change="0%"
            icon={Users}
            color="orange"
          />
          <StatCard
            title="Today's Orders"
            value={`${todayStats.todayOrders}`}
            change={formatChange(todayStats.todayOrders, todayStats.yesterdayOrders)}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Low Stock Alerts"
            value={`${lowStockCount}`}
            change="0%"
            icon={AlertCircle}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OrdersChart data={chartData} isLoading={isLoading} />
          </div>
          <div>
            <BestSellingProducts products={bestSellers} isLoading={itemsLoading} />
          </div>
        </div>

        <RecentOrdersTable />
      </div>
    </AdminLayout>
  );
}
