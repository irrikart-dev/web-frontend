import { useEffect, useState } from 'react';

import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { OrderSummary } from '../lib/types';

export function VendorOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: OrderSummary[] }>('/vendor/orders')
      .then((r) => setOrders(r.data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-500">
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-500">
                    No orders yet — they'll show up here as customers buy your products.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatMoney(o.amount)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
