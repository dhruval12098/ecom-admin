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
  ShoppingBasket,
  Grid,
  Clock,
  Activity,
  ScrollText,
  Trash2,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: Layers,
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
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
    label: 'Home Sections',
    href: '/admin/home-sections',
    icon: Grid,
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
    label: 'Support',
    href: '/admin/support',
    icon: ScrollText,
  },
  {
    label: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
  {
    label: 'Recycle Bin',
    href: '/admin/trash',
    icon: Trash2,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const key = 'adminSidebarScrollTop';
    const saved = sessionStorage.getItem(key);
    if (navRef.current && saved) {
      navRef.current.scrollTop = Number(saved) || 0;
    }

    const el = navRef.current;
    if (!el) return;
    const handleScroll = () => {
      sessionStorage.setItem(key, String(el.scrollTop));
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  return (
      <aside
        className={cn(
          'border-r border-border bg-sidebar text-sidebar-foreground flex flex-col h-screen fixed left-0 top-0 overflow-x-hidden w-60'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <ShoppingBasket className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="logo-text font-semibold text-sm">
              Tulsi - ADMIN
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav ref={navRef} className="admin-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'admin-nav-item relative flex items-center rounded-md text-xs font-medium transition-colors',
                  isActive && 'active',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                  'gap-2 px-2.5 py-2'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="admin-sidebar-icon w-3.5 h-3.5" />
                <span className="admin-sidebar-label">{item.label}</span>
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
