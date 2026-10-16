import { useEffect, useState } from 'react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatMoney } from '../lib/format';
import type { OrderSummary, Product, VendorPerformance } from '../lib/types';

export function VendorDashboardPage() {
  const { vendor } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [performance, setPerformance] = useState<VendorPerformance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ data: Product[] }>('/vendor/products'),
      api<{ data: OrderSummary[] }>('/vendor/orders'),
      api<{ data: VendorPerformance }>('/vendor/performance'),
    ])
      .then(([p, o, perf]) => {
        setProducts(p.data);
        setOrders(o.data);
        setPerformance(perf.data);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (!vendor) return <p className="text-sm text-ink-500">Loading…</p>;

  const activeProducts = products.filter((p) => p.status === 'PUBLISHED').length;
  const revenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.amount, 0);

  const tiles = [
    { label: 'Products', value: String(products.length), hint: `${activeProducts} live` },
    { label: 'Orders', value: String(orders.length), hint: 'all time' },
    { label: 'Gross sales', value: formatMoney(revenue), hint: `at ${vendor.commissionPercent}% commission` },
    { label: 'Razorpay', value: vendor.routeStatus ?? 'not linked', hint: vendor.status.toLowerCase() },
    {
      label: 'Rating',
      value: performance?.rating != null ? `★ ${performance.rating.toFixed(1)}` : '—',
      hint: `${performance?.reviewCount ?? 0} reviews`,
    },
    {
      label: 'Orders delivered',
      value: String(performance?.delivered ?? 0),
      hint: `${performance?.inFlight ?? 0} in progress`,
    },
    {
      label: 'Rejected',
      value: `${Math.round((performance?.rejectionRate ?? 0) * 100)}%`,
      hint: `${performance?.rejected ?? 0} of ${performance?.orders ?? 0} orders`,
    },
    {
      label: 'Returned',
      value: `${Math.round((performance?.returnRate ?? 0) * 100)}%`,
      hint: `${performance?.returned ?? 0} of ${performance?.orders ?? 0} orders`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{t.label}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">{t.value}</p>
            <p className="mt-1 text-xs text-ink-300">{t.hint}</p>
          </div>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="text-sm font-bold text-ink-900">Welcome, {vendor.storeName}</h2>
        <p className="mt-2 text-sm text-ink-500">
          Manage your listings under My Products, and track incoming orders and payouts from the
          tabs on the left.
        </p>
      </section>
    </div>
  );
}
