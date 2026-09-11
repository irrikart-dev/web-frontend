import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { IconPlus, IconTrash } from '../components/icons';
import { Dropzone } from '../components/Dropzone';
import { Field, ListEditor, Toggle } from '../components/form';
import { ImageThumbnail } from '../components/ImageThumbnail';
import { ApiError, api, imageSrc, resolveAssetUrl, uploadImage } from '../lib/api';
import { getCategories } from '../lib/categories';
import type { Category, Product, Spec } from '../lib/types';

interface FormState {
  name: string;
  sku: string;
  category: string;
  tagline: string;
  description: string;
  unit: string;
  price: string;
  stockQty: string;
  imageUrl: string;
  features: string[];
  specs: Spec[];
  inStock: boolean;
  active: boolean;
}

const EMPTY: FormState = {
  name: '',
  sku: '',
  category: '',
  tagline: '',
  description: '',
  unit: 'piece',
  price: '',
  stockQty: '0',
  imageUrl: '',
  features: [],
  specs: [],
  inStock: true,
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Picking a file only swaps the local preview — it doesn't touch storage.
  // The file is uploaded once, on submit, so re-picking never orphans images.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function onFile(file: File) {
    setUploadError(null);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setImageFile(file);
  }

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    getCategories()
      .then((cats) => {
        setCategories(cats);
        setForm((f) => (f.category ? f : { ...f, category: cats[0]?.id ?? '' }));
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
          category: p.category,
          tagline: p.tagline,
          description: p.description,
          unit: p.unit,
          price: String(p.price),
          stockQty: String(p.stockQty),
          imageUrl: p.imageUrl ?? '',
          features: p.features,
          specs: p.specs,
          inStock: p.inStock,
          active: p.active,
        });
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    let imageUrl = form.imageUrl.trim() || null;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (err) {
        setUploadError(err instanceof ApiError ? err.message : 'Upload failed.');
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload = {
      name: form.name.trim(),
      // Blank SKU means "derive one from the name" — the backend does it, and the
      // URL slug is always auto-derived from the name too, never user-set.
      ...(form.sku.trim() ? { sku: form.sku.trim() } : {}),
      category: form.category,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      unit: form.unit,
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      imageUrl,
      features: form.features.map((f) => f.trim()).filter(Boolean),
      specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
      inStock: form.inStock,
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
        const fieldErrors = err.details?.fieldErrors ?? {};
        setFieldErrors(
          Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0] ?? ''])),
        );
      } else {
        setError('Could not save the product.');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-500">Loading product...</p>;

  const preview =
    imagePreview || resolveAssetUrl(form.imageUrl.trim()) || (existing ? imageSrc(existing) : null);

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

            <Field label="Product name" error={fieldErrors.name} required>
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
              <Field label="Category" error={fieldErrors.category} required>
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
              addLabel="Add feature"
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
            <Field label="Selling price" error={fieldErrors.price} required>
              <input
                className="field"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                required
              />
            </Field>
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
              label="Live"
              hint="Unchecked hides it from the app entirely"
              checked={form.active}
              onChange={(v) => set('active', v)}
            />
          </section>

          <section className="card space-y-3 p-5">
            <h3 className="text-sm font-bold text-ink-900">Image</h3>
            <ImageThumbnail src={preview} />
            <Dropzone uploading={uploading} onFile={onFile} />
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {fieldErrors.imageUrl && <p className="text-xs text-red-600">{fieldErrors.imageUrl}</p>}
          </section>
        </div>
      </div>
    </form>
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
