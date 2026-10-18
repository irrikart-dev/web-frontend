import { useEffect, useState, type FormEvent } from 'react';

import { Field } from '../components/form';
import { IconPlus, IconTrash } from '../components/icons';
import { ApiError, api } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { CourierRate, ShippingRules } from '../lib/types';

export function SettingsPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <ShippingRulesCard />
      <CourierRatesCard />
    </div>
  );
}

type Slab = { upToKg: string; fee: string };

/** What customers pay for delivery. Applies to orders placed after saving. */
function ShippingRulesCard() {
  const [freeAbove, setFreeAbove] = useState('');
  const [slabs, setSlabs] = useState<Slab[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ data: ShippingRules }>('/admin/settings/shipping')
      .then(({ data }) => {
        setFreeAbove(data.freeShippingAbove == null ? '' : String(data.freeShippingAbove));
        setSlabs(data.shippingSlabs.map((s) => ({ upToKg: String(s.upToKg), fee: String(s.fee) })));
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const setSlab = (i: number, patch: Partial<Slab>) =>
    setSlabs((rows) => rows?.map((r, j) => (j === i ? { ...r, ...patch } : r)) ?? null);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!slabs) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { data } = await api<{ data: ShippingRules }>('/admin/settings/shipping', {
        method: 'PUT',
        body: JSON.stringify({
          freeShippingAbove: freeAbove.trim() === '' ? null : Number(freeAbove),
          shippingSlabs: slabs
            .filter((s) => s.upToKg.trim() && s.fee.trim())
            .map((s) => ({ upToKg: Number(s.upToKg), fee: Number(s.fee) })),
        }),
      });
      setSlabs(data.shippingSlabs.map((s) => ({ upToKg: String(s.upToKg), fee: String(s.fee) })));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the delivery rules.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card h-fit space-y-4 p-5">
      <div>
        <h3 className="text-sm font-bold text-ink-900">Delivery charges</h3>
        <p className="mt-1 text-xs text-ink-500">
          Charged at checkout by the cart's total weight. No slabs means delivery is free. Changes apply to orders
          placed after you save. The delivery fee is the platform's — sellers' commission is worked out on the goods only.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">Saved.</p>}
      {!slabs && !error && <p className="text-sm text-ink-500">Loading...</p>}

      {slabs && (
        <>
          <Field label="Free delivery on orders from (₹)" hint="Order value after coupon. Blank = never free.">
            <input className="field" type="number" min={0} step={1} value={freeAbove} onChange={(e) => setFreeAbove(e.target.value)} />
          </Field>

          <div>
            <label className="label">Weight slabs</label>
            <div className="space-y-2">
              {slabs.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-16 shrink-0 text-ink-500">Up to</span>
                  <input
                    className="field"
                    type="number"
                    min={0.1}
                    step="0.1"
                    value={s.upToKg}
                    onChange={(e) => setSlab(i, { upToKg: e.target.value })}
                    aria-label="Up to kg"
                  />
                  <span className="shrink-0 text-ink-500">kg →</span>
                  <input
                    className="field"
                    type="number"
                    min={0}
                    step={1}
                    value={s.fee}
                    onChange={(e) => setSlab(i, { fee: e.target.value })}
                    aria-label="Fee in rupees"
                  />
                  <span className="shrink-0 text-ink-500">₹</span>
                  <button
                    type="button"
                    className="btn-ghost px-3"
                    onClick={() => setSlabs((rows) => rows?.filter((_, j) => j !== i) ?? null)}
                    aria-label="Remove slab"
                  >
                    <IconTrash width={16} height={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn-ghost" onClick={() => setSlabs((rows) => [...(rows ?? []), { upToKg: '', fee: '' }])}>
                <IconPlus width={15} height={15} />
                Add slab
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-300">Parcels heavier than every slab pay the heaviest slab's fee.</p>
          </div>

          <div className="flex justify-end">
            <button className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save delivery charges'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

/** What Shiprocket couriers would charge the platform for a parcel — to set slabs sensibly. */
function CourierRatesCard() {
  const [pincode, setPincode] = useState('');
  const [weight, setWeight] = useState('1');
  const [cod, setCod] = useState(false);
  const [rates, setRates] = useState<CourierRate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pincode: pincode.trim(), weightKg: weight || '0.5', cod: String(cod) });
      setRates((await api<{ data: CourierRate[] }>(`/admin/shipments/rates?${params}`)).data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Rate check failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card h-fit space-y-4 p-5">
      <div>
        <h3 className="text-sm font-bold text-ink-900">Courier rates</h3>
        <p className="mt-1 text-xs text-ink-500">What it costs to ship a parcel from the pickup location, cheapest first.</p>
      </div>
      <form onSubmit={check} className="flex flex-wrap items-end gap-2">
        <div className="w-32">
          <label className="label">Pincode</label>
          <input
            className="field"
            inputMode="numeric"
            pattern="[1-9][0-9]{5}"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            required
          />
        </div>
        <div className="w-24">
          <label className="label">Kg</label>
          <input className="field" type="number" min={0.1} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 pb-2.5 text-sm text-ink-700">
          <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={cod} onChange={(e) => setCod(e.target.checked)} />
          COD
        </label>
        <button className="btn-primary ml-auto" disabled={busy}>
          {busy ? 'Checking...' : 'Check'}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {rates?.length === 0 && <p className="text-sm text-ink-500">No courier delivers to that pincode.</p>}
      {rates && rates.length > 0 && (
        <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100 text-sm">
          {rates.map((r) => (
            <li key={r.courierId} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">
                  {r.name}
                  {r.recommended && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] text-brand-700">Recommended</span>}
                </p>
                <p className="text-xs text-ink-300">
                  {r.estimatedDays ? `${r.estimatedDays} days` : 'ETA unknown'}
                  {r.estimatedDelivery ? ` · by ${r.estimatedDelivery}` : ''}
                  {r.cod ? ' · COD' : ''}
                </p>
              </div>
              <span className="font-semibold text-ink-900">{formatMoney(r.rate)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
