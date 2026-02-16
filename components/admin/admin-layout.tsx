'use client';

import React, { Suspense, useEffect, useState } from "react"
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

import { Providers } from '@/app/providers';

const Sidebar = dynamic(() => import('./sidebar').then((mod) => mod.Sidebar), {
  ssr: false,
  loading: () => <div className="admin-sidebar-skeleton" aria-hidden="true" />,
});

const Topbar = dynamic(() => import('./topbar').then((mod) => mod.Topbar), {
  ssr: false,
  loading: () => <div className="admin-topbar-skeleton" aria-hidden="true" />,
});

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const res = await fetch(`${API_BASE_URL}/api/admin-auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Unauthorized');
        setAuthChecked(true);
      } catch (e) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        router.replace('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  if (!mounted || !authChecked) {
    return (
      <div className="admin-shell-loading" aria-hidden="true">
        <div className="admin-sidebar-skeleton" />
        <div className="admin-topbar-skeleton" />
        <main className="ml-60 mt-16 p-6 bg-background min-h-screen">
          <div className="admin-content-skeleton" />
        </main>
      </div>
    );
  }

  return (
    <Providers>
      <Sidebar />
      <Topbar />
      <main className="mt-16 p-6 bg-background min-h-screen ml-60">
        <Suspense fallback={<div className="admin-content-skeleton" />}>
          <div className="page-fade-in">{children}</div>
        </Suspense>
      </main>
    </Providers>
  );
}
