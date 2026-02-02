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

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Orders"
            value="2,543"
            change="+12.5%"
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value="₹45,231"
            change="+8.2%"
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Total Products"
            value="342"
            change="+3.1%"
            icon={Package}
            color="purple"
          />
          <StatCard
            title="Total Users"
            value="1,843"
            change="+5.4%"
            icon={Users}
            color="orange"
          />
          <StatCard
            title="Today's Orders"
            value="48"
            change="+2.1%"
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Low Stock Alerts"
            value="12"
            change="-1.2%"
            icon={AlertCircle}
            color="red"
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OrdersChart />
          </div>
          <div>
            <BestSellingProducts />
          </div>
        </div>

        {/* Recent Orders Table */}
        <RecentOrdersTable />
      </div>
    </AdminLayout>
  );
}
