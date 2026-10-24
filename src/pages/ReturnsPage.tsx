import { useCallback, useEffect, useState } from 'react';

import { Field, Toggle } from '../components/form';
import { IconSearch } from '../components/icons';
import { Modal } from '../components/Modal';
import { OrderStatusBadge } from '../components/OrderParts';
import { ApiError, api, resolveAssetUrl } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { AdminReturnRequest, Paged, ReturnStatus } from '../lib/types';

const LIMIT = 25;

const STATUS_LABEL: Record<ReturnStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};
const STATUS_STYLE: Record<ReturnStatus, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-sky-50 text-sky-700',
  COMPLETED: 'bg-brand-50 text-brand-700',
  REJECTED: 'bg-ink-100 text-ink-500',
};

const customerLabel = (c: AdminReturnRequest['customer']) => c.name ?? c.phone ?? c.email ?? 'Customer';

/** Customer returns and replacements. Completing a return restocks the items and refunds the customer. */
export function ReturnsPage() {
  const [data, setData] = useState<Paged<AdminReturnRequest> | null>(null);
  const [status, setStatus] = useState('REQUESTED');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
      setData((await api<{ data: Paged<AdminReturnRequest> }>(`/admin/returns?${params}`)).data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, status, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
          <input
            className="field pl-10"
            placeholder="Order number, reason or customer..."
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
          <option value="">All requests</option>
          {(Object.keys(STATUS_LABEL) as ReturnStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    Loading returns...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    No return requests match those filters.
                  </td>
                </tr>
              )}
              {data?.items.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-ink-50/60" onClick={() => setOpenId(r.id)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{r.order.orderNumber}</p>
                    <p className="text-xs text-ink-300">
                      {r.items.reduce((n, i) => n + i.quantity, 0)} unit(s) ·{' '}
                      {r.order.paymentMethod === 'COD' ? 'COD' : 'Paid online'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{customerLabel(r.customer)}</td>
                  <td className="px-4 py-3 text-ink-700">{r.type === 'RETURN' ? 'Return' : 'Replace'}</td>
                  <td className="max-w-56 truncate px-4 py-3 text-ink-700">{r.reason}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
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

      {openId && <ReturnModal id={openId} onClose={() => setOpenId(null)} onChanged={() => void load()} />}
    </div>
  );
}

function ReturnModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [r, setR] = useState<AdminReturnRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [restock, setRestock] = useState(true);
  const [refund, setRefund] = useState('');

  useEffect(() => {
    api<{ data: AdminReturnRequest }>(`/admin/returns/${id}`)
      .then((res) => {
        setR(res.data);
        setRefund(String(res.data.suggestedRefund ?? 0));
      })
      .catch((e) => setError((e as Error).message));
  }, [id]);

  async function act(action: 'approve' | 'reject' | 'complete') {
    setBusy(true);
    setError(null);
    const body =
      action === 'complete'
        ? { restock, note: note.trim() || undefined, ...(r?.type === 'RETURN' ? { refundAmount: Number(refund) || 0 } : {}) }
        : { note: note.trim() || undefined };
    try {
      const res = await api<{ data: AdminReturnRequest }>(`/admin/returns/${id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setR(res.data);
      setNote('');
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update the return.');
    } finally {
      setBusy(false);
    }
  }

  const open = r && (r.status === 'REQUESTED' || r.status === 'APPROVED');

  return (
    <Modal onClose={onClose}>
      <div className="card space-y-5 p-5">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!r && !error && <p className="text-sm text-ink-500">Loading...</p>}
        {r && (
          <>
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-base font-bold text-ink-900">
                  {r.type === 'RETURN' ? 'Return' : 'Replacement'} · {r.order.orderNumber}
                </h3>
                <p className="mt-1 text-xs text-ink-300">
                  Requested {formatDate(r.createdAt)} by {customerLabel(r.customer)}
                  {r.customer.phone ? ` · ${r.customer.phone}` : ''}
                  {r.order.deliveredAt ? ` · delivered ${formatDate(r.order.deliveredAt)}` : ''}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <OrderStatusBadge status={r.order.status} />
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
            </div>

            <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
              {r.items.map((i) => {
                const src = resolveAssetUrl(i.image);
                return (
                  <li key={i.orderItemId} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-ink-100 bg-white">
                      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900">{i.name}</p>
                      <p className="text-xs text-ink-300">{i.sku}</p>
                    </div>
                    <span className="text-ink-700">× {i.quantity}</span>
                  </li>
                );
              })}
            </ul>

            <section>
              <h4 className="mb-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">Reason</h4>
              <p className="text-sm text-ink-900">{r.reason}</p>
              {r.details && <p className="mt-1 text-sm whitespace-pre-wrap text-ink-700">{r.details}</p>}
            </section>

            {r.photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {r.photoUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer noopener">
                    <img src={u} alt="Customer photo" className="h-24 w-24 rounded-lg border border-ink-100 object-cover" />
                  </a>
                ))}
              </div>
            )}

            {r.status === 'COMPLETED' && (
              <p className="rounded-lg border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-700">
                {r.restocked ? 'Restocked. ' : 'Not restocked. '}
                {r.refundAmount != null
                  ? r.refundStatus === 'manual'
                    ? `${formatMoney(r.refundAmount)} to pay back by hand (COD order).`
                    : `${formatMoney(r.refundAmount)} refund ${r.refundStatus}.`
                  : 'No refund.'}
                {r.refundStatus === 'failed' && ' Retry it with a manual refund from the order.'}
              </p>
            )}
            {r.adminNote && !open && <p className="text-sm text-ink-500">Note to customer: {r.adminNote}</p>}

            {open && (
              <section className="space-y-3 border-t border-ink-100 pt-4">
                <Field label="Note to customer" hint="Required to reject. Shown in the app with your decision.">
                  <textarea className="field min-h-20" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  {r.type === 'RETURN' && (
                    <Field
                      label="Refund (₹)"
                      hint={`Suggested ${formatMoney(r.suggestedRefund ?? 0)} — the items' share of what was paid.`}
                    >
                      <input className="field" type="number" min={0} value={refund} onChange={(e) => setRefund(e.target.value)} />
                    </Field>
                  )}
                  <div className="pt-6">
                    <Toggle label="Put items back in stock" hint="Untick for damaged goods." checked={restock} onChange={setRestock} />
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button className="btn-danger" disabled={busy || note.trim().length < 3} onClick={() => act('reject')}>
                    Reject
                  </button>
                  {r.status === 'REQUESTED' && (
                    <button className="btn-ghost" disabled={busy} onClick={() => act('approve')}>
                      Approve — arrange pickup
                    </button>
                  )}
                  <button className="btn-primary" disabled={busy} onClick={() => act('complete')}>
                    {busy ? '...' : r.type === 'RETURN' ? 'Goods received — refund' : 'Goods received — close'}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
