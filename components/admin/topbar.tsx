'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Bell, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('admin_email');
    if (stored) setAdminEmail(stored);
  }, []);

  const initials = useMemo(() => {
    const value = adminEmail || 'Admin';
    return value.trim().charAt(0).toUpperCase();
  }, [adminEmail]);

  return (
    <header
      className="h-16 border-b border-border bg-card fixed right-0 top-0 flex items-center justify-between px-6 z-40"
      style={{ left: '240px' }}
    >
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Admin profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <div className="text-sm font-medium">Admin User</div>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <div className="text-xs text-muted-foreground">{adminEmail}</div>
            </DropdownMenuItem>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('admin_token');
                  localStorage.removeItem('admin_email');
                }
                router.replace('/admin/login');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
