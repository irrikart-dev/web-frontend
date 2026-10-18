import { useCallback, useEffect, useState } from 'react';

import { IconSearch } from '../components/icons';
import { Modal } from '../components/Modal';
import { OrderStatusBadge } from '../components/OrderParts';
import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { CustomerDetail, CustomerSummary, Paged } from '../lib/types';

const LIMIT = 25;

export function CustomersPage() {
  const [data, setData] = useState<Paged<CustomerSummary> | null>(null);
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
      setData((await api<{ data: Paged<CustomerSummary> }>(`/admin/customers?${params}`)).data);
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
            placeholder="Name, phone or email..."
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
          <option value="">All customers</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    Loading customers...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    No customers match those filters.
                  </td>
                </tr>
              )}
              {data?.items.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-ink-50/60" onClick={() => setOpenId(c.id)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{c.name ?? c.phone ?? c.email ?? 'Unnamed'}</p>
                    <p className="text-xs text-ink-300">{[c.phone, c.email].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{c.orderCount}</td>
                  <td className="px-4 py-3 text-ink-700">{formatMoney(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={c.status} />
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

      {openId && <CustomerModal id={openId} onClose={() => setOpenId(null)} onChanged={() => void load()} />}
    </div>
  );
}

function StatusPill({ status }: { status: CustomerSummary['status'] }) {
  return status === 'ACTIVE' ? (
    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Active</span>
  ) : (
    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Blocked</span>
  );
}

function CustomerModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ data: CustomerDetail }>(`/admin/customers/${id}`)
      .then((r) => setCustomer(r.data))
      .catch((e) => setError((e as Error).message));
  }, [id]);

  async function toggleBlock() {
    if (!customer) return;
    const next = customer.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    if (next === 'BLOCKED' && !confirm('Block this customer? They will be signed out of the app and cannot place orders.')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ data: CustomerDetail }>(`/admin/customers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      setCustomer(res.data);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="card space-y-5 p-5">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!customer && !error && <p className="text-sm text-ink-500">Loading...</p>}
        {customer && (
          <>
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-base font-bold text-ink-900">{customer.name ?? 'Unnamed customer'}</h3>
                <p className="text-sm text-ink-500">{[customer.phone, customer.email].filter(Boolean).join(' · ')}</p>
                <p className="mt-1 text-xs text-ink-300">
                  Joined {formatDate(customer.createdAt)} · {customer.orderCount} orders · {formatMoney(customer.totalSpent)} spent ·{' '}
                  {formatMoney(customer.walletBalance)} in wallet
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <StatusPill status={customer.status} />
                <button
                  className={customer.status === 'ACTIVE' ? 'btn-ghost text-red-600 hover:bg-red-50' : 'btn-primary'}
                  disabled={busy}
                  onClick={toggleBlock}
                >
                  {customer.status === 'ACTIVE' ? 'Block' : 'Unblock'}
                </button>
              </div>
            </div>

            <section>
              <h4 className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Addresses</h4>
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-ink-300">None saved.</p>
              ) : (
                <ul className="space-y-2 text-sm text-ink-700">
                  {customer.addresses.map((a) => (
                    <li key={a.id}>
                      <span className="font-semibold">{a.name}</span> · {a.phone}
                      {a.isDefault && <span className="ml-2 text-xs text-brand-700">default</span>}
                      <br />
                      {[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h4 className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Recent orders</h4>
              {customer.orders.length === 0 ? (
                <p className="text-sm text-ink-300">No orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-ink-100">
                    {customer.orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-2 font-mono text-xs text-ink-900">{o.orderNumber}</td>
                        <td className="py-2 text-ink-500">{o.vendor}</td>
                        <td className="py-2">
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className="py-2 text-right text-ink-700">{formatMoney(o.totalAmount)}</td>
                        <td className="py-2 text-right text-ink-300">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}
