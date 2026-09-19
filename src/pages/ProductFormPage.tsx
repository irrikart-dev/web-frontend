import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { IconPlus, IconTrash } from '../components/icons';
import { Dropzone } from '../components/Dropzone';
import { Field, ListEditor, Toggle } from '../components/form';
import { ImageThumbnail } from '../components/ImageThumbnail';
import { ApiError, api, imageSrc, resolveAssetUrl, uploadImage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getCategories } from '../lib/categories';
import { getVendors } from '../lib/vendors';
import type { Category, GalleryImage, Product, ProductVariant, Spec, Vendor } from '../lib/types';

interface FormState {
  name: string;
  sku: string;
  category: string;
  // admin-only: which vendor this product is created under. Ignored on update (no
  // vendor reassignment) and never shown/sent for a VENDOR-role caller — the backend
  // pins that to their own vendor id regardless.
  vendorId: string;
  tagline: string;
  description: string;
  unit: string;
  price: string;
  stockQty: string;
  imageUrl: string;
  videoUrl: string;
  features: string[];
  specs: Spec[];
  inStock: boolean;
  active: boolean;
}

const EMPTY: FormState = {
  name: '',
  sku: '',
  category: '',
  vendorId: '',
  tagline: '',
  description: '',
  unit: 'piece',
  price: '',
  stockQty: '0',
  imageUrl: '',
  videoUrl: '',
  features: [],
  specs: [],
  inStock: true,
  active: true,
};

const UNITS = ['piece', 'set', 'roll', 'pack', 'box', 'metre', 'kg', 'litre'];

/** Add and edit share one screen — the only difference is the request verb. Also
 * shared between the admin's Product Catalog and a vendor's My Products, just against
 * a different API base (see `base` below). */
export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role !== 'VENDOR';
  const base = isAdmin ? '/admin' : '/vendor';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
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

  // vendor picker is admin-only, and only matters on create (no vendor reassignment)
  useEffect(() => {
    if (!isAdmin || !isNew) return;
    getVendors()
      .then((v) => {
        setVendors(v);
        setForm((f) => (f.vendorId ? f : { ...f, vendorId: v[0]?.id ?? '' }));
      })
      .catch((e) => setError((e as Error).message));
  }, [isAdmin, isNew]);

  useEffect(() => {
    if (isNew) return;
    api<{ data: Product }>(`${base}/products/${id}`)
      .then((r) => {
        const p = r.data;
        setExisting(p);
        setForm({
          name: p.name,
          sku: p.sku,
          category: p.category,
          vendorId: p.vendorId,
          tagline: p.tagline,
          description: p.description,
          unit: p.unit,
          price: String(p.price),
          stockQty: String(p.stockQty),
          imageUrl: p.imageUrl ?? '',
          videoUrl: p.videoUrl ?? '',
          features: p.features,
          specs: p.specs,
          inStock: p.inStock,
          active: p.active,
        });
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [id, isNew, base]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Gallery images and variants save immediately on their own actions rather
  // than waiting for the main form submit — each is a standalone admin
  // endpoint, and re-pulling the product after every mutation keeps the
  // lists (and their server-assigned ids) in sync without re-deriving state.
  // Admin-only: there's no vendor-scoped gallery/variant API yet (vendors.routes.js
  // only has plain product CRUD), so a vendor caller never sees these sections.
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [variantError, setVariantError] = useState<string | null>(null);

  async function reloadExisting() {
    if (isNew) return;
    const r = await api<{ data: Product }>(`/admin/products/${id}`);
    setExisting(r.data);
  }

  async function addGalleryImage(url: string) {
    if (!id || !url.trim()) return;
    setGalleryError(null);
    try {
      await api(`/admin/products/${id}/images`, {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      });
      await reloadExisting();
    } catch (e) {
      setGalleryError(e instanceof ApiError ? e.message : 'Could not add that image.');
    }
  }

  async function removeGalleryImage(imageId: string) {
    if (!id) return;
    setGalleryError(null);
    try {
      await api(`/admin/products/${id}/images/${imageId}`, { method: 'DELETE' });
      await reloadExisting();
    } catch (e) {
      setGalleryError(e instanceof ApiError ? e.message : 'Could not remove that image.');
    }
  }

  async function addVariant(input: {
    size: string;
    unit: string;
    price: string;
    stockQty: string;
  }) {
    if (!id) return;
    setVariantError(null);
    try {
      await api(`/admin/products/${id}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          size: input.size.trim() || undefined,
          unit: input.unit,
          price: Number(input.price),
          stockQty: Number(input.stockQty) || 0,
        }),
      });
      await reloadExisting();
    } catch (e) {
      setVariantError(e instanceof ApiError ? e.message : 'Could not add that variant.');
    }
  }

  async function saveVariant(variantId: string, patch: Partial<ProductVariant>) {
    if (!id) return;
    setVariantError(null);
    try {
      await api(`/admin/products/${id}/variants/${variantId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await reloadExisting();
    } catch (e) {
      setVariantError(e instanceof ApiError ? e.message : 'Could not save that variant.');
    }
  }

  async function deleteVariant(variantId: string) {
    if (!id) return;
    setVariantError(null);
    try {
      await api(`/admin/products/${id}/variants/${variantId}`, { method: 'DELETE' });
      await reloadExisting();
    } catch (e) {
      setVariantError(e instanceof ApiError ? e.message : 'Could not delete that variant.');
    }
  }

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
      // vendorId only makes sense for admin's create request — a vendor's own create
      // endpoint doesn't accept it at all, it's pinned server-side to their own vendor
      ...(isAdmin && isNew ? { vendorId: form.vendorId } : {}),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      unit: form.unit,
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      imageUrl,
      videoUrl: form.videoUrl.trim() || null,
      features: form.features.map((f) => f.trim()).filter(Boolean),
      specs: form.specs.filter((s) => s.label.trim() && s.value.trim()),
      inStock: form.inStock,
      active: form.active,
    };

    try {
      if (isNew) {
        await api(`${base}/products`, { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await api(`${base}/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
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

            {isAdmin &&
              (isNew ? (
                <Field label="Vendor" error={fieldErrors.vendorId} required>
                  <select
                    className="field"
                    value={form.vendorId}
                    onChange={(e) => set('vendorId', e.target.value)}
                    required
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.storeName}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                existing?.vendor && (
                  <p className="text-xs text-ink-300">Sold by {existing.vendor.storeName}</p>
                )
              ))}

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
            <Field
              label="Demo video (YouTube URL)"
              error={fieldErrors.videoUrl}
              hint="Shown as a 'Watch video' chip on the product page."
            >
              <input
                className="field"
                type="url"
                value={form.videoUrl}
                onChange={(e) => set('videoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </Field>
          </section>

          {isAdmin && !isNew && existing && (
            <GallerySection
              images={existing.galleryImages}
              error={galleryError}
              onAdd={addGalleryImage}
              onRemove={removeGalleryImage}
            />
          )}

          {isAdmin && !isNew && existing && (
            <VariantsSection
              variants={existing.variants}
              units={UNITS}
              error={variantError}
              onAdd={addVariant}
              onSave={saveVariant}
              onDelete={deleteVariant}
            />
          )}
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

/** Extra product photos beyond the primary image — the PDP gallery reads all of these. */
function GallerySection({
  images,
  error,
  onAdd,
  onRemove,
}: {
  images: GalleryImage[];
  error: string | null;
  onAdd: (url: string) => Promise<void>;
  onRemove: (imageId: string) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <section className="card space-y-4 p-5">
      <h3 className="text-sm font-bold text-ink-900">Gallery</h3>
      <p className="-mt-2 text-xs text-ink-500">
        Extra angles and in-use shots for the product page's swipeable gallery.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-2">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-ink-100">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(img.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Remove image"
            >
              <IconTrash width={14} height={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="field"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
        <button
          type="button"
          className="btn-ghost px-3"
          disabled={busy || !url.trim()}
          onClick={async () => {
            setBusy(true);
            await onAdd(url);
            setUrl('');
            setBusy(false);
          }}
        >
          <IconPlus width={15} height={15} />
          Add
        </button>
      </div>
    </section>
  );
}

/** Size/pack options beyond the primary variant created with the product. */
function VariantsSection({
  variants,
  units,
  error,
  onAdd,
  onSave,
  onDelete,
}: {
  variants: ProductVariant[];
  units: string[];
  error: string | null;
  onAdd: (input: { size: string; unit: string; price: string; stockQty: string }) => Promise<void>;
  onSave: (variantId: string, patch: Partial<ProductVariant>) => Promise<void>;
  onDelete: (variantId: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState({ size: '', unit: units[0] ?? 'piece', price: '', stockQty: '0' });
  const [busy, setBusy] = useState(false);

  return (
    <section className="card space-y-4 p-5">
      <h3 className="text-sm font-bold text-ink-900">Variants</h3>
      <p className="-mt-2 text-xs text-ink-500">
        Size/pack options the app shows as a selector. The first variant is the default shown
        everywhere else and can't be deleted.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="space-y-2">
        {variants.map((v, i) => (
          <VariantRow
            key={v.id}
            variant={v}
            units={units}
            deletable={i > 0}
            onSave={(patch) => onSave(v.id, patch)}
            onDelete={() => onDelete(v.id)}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2 border-t border-ink-100 pt-3">
        <div className="w-28">
          <label className="label">Size/label</label>
          <input
            className="field"
            value={draft.size}
            onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
            placeholder="Pack of 5"
          />
        </div>
        <div className="w-24">
          <label className="label">Unit</label>
          <select
            className="field"
            value={draft.unit}
            onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
          >
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div className="w-24">
          <label className="label">Price</label>
          <input
            className="field"
            type="number"
            min={0}
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
          />
        </div>
        <div className="w-24">
          <label className="label">Stock</label>
          <input
            className="field"
            type="number"
            min={0}
            value={draft.stockQty}
            onChange={(e) => setDraft((d) => ({ ...d, stockQty: e.target.value }))}
          />
        </div>
        <button
          type="button"
          className="btn-ghost px-3"
          disabled={busy || !draft.price}
          onClick={async () => {
            setBusy(true);
            await onAdd(draft);
            setDraft({ size: '', unit: units[0] ?? 'piece', price: '', stockQty: '0' });
            setBusy(false);
          }}
        >
          <IconPlus width={15} height={15} />
          Add variant
        </button>
      </div>
    </section>
  );
}

function VariantRow({
  variant,
  units,
  deletable,
  onSave,
  onDelete,
}: {
  variant: ProductVariant;
  units: string[];
  deletable: boolean;
  onSave: (patch: Partial<ProductVariant>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [size, setSize] = useState(variant.size ?? '');
  const [unit, setUnit] = useState(variant.unit);
  const [price, setPrice] = useState(String(variant.price));
  const [stockQty, setStockQty] = useState(String(variant.stockQty));
  const [busy, setBusy] = useState(false);

  const dirty =
    size !== (variant.size ?? '') ||
    unit !== variant.unit ||
    price !== String(variant.price) ||
    stockQty !== String(variant.stockQty);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg bg-ink-50 p-2">
      <div className="w-28">
        <input className="field" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size/label" />
      </div>
      <div className="w-24">
        <select className="field" value={unit} onChange={(e) => setUnit(e.target.value)}>
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div className="w-24">
        <input className="field" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div className="w-24">
        <input
          className="field"
          type="number"
          min={0}
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="btn-ghost px-3"
        disabled={!dirty || busy}
        onClick={async () => {
          setBusy(true);
          await onSave({ size: size.trim() || undefined, unit, price: Number(price), stockQty: Number(stockQty) });
          setBusy(false);
        }}
      >
        Save
      </button>
      {deletable && (
        <button
          type="button"
          className="btn-ghost px-3"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onDelete();
            setBusy(false);
          }}
          aria-label="Delete variant"
        >
          <IconTrash width={16} height={16} />
        </button>
      )}
    </div>
  );
}
