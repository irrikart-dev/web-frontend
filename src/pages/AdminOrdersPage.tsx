import { useCallback, useEffect, useState } from 'react';

import { IconSearch } from '../components/icons';
import { Modal } from '../components/Modal';
import {
  OrderBody,
  OrderStatusBadge,
  ReasonForm,
  STATUS_LABEL,
  downloadPdf,
  paymentLabel,
} from '../components/OrderParts';
import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import { getVendors } from '../lib/vendors';
import type { AdminOrderDetail, AdminOrderSummary, OrderStatus, Paged, Vendor } from '../lib/types';

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { CONFIRMED: 'PACKED', PACKED: 'SHIPPED', SHIPPED: 'DELIVERED' };
const CANCELLABLE: OrderStatus[] = ['PLACED', 'PAYMENT_FAILED', 'CONFIRMED', 'PACKED'];
const LIMIT = 25;

export function AdminOrdersPage() {
  const [data, setData] = useState<Paged<AdminOrderSummary> | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [status, setStatus] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // debounce typing into the search box so every keystroke isn't a request
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
    if (vendorId) params.set('vendorId', vendorId);
    if (query) params.set('search', query);
    try {
      const res = await api<{ data: Paged<AdminOrderSummary> }>(`/admin/orders?${params}`);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, status, vendorId, query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getVendors().then(setVendors).catch(() => setVendors([]));
  }, []);

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
          <input
            className="field pl-10"
            placeholder="Order number, customer name, phone or email..."
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
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          className="field w-auto"
          value={vendorId}
          onChange={(e) => {
            setVendorId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.storeName}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    Loading orders...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    No orders match those filters.
                  </td>
                </tr>
              )}
              {data?.items.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-ink-50/60" onClick={() => setOpenId(o.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink-900">{o.customer}</p>
                    {o.customerPhone && o.customerPhone !== o.customer && (
                      <p className="text-xs text-ink-300">{o.customerPhone}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{o.vendor}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">{paymentLabel(o)}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{formatMoney(o.amount)}</td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(o.createdAt)}</td>
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

      {openId && (
        <AdminOrderModal
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => void load()}
        />
      )}
    </div>
  );
}

function AdminOrderModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api<{ data: AdminOrderDetail }>(`/admin/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError((e as Error).message));
  }, [id]);

  async function act(path: string, body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ data: AdminOrderDetail }>(`/admin/orders/${id}/${path}`, {
        method: path === 'status' ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      setOrder(res.data);
      if (res.data.refundStatus === 'failed') {
        setNotice('Order cancelled, but the refund failed — retry it from the Razorpay dashboard.');
      } else if (res.data.refundStatus) {
        setNotice(`Order cancelled and refund ${res.data.refundStatus}.`);
      }
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const next = order ? NEXT[order.status] : undefined;

  return (
    <Modal onClose={onClose}>
      <div className="card space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{order?.orderNumber ?? 'Order'}</h2>
            {order && (
              <p className="text-sm text-ink-500">
                {order.customer.name}
                {order.customer.phone ? ` · ${order.customer.phone}` : ''} — sold by {order.vendor.storeName}
              </p>
            )}
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {notice && (
          <p className="rounded-lg border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-700">{notice}</p>
        )}
        {!order && !error && <p className="text-sm text-ink-500">Loading...</p>}

        {order && (
          <>
            <OrderBody order={order} />

            {order.payments.length > 0 && (
              <div className="text-sm">
                <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">Payments</p>
                <ul className="mt-1 space-y-1">
                  {order.payments.map((p) => (
                    <li key={p.id} className="text-ink-700">
                      {p.status} · {formatMoney(p.amount)}
                      {p.method ? ` · ${p.method}` : ''} ·{' '}
                      <span className="font-mono text-xs">{p.providerPaymentId ?? p.providerOrderId}</span>
                      {p.transferStatus ? ` · transfer ${p.transferStatus}` : ''}
                      {p.refunds.map((r) => (
                        <span key={r.id} className="block pl-4 text-xs text-ink-500">
                          Refund {formatMoney(r.amount)} — {r.status} ({formatDate(r.createdAt)})
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {order.shipment && (
              <div className="text-sm">
                <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">Shipment</p>
                <p className="mt-1 text-ink-700">
                  {order.shipment.status}
                  {order.shipment.awbNumber ? ` · AWB ${order.shipment.awbNumber}` : ' · AWB pending'}
                </p>
              </div>
            )}

            {cancelling ? (
              <ReasonForm
                label="Why is this order being cancelled?"
                confirmLabel="Cancel order"
                onCancel={() => setCancelling(false)}
                onSubmit={async (reason) => {
                  await act('cancel', { reason });
                  setCancelling(false);
                }}
              />
            ) : (
              <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 pt-4">
                {!['PLACED', 'PAYMENT_FAILED', 'CANCELLED'].includes(order.status) && (
                  <button
                    className="btn-ghost"
                    onClick={() =>
                      downloadPdf(`/admin/orders/${id}/invoice`, `invoice-${order.orderNumber}.pdf`).catch((e) =>
                        setError((e as Error).message),
                      )
                    }
                  >
                    Invoice PDF
                  </button>
                )}
                {CANCELLABLE.includes(order.status) && (
                  <button
                    className="btn-ghost text-red-600 hover:bg-red-50"
                    disabled={busy}
                    onClick={() => setCancelling(true)}
                  >
                    Cancel order
                  </button>
                )}
                {next && (
                  <button className="btn-primary" disabled={busy} onClick={() => act('status', { status: next })}>
                    {busy ? '...' : `Mark ${next.toLowerCase()}`}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
