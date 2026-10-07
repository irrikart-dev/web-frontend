import { useCallback, useEffect, useState } from 'react';

import { Modal } from '../components/Modal';
import { OrderBody, OrderStatusBadge, ReasonForm, paymentLabel } from '../components/OrderParts';
import { api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { OrderDetail, OrderSummary } from '../lib/types';

export function VendorOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ data: OrderSummary[] }>('/vendor/orders')
      .then((r) => setOrders(r.data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const needsAction = orders.filter((o) => o.status === 'CONFIRMED' && !o.accepted).length;

  return (
    <div className="space-y-5">
      {needsAction > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {needsAction} new order{needsAction > 1 ? 's' : ''} waiting for you to accept or reject.
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    No orders yet — they'll show up here as customers buy your products.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-ink-50/60" onClick={() => setOpenId(o.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-ink-700">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      {o.status === 'CONFIRMED' && !o.accepted && (
                        <span className="text-xs font-semibold text-amber-700">Needs action</span>
                      )}
                    </div>
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

      {openId && <VendorOrderModal id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

function VendorOrderModal({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    api<{ data: OrderDetail }>(`/vendor/orders/${id}`)
      .then((r) => setOrder(r.data))
      .catch((e) => setError((e as Error).message));
  }, [id]);

  async function act(path: string, method: 'POST' | 'PATCH', body?: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ data: OrderDetail }>(`/vendor/orders/${id}/${path}`, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      setOrder(res.data);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isNew = order?.status === 'CONFIRMED' && !order.acceptedAt;

  return (
    <Modal onClose={onClose}>
      <div className="card space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-ink-900">{order?.orderNumber ?? 'Order'}</h2>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {!order && !error && <p className="text-sm text-ink-500">Loading...</p>}

        {order && (
          <>
            <OrderBody order={order} />

            {rejecting ? (
              <ReasonForm
                label="Why can't you fulfil this order? The customer is refunded in full."
                confirmLabel="Reject order"
                onCancel={() => setRejecting(false)}
                onSubmit={async (reason) => {
                  await act('reject', 'POST', { reason });
                  setRejecting(false);
                }}
              />
            ) : (
              <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 pt-4">
                {isNew && (
                  <>
                    <button
                      className="btn-ghost text-red-600 hover:bg-red-50"
                      disabled={busy}
                      onClick={() => setRejecting(true)}
                    >
                      Reject
                    </button>
                    <button className="btn-primary" disabled={busy} onClick={() => act('accept', 'POST')}>
                      Accept order
                    </button>
                  </>
                )}
                {order.status === 'CONFIRMED' && order.acceptedAt && (
                  <button
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => act('status', 'PATCH', { status: 'PACKED' })}
                  >
                    Mark packed
                  </button>
                )}
                {order.status === 'PACKED' && (
                  <button
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => act('status', 'PATCH', { status: 'SHIPPED' })}
                  >
                    Mark shipped
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
