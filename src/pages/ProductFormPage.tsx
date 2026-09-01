import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { IconPlus, IconTrash } from '../components/icons';
import { ApiError, api, imageSrc } from '../lib/api';
import { formatMoney } from '../lib/format';
import type { Category, Product, Spec } from '../lib/types';

interface FormState {
  name: string;
  sku: string;
  slug: string;
  category: string;
  tagline: string;
  description: string;
  unit: string;
  mrp: string;
  price: string;
  stockQty: string;
  imageUrl: string;
  features: string[];
  specs: Spec[];
  inStock: boolean;
  featured: boolean;
  active: boolean;
}

const EMPTY: FormState = {
  name: '',
  sku: '',
  slug: '',
  category: '',
  tagline: '',
  description: '',
  unit: 'piece',
  mrp: '',
  price: '',
  stockQty: '0',
  imageUrl: '',
  features: [],
  specs: [],
  inStock: true,
  featured: false,
  active: true,
};

const UNITS = ['piece', 'set', 'roll', 'pack', 'box', 'metre', 'kg', 'litre'];

/** Add and edit share one screen — the only difference is the request verb. */
export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existing, setExisting] = useState<Product | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data: Category[] }>('/admin/categories')
      .then((r) => {
        setCategories(r.data);
        setForm((f) => (f.category ? f : { ...f, category: r.data[0]?.id ?? '' }));
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (isNew) return;
    api<{ data: Product }>(`/admin/products/${id}`)
      .then((r) => {
        const p = r.data;
        setExisting(p);
        setForm({
          name: p.name,
          sku: p.sku,
          slug: p.slug,
          category: p.category,
          tagline: p.tagline,
          description: p.description,
          unit: p.unit,
          mrp: String(p.mrp),
          price: String(p.price),
          stockQty: String(p.stockQty),
          imageUrl: p.imageUrl ?? '',
          features: p.features,
          specs: p.specs,
          inStock: p.inStock,
          featured: p.featured,
          active: p.active,
        });
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const discount = useMemo(() => {
    const mrp = Number(form.mrp);
    const price = Number(form.price);
    if (!mrp || price >= mrp) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  }, [form.mrp, form.price]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      name: form.name.trim(),
      // Blank SKU on create means "derive one from the slug" (backend does it).
      ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
      ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
      category: form.category,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      unit: form.unit,
      mrp: Number(form.mrp),
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      imageUrl: form.imageUrl.trim() || null,
      features: form.features.map((f) => f.trim()).filter(Boolean),
      specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
      inStock: form.inStock,
      featured: form.featured,
      active: form.active,
    };

    try {
      if (isNew) {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await api(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
      navigate('/products');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.fields ?? {});
      } else {
        setError('Could not save the product.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-500">Loading product...</p>;

  const preview = form.imageUrl.trim() || (existing ? imageSrc(existing) : null);

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-ink-900">
            {isNew ? 'Add a product' : form.name}
          </h2>
          <p className="text-sm text-ink-500">
            {isNew
              ? 'It goes live in the mobile app as soon as you save it.'
              : existing?.source === 'seed'
                ? 'From the original IrriKart catalogue. Pricing, SKU and stock are editable.'
                : 'Added in this dashboard.'}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link to="/products" className="btn-ghost">
            Cancel
          </Link>
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-ink-900">Basics</h3>

            <Field label="Product name" error={fieldErrors.name}>
              <input
                className="field"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Hans Mini Micro Sprinkler"
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="SKU"
                error={fieldErrors.sku}
                hint={isNew ? 'Leave blank to auto-generate' : undefined}
              >
                <input
                  className="field font-mono"
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value.toUpperCase())}
                  placeholder="IK-HAN-MIN"
                />
              </Field>
              <Field label="Category" error={fieldErrors.category}>
                <select
                  className="field"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="URL slug"
              error={fieldErrors.slug}
              hint={isNew ? 'Leave blank to derive from the name' : undefined}
            >
              <input
                className="field font-mono"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="hans-mini"
              />
            </Field>

            <Field label="Tagline" error={fieldErrors.tagline}>
              <input
                className="field"
                value={form.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Compact micro sprinkler for close-spaced crops"
              />
            </Field>

            <Field label="Description" error={fieldErrors.description}>
              <textarea
                className="field min-h-28 resize-y"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What the product does, who it suits, how it installs."
              />
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-ink-900">Key features</h3>
            <ListEditor
              values={form.features}
              placeholder="Anti-clog arrow design"
              onChange={(features) => set('features', features)}
            />
          </section>

          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-ink-900">Specifications</h3>
            <p className="-mt-2 text-xs text-ink-500">
              Rendered as the spec table on the product page in the app.
            </p>
            <SpecEditor specs={form.specs} onChange={(specs) => set('specs', specs)} />
          </section>
        </div>

        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-ink-900">Pricing</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="MRP" error={fieldErrors.mrp}>
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={form.mrp}
                  onChange={(e) => set('mrp', e.target.value)}
                  required
                />
              </Field>
              <Field label="Selling price" error={fieldErrors.price}>
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  required
                />
              </Field>
            </div>
            <div className="rounded-lg bg-ink-50 px-3 py-2.5 text-sm">
              {discount > 0 ? (
                <p className="text-ink-700">
                  Customer sees{' '}
                  <span className="font-semibold text-ink-900">
                    {formatMoney(Number(form.price) || 0)}
                  </span>{' '}
                  <span className="text-brand-600">({discount}% off)</span>
                </p>
              ) : (
                <p className="text-ink-500">No discount shown at this price.</p>
              )}
            </div>
            <Field label="Pack unit">
              <select className="field" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </section>

          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-ink-900">Inventory &amp; visibility</h3>
            <Field label="Stock quantity" error={fieldErrors.stockQty}>
              <input
                className="field"
                type="number"
                min={0}
                value={form.stockQty}
                onChange={(e) => set('stockQty', e.target.value)}
              />
            </Field>
            <Toggle
              label="In stock"
              hint="Buyable in the app"
              checked={form.inStock}
              onChange={(v) => set('inStock', v)}
            />
            <Toggle
              label="Featured"
              hint="Leads the app home screen"
              checked={form.featured}
              onChange={(v) => set('featured', v)}
            />
            <Toggle
              label="Live"
              hint="Unchecked hides it from the app entirely"
              checked={form.active}
              onChange={(v) => set('active', v)}
            />
          </section>

          <section className="card space-y-4 p-5">
            <h3 className="text-sm font-bold text-ink-900">Image</h3>
            <Field
              label="Image URL"
              error={fieldErrors.imageUrl}
              hint="Direct link to a square product photo. Uploads land in a later phase."
            >
              <input
                className="field"
                type="url"
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <div className="aspect-square w-full overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-ink-300">
                  No image yet
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-300">{hint}</p>
      ) : null}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brand-500"
      />
      <span className="leading-tight">
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        <span className="block text-xs text-ink-300">{hint}</span>
      </span>
    </label>
  );
}

/** Repeating single-line inputs (feature bullets). */
function ListEditor({
  values,
  placeholder,
  onChange,
}: {
  values: string[];
  placeholder: string;
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      {values.map((value, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="field"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
          />
          <button
            type="button"
            className="btn-ghost px-3"
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            aria-label="Remove"
          >
            <IconTrash width={16} height={16} />
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={() => onChange([...values, ''])}>
        <IconPlus width={15} height={15} />
        Add feature
      </button>
    </div>
  );
}

function SpecEditor({
  specs,
  onChange,
}: {
  specs: Spec[];
  onChange: (v: Spec[]) => void;
}) {
  const update = (i: number, patch: Partial<Spec>) =>
    onChange(specs.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-2">
      {specs.map((spec, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="field sm:w-1/3"
            value={spec.label}
            placeholder="Flow Rate"
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <input
            className="field flex-1"
            value={spec.value}
            placeholder="2 - 8 LPH"
            onChange={(e) => update(i, { value: e.target.value })}
          />
          <button
            type="button"
            className="btn-ghost px-3"
            onClick={() => onChange(specs.filter((_, j) => j !== i))}
            aria-label="Remove"
          >
            <IconTrash width={16} height={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn-ghost"
        onClick={() => onChange([...specs, { label: '', value: '' }])}
      >
        <IconPlus width={15} height={15} />
        Add specification
      </button>
    </div>
  );
}
