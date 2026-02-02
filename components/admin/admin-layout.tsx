'use client';

import React from "react"

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Providers } from '@/app/providers';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Sidebar />
      <Topbar />
      <main className="ml-60 mt-16 p-6 bg-background min-h-screen">
        {children}
      </main>
    </Providers>
  );
}
