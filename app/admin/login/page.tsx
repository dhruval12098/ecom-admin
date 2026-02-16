'use client';

import React from "react"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState(''); // Declare email and setEmail
  const [password, setPassword] = React.useState(''); // Declare password and setPassword
  const [isLoading, setIsLoading] = React.useState(false); // Declare isLoading
  const [error, setError] = React.useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Declare handleSubmit
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Invalid credentials');
      }
      const token = result?.data?.token;
      const adminEmail = result?.data?.admin?.email || email;
      if (!token) throw new Error('Missing token');
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_email', adminEmail);
      }
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-black/5 p-8 md:p-10">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Admin Access</p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Tulsi Grocery Ecommerce
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Sign in to manage orders, products, and store settings.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black/20"
              />
              <span className="text-sm text-foreground">Remember me</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white hover:bg-black/90 rounded-xl h-11"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Demo info */}
        <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500">
            Use your admin email and password to continue.
          </p>
        </div>

      </div>
    </div>
  );
}
