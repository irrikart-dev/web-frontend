import { useState } from 'react';

import { API_BASE, resolveAssetUrl } from '../lib/api';
import { firebaseAuth } from '../lib/firebase';
import { formatDate, formatMoney } from '../lib/format';
import type { OrderDetail, OrderStatus } from '../lib/types';

const STATUS_STYLE: Record<OrderStatus, string> = {
  PLACED: 'bg-amber-50 text-amber-700',
  PAYMENT_FAILED: 'bg-red-50 text-red-600',
  CONFIRMED: 'bg-sky-50 text-sky-700',
  PACKED: 'bg-indigo-50 text-indigo-700',
  SHIPPED: 'bg-violet-50 text-violet-700',
  DELIVERED: 'bg-brand-50 text-brand-700',
  CANCELLED: 'bg-red-50 text-red-600',
  RETURNED: 'bg-ink-100 text-ink-700',
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Awaiting payment',
  PAYMENT_FAILED: 'Payment failed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** "COD" / "Paid" / "Payment failed" / "Awaiting payment" — what money state the order is in. */
export function paymentLabel(o: { paymentMethod: 'ONLINE' | 'COD'; paymentStatus: string | null }) {
  if (o.paymentMethod === 'COD') return 'Cash on delivery';
  if (o.paymentStatus === 'CAPTURED') return 'Paid online';
  if (o.paymentStatus === 'FAILED') return 'Payment failed';
  return 'Awaiting payment';
}

/** Items, totals, address and cancellation note — the body both admin and vendor order modals share. */
export function OrderBody({ order }: { order: OrderDetail }) {
  const a = order.address;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <OrderStatusBadge status={order.status} />
        <span className="text-ink-500">{paymentLabel(order)}</span>
        <span className="text-ink-300">·</span>
        <span className="text-ink-500">Placed {formatDate(order.createdAt)}</span>
        {order.acceptedAt && <span className="text-ink-500">· Accepted by seller</span>}
      </div>

      {order.status === 'PAYMENT_FAILED' && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          The customer's last payment attempt failed. Stock stays reserved while they retry; the order
          cancels itself if it isn't paid in time.
        </p>
      )}

      {order.status === 'CANCELLED' && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Cancelled by {order.cancelledBy ?? 'unknown'}
          {order.cancelledAt ? ` on ${formatDate(order.cancelledAt)}` : ''}
          {order.cancelReason ? ` — “${order.cancelReason}”` : ''}
        </p>
      )}

      <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
        {order.items.map((item) => {
          const src = resolveAssetUrl(item.image);
          return (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-ink-100 bg-white">
                {src && <img src={src} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{item.name}</p>
                <p className="text-xs text-ink-300">
                  {item.sku} · {item.quantity} × {formatMoney(item.unitPrice)}
                </p>
              </div>
              <span className="font-semibold text-ink-900">{formatMoney(item.totalPrice)}</span>
            </li>
          );
        })}
      </ul>

      <dl className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-500">Subtotal</dt>
          <dd>{formatMoney(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-500">Discount</dt>
            <dd>− {formatMoney(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between font-bold text-ink-900">
          <dt>Total</dt>
          <dd>{formatMoney(order.amount)}</dd>
        </div>
        <div className="flex justify-between text-xs text-ink-500">
          <dt>Seller share / commission</dt>
          <dd>
            {formatMoney(order.vendorAmount)} / {formatMoney(order.platformAmount)}
          </dd>
        </div>
      </dl>

      {a && (
        <div className="text-sm">
          <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">Ship to</p>
          <p className="mt-1 text-ink-900">
            {a.name} · {a.phone}
          </p>
          <p className="text-ink-700">
            {[a.line1, a.line2].filter(Boolean).join(', ')}, {a.city}, {a.state} {a.pincode}
          </p>
        </div>
      )}
    </div>
  );
}

/** Asks for a cancellation/rejection reason inline (no browser prompt()). */
export function ReasonForm({
  label,
  confirmLabel,
  onSubmit,
  onCancel,
}: {
  label: string;
  confirmLabel: string;
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit(reason.trim());
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="label">{label}</label>
      <input
        className="field"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Shown to the customer"
        minLength={3}
        required
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Back
        </button>
        <button className="btn-primary bg-red-600 hover:bg-red-700" disabled={busy || reason.trim().length < 3}>
          {busy ? '...' : confirmLabel}
        </button>
      </div>
    </form>
  );
}

/** Downloads a PDF from an authenticated endpoint (a plain link can't send the bearer token). */
export async function downloadPdf(path: string, filename: string) {
  const token = await firebaseAuth.currentUser?.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { message?: string });
    throw new Error((body as { message?: string }).message ?? 'Download failed');
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
