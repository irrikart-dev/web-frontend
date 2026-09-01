import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api, imageSrc } from '../lib/api';
import { formatCompactMoney, formatMoney } from '../lib/format';
import type { Stats } from '../lib/types';

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: Stats }>('/admin/stats')
      .then((r) => setStats(r.data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (!stats) return <p className="text-sm text-ink-500">Loading…</p>;

  const tiles = [
    { label: 'Products', value: String(stats.totalProducts), hint: `${stats.activeProducts} active` },
    { label: 'Added here', value: String(stats.adminProducts), hint: `${stats.seedProducts} from catalogue` },
    { label: 'Out of stock', value: String(stats.outOfStock), hint: 'needs restocking' },
    { label: 'Inventory value', value: formatCompactMoney(stats.inventoryValue), hint: `avg ${formatMoney(stats.averagePrice)}` },
  ];

  const maxCount = Math.max(1, ...stats.byCategory.map((c) => c.count));

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

      <div className="grid gap-5 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-ink-900">Products per category</h2>
          <ul className="mt-4 space-y-3">
            {stats.byCategory.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-700">{c.name}</span>
                  <span className="font-semibold text-ink-900">{c.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-50">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(c.count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Recently updated</h2>
            <Link to="/products" className="text-xs font-semibold text-brand-600 hover:underline">
              View catalog
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink-100">
            {stats.recentlyUpdated.map((p) => {
              const src = imageSrc(p);
              return (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                    {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{p.name}</p>
                    <p className="truncate font-mono text-xs text-ink-300">{p.sku}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink-900">{formatMoney(p.price)}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
