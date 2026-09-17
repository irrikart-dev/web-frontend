import { useEffect, useState } from 'react';

import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { formatDate, formatMoney } from '../lib/format';
import type { Payout } from '../lib/types';

export function VendorPayoutsPage() {
  const { vendor } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: Payout[] }>('/vendor/payouts')
      .then((r) => setPayouts(r.data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {vendor && !vendor.razorpayAccountId && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No Razorpay account is linked yet — ask IrriKart to add one so your share of each sale
          can be paid out automatically.
        </p>
      )}
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
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Your amount</th>
                <th className="px-4 py-3">Transfer</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    Loading payouts...
                  </td>
                </tr>
              )}
              {!loading && payouts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    No payouts yet.
                  </td>
                </tr>
              )}
              {payouts.map((p) => (
                <tr key={p.orderNumber} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{p.orderNumber}</td>
                  <td className="px-4 py-3 text-ink-700">{p.status}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatMoney(p.amount)}</td>
                  <td className="px-4 py-3 text-ink-700">{p.transferStatus ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
