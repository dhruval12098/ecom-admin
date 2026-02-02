'use client';

import React from "react"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react'; // Import Zap from lucide-react or any other icon library

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState(''); // Declare email and setEmail
  const [password, setPassword] = React.useState(''); // Declare password and setPassword
  const [isLoading, setIsLoading] = React.useState(false); // Declare isLoading

  const handleSubmit = (e) => { // Declare handleSubmit
    e.preventDefault();
    setIsLoading(true);
    // Handle login logic here
    setIsLoading(false);
  };

  useEffect(() => {
    // Redirect directly to dashboard - login is disabled
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">FoodAdmin</span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your admin dashboard to manage your food ordering business.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
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
              className="w-full px-4 py-2 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Remember me</span>
            </label>
            <Link
              href="#"
              className="text-sm text-primary hover:text-primary/80 transition"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Demo info */}
        <div className="mt-6 p-4 rounded-md bg-muted">
          <p className="text-xs text-muted-foreground">
            <strong>Demo credentials:</strong> Use any email and password to login
          </p>
        </div>
      </div>
    </div>
  );
}
