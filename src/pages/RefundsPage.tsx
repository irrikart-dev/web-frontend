import { useCallback, useEffect, useState } from 'react';

import { IconSearch } from '../components/icons';
import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { AdminRefund, Paged } from '../lib/types';
import { Tile } from './PaymentsPage';

const LIMIT = 25;

const STATUS_STYLE: Record<AdminRefund['status'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  processed: 'bg-brand-50 text-brand-700',
  failed: 'bg-red-50 text-red-600',
};

type Summary = Partial<Record<AdminRefund['status'], { count: number; amount: number }>>;

/** Every refund sent back through the gateway — cancellations, returns, RTOs and manual ones. */
export function RefundsPage() {
  const [data, setData] = useState<(Paged<AdminRefund> & { summary: Summary }) | null>(null);
  const [status, setStatus] = useState('');
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
    if (status) params.set('status', status);
    if (query) params.set('search', query);
    try {
      setData((await api<{ data: Paged<AdminRefund> & { summary: Summary } }>(`/admin/refunds?${params}`)).data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, status, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const s = data?.summary;
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const tile = (k: AdminRefund['status']) => s?.[k] ?? { count: 0, amount: 0 };

  return (
    <div className="space-y-5">
      {s && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile label="Processed" value={formatMoney(tile('processed').amount)} hint={`${tile('processed').count} refunds`} />
          <Tile label="Pending at bank" value={formatMoney(tile('pending').amount)} hint={`${tile('pending').count} refunds`} />
          <Tile
            label="Failed"
            value={formatMoney(tile('failed').amount)}
            hint="retry with a manual refund from the order"
            alert={tile('failed').count > 0}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
          <input
            className="field pl-10"
            placeholder="Order number, refund id or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field w-auto"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All refunds</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    Loading refunds...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    No refunds match those filters.
                  </td>
                </tr>
              )}
              {data?.items.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-ink-700">{r.orderNumber}</p>
                    <p className="font-mono text-[11px] text-ink-300">{r.razorpayRefundId}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{r.customer ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatMoney(r.amount)}</td>
                  <td className="max-w-64 truncate px-4 py-3 text-ink-700">{r.reason ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status] ?? ''}`}>
                      {r.status}
                    </span>
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
