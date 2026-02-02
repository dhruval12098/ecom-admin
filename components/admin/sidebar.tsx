'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Layers, 
  Users, 
  Tag, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Settings,
  BarChart3,
  Truck,
  Zap,
  Grid,
  Clock,
  Activity,
  ScrollText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: Layers,
  },
  {
    label: 'Inventory',
    href: '/admin/inventory',
    icon: BarChart3,
  },
  {
    label: 'Pricing',
    href: '/admin/pricing',
    icon: Clock,
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    label: 'Coupons',
    href: '/admin/coupons',
    icon: Tag,
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
  },
  {
    label: 'Content',
    href: '/admin/content',
    icon: FileText,
  },
  {
    label: 'Shipping',
    href: '/admin/shipping',
    icon: Truck,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: TrendingUp,
  },
  {
    label: 'Activity Logs',
    href: '/admin/audit-logs',
    icon: Activity,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">FoodAdmin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60">
          © 2024 FoodAdmin
        </div>
      </div>
    </aside>
  );
}
