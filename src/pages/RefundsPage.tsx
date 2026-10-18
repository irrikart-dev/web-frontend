import { useCallback, useEffect, useState } from 'react';

import { IconSearch } from '../components/icons';
import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { AdminRefund, Paged } from '../lib/types';
import { Tile } from './PaymentsPage';

const LIMIT = 25;

/**
 * Every refund — cancellations, returns, late payments and manual ones. All are
 * credited to the customer's IrriKart wallet; none go back to the card or UPI.
 */
export function RefundsPage() {
  const [data, setData] = useState<(Paged<AdminRefund> & { summary: { credited: number } }) | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (query) params.set('search', query);
    try {
      setData((await api<{ data: Paged<AdminRefund> & { summary: { credited: number } } }>(`/admin/refunds?${params}`)).data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-5">
      {data && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Tile label="Credited to wallets" value={formatMoney(data.summary.credited)} hint={`${data.total} refunds`} />
        </div>
      )}

      <div className="relative">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
        <input
          className="field pl-10"
          placeholder="Order number, customer or reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Credited</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    Loading refunds...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    No refunds match.
                  </td>
                </tr>
              )}
              {data?.items.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{r.order?.orderNumber ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-700">{r.customer ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatMoney(r.amount)}</td>
                  <td className="max-w-72 px-4 py-3 text-ink-700">
                    <p className="truncate">{r.reason}</p>
                    {r.manual && <p className="text-xs text-ink-300">Issued by staff</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.total > LIMIT && (
        <div className="flex items-center justify-end gap-2 text-sm text-ink-500">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
