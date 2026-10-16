import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { Field, Toggle } from '../components/form';
import { IconPlus } from '../components/icons';
import { Modal } from '../components/Modal';
import { ApiError, api } from '../lib/api';
import { formatDate, formatMoney } from '../lib/format';
import type { Coupon } from '../lib/types';

interface FormState {
  code: string;
  type: Coupon['type'];
  value: string;
  minCartValue: string;
  usageLimit: string;
  perUserLimit: string;
  expiresAt: string;
  active: boolean;
}

const EMPTY: FormState = {
  code: '',
  type: 'PERCENT',
  value: '',
  minCartValue: '',
  usageLimit: '',
  perUserLimit: '1',
  expiresAt: '',
  active: true,
};

const discountLabel = (c: Coupon) => (c.type === 'PERCENT' ? `${c.value}% off` : `${formatMoney(c.value)} off`);
const isExpired = (c: Coupon) => !!c.expiresAt && new Date(c.expiresAt) < new Date();

export function PromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  const load = useCallback(async () => {
    try {
      setCoupons((await api<{ data: Coupon[] }>('/admin/coupons')).data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const toggleActive = (c: Coupon) =>
    run(() => api(`/admin/coupons/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active: !c.active }) }));

  function remove(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    void run(() => api(`/admin/coupons/${c.id}`, { method: 'DELETE' }));
  }

  const totals = coupons.reduce(
    (t, c) => ({ uses: t.uses + c.uses, discount: t.discount + c.discountGiven, revenue: t.revenue + c.revenue }),
    { uses: 0, discount: 0, revenue: 0 },
  );
  const tiles = [
    { label: 'Live coupons', value: String(coupons.filter((c) => c.active && !isExpired(c)).length) },
    { label: 'Redemptions', value: String(totals.uses) },
    { label: 'Discount given', value: formatMoney(totals.discount) },
    { label: 'Revenue with coupons', value: formatMoney(totals.revenue) },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">{t.label}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900">{t.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm text-ink-500">
          Coupon codes customers enter at checkout. A used coupon can't be deleted — switch it off instead.
        </p>
        <button className="btn-primary ml-auto" onClick={() => setEditingId('new')}>
          <IconPlus width={16} height={16} />
          New coupon
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {editingId && (
        <Modal onClose={() => setEditingId(null)}>
          <CouponForm
            key={editingId}
            coupon={editingId === 'new' ? null : (coupons.find((c) => c.id === editingId) ?? null)}
            onClose={() => setEditingId(null)}
            onSaved={() => {
              setEditingId(null);
              void load();
            }}
          />
        </Modal>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Rules</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Discount given</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    Loading coupons...
                  </td>
                </tr>
              )}
              {!loading && coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    No coupons yet.
                  </td>
                </tr>
              )}
              {coupons.map((c) => (
                <tr key={c.id} className="align-top hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-ink-900">{c.code}</p>
                    <p className="text-xs text-ink-500">{discountLabel(c)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {c.minCartValue != null && <p>Min cart {formatMoney(c.minCartValue)}</p>}
                    {c.perUserLimit != null && <p>{c.perUserLimit} per customer</p>}
                    <p>{c.expiresAt ? `${isExpired(c) ? 'Expired' : 'Expires'} ${formatDate(c.expiresAt)}` : 'No expiry'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {c.uses}
                    {c.usageLimit != null && <span className="text-ink-300"> / {c.usageLimit}</span>}
                    <p className="text-xs text-ink-300">{c.uniqueCustomers} customers</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{formatMoney(c.discountGiven)}</td>
                  <td className="px-4 py-3 text-ink-700">{formatMoney(c.revenue)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        c.active ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' : 'bg-ink-100 text-ink-500 hover:bg-ink-100/70'
                      }`}
                    >
                      {c.active ? 'Active' : 'Off'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditingId(c.id)} className="btn-ghost px-3 py-1.5 text-xs">
                      Edit
                    </button>
                    {c.uses === 0 && (
                      <button onClick={() => remove(c)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CouponForm({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(
    coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: String(coupon.value),
          minCartValue: coupon.minCartValue == null ? '' : String(coupon.minCartValue),
          usageLimit: coupon.usageLimit == null ? '' : String(coupon.usageLimit),
          perUserLimit: coupon.perUserLimit == null ? '' : String(coupon.perUserLimit),
          expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
          active: coupon.active,
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      code: form.code.trim(),
      type: form.type,
      value: Number(form.value),
      minCartValue: num(form.minCartValue),
      usageLimit: num(form.usageLimit),
      perUserLimit: num(form.perUserLimit),
      // valid through the end of the chosen day, local time
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      active: form.active,
    };
    try {
      await api(coupon ? `/admin/coupons/${coupon.id}` : '/admin/coupons', {
        method: coupon ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the coupon.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h3 className="text-sm font-bold text-ink-900">{coupon ? `Edit ${coupon.code}` : 'New coupon'}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Code" required hint="Stored upper-case.">
          <input
            className="field font-mono uppercase"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            pattern="[A-Za-z0-9_\-]{3,32}"
            required
          />
        </Field>
        <Field label="Type" required>
          <select className="field" value={form.type} onChange={(e) => set('type', e.target.value as Coupon['type'])}>
            <option value="PERCENT">Percent off</option>
            <option value="FLAT">Flat ₹ off</option>
          </select>
        </Field>
        <Field label={form.type === 'PERCENT' ? 'Percent' : 'Amount (₹)'} required>
          <input
            className="field"
            type="number"
            min={1}
            max={form.type === 'PERCENT' ? 100 : undefined}
            step="0.01"
            value={form.value}
            onChange={(e) => set('value', e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Minimum cart value (₹)" hint="Blank = no minimum.">
          <input className="field" type="number" min={0} value={form.minCartValue} onChange={(e) => set('minCartValue', e.target.value)} />
        </Field>
        <Field label="Expires on" hint="Blank = never.">
          <input className="field" type="date" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
        </Field>
        <Field label="Total uses allowed" hint="Blank = unlimited.">
          <input className="field" type="number" min={1} step={1} value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
        </Field>
        <Field label="Uses per customer" hint="1 = one-time per customer. Blank = unlimited.">
          <input className="field" type="number" min={1} step={1} value={form.perUserLimit} onChange={(e) => set('perUserLimit', e.target.value)} />
        </Field>
      </div>

      <Toggle
        label="Active"
        hint="Customers can only apply active, unexpired coupons."
        checked={form.active}
        onChange={(v) => set('active', v)}
      />

      <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
