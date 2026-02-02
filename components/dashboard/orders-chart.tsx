'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

const chartData = [
  { date: 'Jan 1', orders: 240, revenue: 2400 },
  { date: 'Jan 2', orders: 321, revenue: 2210 },
  { date: 'Jan 3', orders: 200, revenue: 2290 },
  { date: 'Jan 4', orders: 279, revenue: 2000 },
  { date: 'Jan 5', orders: 200, revenue: 2181 },
  { date: 'Jan 6', orders: 349, revenue: 2500 },
  { date: 'Jan 7', orders: 289, revenue: 2100 },
];

export function OrdersChart() {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Orders Overview</h2>
          <p className="text-sm text-muted-foreground">Daily orders and revenue</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            Bar
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: `1px solid var(--border)`,
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="orders" stroke="#2563EB" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
          </LineChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: `1px solid var(--border)`,
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
