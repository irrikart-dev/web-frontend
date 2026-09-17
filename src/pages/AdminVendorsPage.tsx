import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { IconPlus } from '../components/icons';
import { Field } from '../components/form';
import { Modal } from '../components/Modal';
import { ApiError, api } from '../lib/api';
import { getVendors, invalidateVendors } from '../lib/vendors';
import type { Vendor } from '../lib/types';

interface FormState {
  storeName: string;
  ownerEmail: string;
  commissionPercent: string;
  legalBusinessName: string;
  contactEmail: string;
  contactPhone: string;
  razorpayAccountId: string;
}

const EMPTY: FormState = {
  storeName: '',
  ownerEmail: '',
  commissionPercent: '10',
  legalBusinessName: '',
  contactEmail: '',
  contactPhone: '',
  razorpayAccountId: '',
};

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      invalidateVendors();
      setVendors(await getVendors());
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

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  async function toggleStatus(vendor: Vendor) {
    try {
      const res = await api<{ data: Vendor }>(`/admin/vendors/${vendor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: vendor.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }),
      });
      invalidateVendors();
      setVendors((rows) => rows.map((r) => (r.id === vendor.id ? res.data : r)));
    } catch (e) {
      flash(e instanceof ApiError ? e.message : 'Could not update vendor.');
    }
  }

  async function refreshRouteStatus(vendor: Vendor) {
    try {
      const res = await api<{ data: Vendor }>(`/admin/vendors/${vendor.id}/route-status/refresh`, {
        method: 'POST',
      });
      invalidateVendors();
      setVendors((rows) => rows.map((r) => (r.id === vendor.id ? res.data : r)));
      flash(`Route status: ${res.data.routeStatus ?? 'unknown'}`);
    } catch (e) {
      flash(e instanceof ApiError ? e.message : 'Could not refresh Razorpay status.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <p className="text-sm text-ink-500">
          Vendors sell their own products through this storefront. Each one settles through
          their own Razorpay linked account.
        </p>
        <button className="btn-primary ml-auto" onClick={() => setEditingId('new')}>
          <IconPlus width={16} height={16} />
          Add vendor
        </button>
      </div>

      {toast && (
        <p className="rounded-lg border border-ink-100 bg-white px-4 py-2.5 text-sm text-ink-700 shadow-sm">
          {toast}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {editingId && (
        <Modal onClose={() => setEditingId(null)}>
          <VendorForm
            key={editingId}
            vendor={editingId === 'new' ? null : (vendors.find((v) => v.id === editingId) ?? null)}
            onClose={() => setEditingId(null)}
            onSaved={(saved) => {
              invalidateVendors();
              setVendors((rows) =>
                rows.some((r) => r.id === saved.id)
                  ? rows.map((r) => (r.id === saved.id ? saved : r))
                  : [saved, ...rows],
              );
              setEditingId(null);
              flash(editingId === 'new' ? `Added ${saved.storeName}` : `Saved ${saved.storeName}`);
            }}
          />
        </Modal>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Razorpay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    Loading vendors...
                  </td>
                </tr>
              )}
              {!loading && vendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    No vendors yet.
                  </td>
                </tr>
              )}
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-ink-50/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900">{v.storeName}</p>
                    <p className="text-xs text-ink-300">{v.contactEmail ?? v.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{v.commissionPercent}%</td>
                  <td className="px-4 py-3">
                    {v.razorpayAccountId ? (
                      <button
                        onClick={() => refreshRouteStatus(v)}
                        className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-100/70"
                        title="Re-check Razorpay activation status"
                      >
                        {v.routeStatus ?? 'unknown'}
                      </button>
                    ) : (
                      <span className="text-xs text-ink-300">not linked</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(v)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                        v.status === 'ACTIVE'
                          ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                          : 'bg-ink-100 text-ink-500 hover:bg-ink-100/70'
                      }`}
                    >
                      {v.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditingId(v.id)} className="btn-ghost px-3 py-1.5 text-xs">
                      Edit
                    </button>
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

function VendorForm({
  vendor,
  onClose,
  onSaved,
}: {
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: (v: Vendor) => void;
}) {
  const [form, setForm] = useState<FormState>(
    vendor
      ? {
          storeName: vendor.storeName,
          ownerEmail: '',
          commissionPercent: String(vendor.commissionPercent),
          legalBusinessName: vendor.legalBusinessName ?? '',
          contactEmail: vendor.contactEmail ?? '',
          contactPhone: vendor.contactPhone ?? '',
          razorpayAccountId: vendor.razorpayAccountId ?? '',
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = vendor
        ? await api<{ data: Vendor }>(`/admin/vendors/${vendor.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              storeName: form.storeName.trim(),
              commissionPercent: Number(form.commissionPercent),
              legalBusinessName: form.legalBusinessName.trim() || undefined,
              contactEmail: form.contactEmail.trim() || undefined,
              contactPhone: form.contactPhone.trim() || undefined,
              razorpayAccountId: form.razorpayAccountId.trim() || null,
            }),
          })
        : await api<{ data: Vendor }>('/admin/vendors', {
            method: 'POST',
            body: JSON.stringify({
              storeName: form.storeName.trim(),
              ownerEmail: form.ownerEmail.trim(),
              commissionPercent: Number(form.commissionPercent),
              legalBusinessName: form.legalBusinessName.trim() || undefined,
              contactEmail: form.contactEmail.trim() || undefined,
              contactPhone: form.contactPhone.trim() || undefined,
              razorpayAccountId: form.razorpayAccountId.trim(),
            }),
          });
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the vendor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h3 className="text-sm font-bold text-ink-900">{vendor ? `Edit ${vendor.storeName}` : 'New vendor'}</h3>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Field label="Store name" required>
        <input
          className="field"
          value={form.storeName}
          onChange={(e) => set('storeName', e.target.value)}
          required
        />
      </Field>

      {!vendor && (
        <Field
          label="Owner email"
          required
          hint="The vendor must have signed in at least once before being added here."
        >
          <input
            className="field"
            type="email"
            value={form.ownerEmail}
            onChange={(e) => set('ownerEmail', e.target.value)}
            required
          />
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Commission %" required>
          <input
            className="field"
            type="number"
            min={0}
            max={100}
            step="0.01"
            value={form.commissionPercent}
            onChange={(e) => set('commissionPercent', e.target.value)}
            required
          />
        </Field>
        <Field label="Legal business name">
          <input
            className="field"
            value={form.legalBusinessName}
            onChange={(e) => set('legalBusinessName', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact email">
          <input
            className="field"
            type="email"
            value={form.contactEmail}
            onChange={(e) => set('contactEmail', e.target.value)}
          />
        </Field>
        <Field label="Contact phone">
          <input
            className="field"
            value={form.contactPhone}
            onChange={(e) => set('contactPhone', e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Razorpay linked account id"
        required={!vendor}
        hint="Created directly with Razorpay (Route) — pasted here, never created by this app. Verified against Razorpay when saved. Required — a vendor can't be paid out without one."
      >
        <input
          className="field font-mono"
          value={form.razorpayAccountId}
          onChange={(e) => set('razorpayAccountId', e.target.value)}
          placeholder="acc_XXXXXXXXXXXXXX"
          required={!vendor}
        />
      </Field>

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
