import { useCallback, useEffect, useState } from 'react';

import { IconSearch } from '../components/icons';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { Paged, RfqRequest, RfqStatus } from '../lib/types';

const LIMIT = 25;

const STATUS_LABEL: Record<RfqStatus, string> = { NEW: 'New', CONTACTED: 'Contacted', CLOSED: 'Closed' };
const STATUS_STYLE: Record<RfqStatus, string> = {
  NEW: 'bg-amber-50 text-amber-700',
  CONTACTED: 'bg-brand-50 text-brand-700',
  CLOSED: 'bg-ink-100 text-ink-500',
};

const customerLabel = (c: RfqRequest['customer']) => c.name ?? c.phone ?? c.email ?? 'Customer';

/** Bulk-quote leads. Staff follow up by email/phone and track progress with status + note. */
export function RfqPage() {
  const [data, setData] = useState<Paged<RfqRequest> | null>(null);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // same debounce as the orders console
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
      setData((await api<{ data: Paged<RfqRequest> }>(`/admin/rfq?${params}`)).data);
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
            placeholder="Customer, product or requirements..."
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
          {(Object.keys(STATUS_LABEL) as RfqStatus[]).map((s) => (
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
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Target price</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    Loading quote requests...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    No quote requests match those filters.
                  </td>
                </tr>
              )}
              {data?.items.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-ink-50/60" onClick={() => setOpenId(r.id)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{customerLabel(r.customer)}</p>
                    <p className="text-xs text-ink-300">{[r.customer.phone, r.customer.email].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {r.product?.title ?? <span className="text-ink-300">General request</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{r.quantity}</td>
                  <td className="px-4 py-3 text-ink-700">{r.targetPrice != null ? formatMoney(r.targetPrice) : '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={r.status} />
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

      {openId && <RfqModal id={openId} onClose={() => setOpenId(null)} onChanged={() => void load()} />}
    </div>
  );
}

function StatusPill({ status }: { status: RfqStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function RfqModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [rfq, setRfq] = useState<RfqRequest | null>(null);
  const [status, setStatus] = useState<RfqStatus>('NEW');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data: RfqRequest }>(`/admin/rfq/${id}`)
      .then((r) => {
        setRfq(r.data);
        setStatus(r.data.status);
        setNote(r.data.adminNote ?? '');
      })
      .catch((e) => setError((e as Error).message));
  }, [id]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ data: RfqRequest }>(`/admin/rfq/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNote: note.trim() || null }),
      });
      setRfq(res.data);
      onChanged();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const c = rfq?.customer;
  const subject = rfq ? `Your IrriKart quote request${rfq.product ? ` for ${rfq.product.title}` : ''}` : '';

  return (
    <Modal onClose={onClose}>
      <div className="card space-y-5 p-5">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!rfq && !error && <p className="text-sm text-ink-500">Loading...</p>}
        {rfq && c && (
          <>
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-base font-bold text-ink-900">{rfq.product?.title ?? 'General quote request'}</h3>
                <p className="mt-1 text-xs text-ink-300">Received {formatDate(rfq.createdAt)}</p>
              </div>
              <div className="ml-auto">
                <StatusPill status={rfq.status} />
              </div>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Quantity</dt>
                <dd className="text-ink-900">{rfq.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Target price</dt>
                <dd className="text-ink-900">{rfq.targetPrice != null ? `${formatMoney(rfq.targetPrice)} / unit` : 'Not given'}</dd>
              </div>
            </dl>

            <section>
              <h4 className="mb-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">Requirements</h4>
              <p className="text-sm whitespace-pre-wrap text-ink-700">{rfq.requirements ?? '—'}</p>
            </section>

            <section>
              <h4 className="mb-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">Customer</h4>
              <p className="text-sm font-semibold text-ink-900">{customerLabel(c)}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-sm">
                {c.email && (
                  <a className="text-brand-700 hover:underline" href={`mailto:${c.email}?subject=${encodeURIComponent(subject)}`}>
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a className="text-brand-700 hover:underline" href={`tel:${c.phone}`}>
                    {c.phone}
                  </a>
                )}
              </div>
            </section>

            <section className="space-y-3 border-t border-ink-100 pt-4">
              <div>
                <label className="label">Status</label>
                <select className="field" value={status} onChange={(e) => setStatus(e.target.value as RfqStatus)}>
                  {(Object.keys(STATUS_LABEL) as RfqStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Internal note</label>
                <textarea
                  className="field min-h-24"
                  maxLength={2000}
                  placeholder="e.g. quoted ₹42/m, waiting on PO"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <p className="mt-1 text-xs text-ink-300">Only staff see this.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn-primary" disabled={saving} onClick={save}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
