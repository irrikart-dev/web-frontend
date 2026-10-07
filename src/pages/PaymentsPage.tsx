import { useCallback, useEffect, useState } from 'react';

import { IconSearch } from '../components/icons';
import { STATUS_LABEL } from '../components/OrderParts';
import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { AdminPayment, Paged, PaymentSummary } from '../lib/types';

const LIMIT = 25;

export function PaymentsPage() {
  const [data, setData] = useState<(Paged<AdminPayment> & { summary: PaymentSummary }) | null>(null);
  const [status, setStatus] = useState('');
  const [transferStatus, setTransferStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
    if (transferStatus) params.set('transferStatus', transferStatus);
    // date inputs are local days — widen "to" to the end of that day
    if (from) params.set('from', new Date(`${from}T00:00:00`).toISOString());
    if (to) params.set('to', new Date(`${to}T23:59:59.999`).toISOString());
    if (query) params.set('search', query);
    try {
      const res = await api<{ data: Paged<AdminPayment> & { summary: PaymentSummary } }>(`/admin/payments?${params}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, status, transferStatus, from, to, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const s = data?.summary;
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const filter = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {s && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Tile label="Captured" value={formatMoney(s.captured.amount)} hint={`${s.captured.count} payments`} />
          <Tile label="Refunded" value={formatMoney(s.refunded)} hint="to customers" />
          <Tile label="Net" value={formatMoney(s.captured.amount - s.refunded)} hint="captured − refunded" />
          <Tile label="Failed / pending" value={`${s.failed.count} / ${s.pending.count}`} hint="attempts" />
          <Tile
            label="Vendor transfers failed"
            value={String(s.transferFailed)}
            hint="retry in Razorpay Route"
            alert={s.transferFailed > 0}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
          <input
            className="field pl-10"
            placeholder="Order number or Razorpay order/payment id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="field w-auto" value={status} onChange={filter(setStatus)}>
          <option value="">All payments</option>
          <option value="CAPTURED">Captured</option>
          <option value="FAILED">Failed</option>
          <option value="CREATED">Pending</option>
        </select>
        <select className="field w-auto" value={transferStatus} onChange={filter(setTransferStatus)}>
          <option value="">Any transfer</option>
          <option value="processed">Transferred</option>
          <option value="failed">Transfer failed</option>
          <option value="reversed">Reversed</option>
          <option value="none">No transfer</option>
        </select>
        <input className="field w-auto" type="date" value={from} onChange={filter(setFrom)} aria-label="From" />
        <input className="field w-auto" type="date" value={to} onChange={filter(setTo)} aria-label="To" />
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer / vendor</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Vendor / fee</th>
                <th className="px-4 py-3">Transfer</th>
                <th className="px-4 py-3">Refunded</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-500">
                    Loading payments...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-500">
                    No payments match those filters.
                  </td>
                </tr>
              )}
              {data?.items.map((p) => (
                <tr key={p.id} className={p.needsAttention ? 'bg-red-50/60' : 'hover:bg-ink-50/60'}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-ink-700">{p.orderNumber}</p>
                    <p className="text-xs text-ink-300">order: {STATUS_LABEL[p.orderStatus].toLowerCase()}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink-900">{p.customer}</p>
                    <p className="text-xs text-ink-300">{p.vendor}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-ink-900">
                      {p.status === 'CREATED' ? 'Pending' : p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                      {p.method ? ` · ${p.method}` : ''}
                    </p>
                    <p className="font-mono text-[11px] text-ink-300">{p.providerPaymentId ?? p.providerOrderId}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatMoney(p.amount)}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {formatMoney(p.vendorAmount)} / {formatMoney(p.platformAmount)}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{p.transferStatus ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-700">
                    {p.refunded > 0 ? formatMoney(p.refunded) : '—'}
                    {p.needsAttention && <p className="text-xs font-semibold text-red-600">Needs attention</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(p.createdAt)}</td>
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

      <p className="text-xs text-ink-300">
        Highlighted rows hold money that isn't matched: captured on a cancelled order without a full refund, or a
        vendor transfer that failed. Cash-on-delivery orders have no gateway payment and don't appear here.
      </p>
    </div>
  );
}

function Tile({ label, value, hint, alert }: { label: string; value: string; hint: string; alert?: boolean }) {
  return (
    <div className={`card p-4 ${alert ? 'border-red-200 bg-red-50' : ''}`}>
      <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{label}</p>
      <p className={`mt-1 text-xl font-bold ${alert ? 'text-red-700' : 'text-ink-900'}`}>{value}</p>
      <p className="text-xs text-ink-300">{hint}</p>
    </div>
  );
}
