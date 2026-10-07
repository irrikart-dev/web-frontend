import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { IconEdit, IconPlus, IconSearch, IconTrash } from '../components/icons';
import { api, imageSrc } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getBrands } from '../lib/brands';
import { getCategories } from '../lib/categories';
import { formatMoney } from '../lib/format';
import type { Brand, Category, Product, ProductStatus } from '../lib/types';

const STATUS_LABEL: Record<ProductStatus, string> = { PUBLISHED: 'Live', DRAFT: 'Draft', ARCHIVED: 'Archived' };
const STATUS_STYLE: Record<ProductStatus, string> = {
  PUBLISHED: 'bg-brand-50 text-brand-700',
  DRAFT: 'bg-amber-50 text-amber-700',
  ARCHIVED: 'bg-ink-100 text-ink-500',
};

export function ProductsPage() {
  const { user } = useAuth();
  // a VENDOR sees/edits only their own products, through the /vendor/products
  // endpoints — same page, same components, just a different API base
  const isAdmin = user?.role !== 'VENDOR';
  const base = isAdmin ? '/admin' : '/vendor';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [brands, setBrands] = useState<Brand[]>([]);
  // admin bulk edit: ids of the ticked rows
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, b] = await Promise.all([
        api<{ data: Product[] }>(`${base}/products`),
        getCategories(),
        getBrands(),
      ]);
      setProducts(p.data);
      setCategories(c);
      setBrands(b);
      setSelected(new Set());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /** Replaces one row in place so the table does not flash on a small edit. */
  const patchRow = useCallback((updated: Product) => {
    setProducts((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  // Filtering is client-side: the whole catalogue is a few hundred rows, and
  // keeping it local means the price editor stays responsive while typing.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!categoryFilter || p.category === categoryFilter) &&
        (!statusFilter || p.status === statusFilter) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.slug.includes(q)),
    );
  }, [products, search, categoryFilter, statusFilter]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  async function changeStatus(product: Product, status: ProductStatus) {
    try {
      const res = await api<{ data: Product }>(`${base}/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      patchRow(res.data);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  async function bulkUpdate(change: { status?: ProductStatus; category?: string; brandId?: string | null }) {
    try {
      const res = await api<{ data: { updated: number } }>('/admin/products/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ ids: [...selected], ...change }),
      });
      flash(`Updated ${res.data.updated} products`);
      await load();
    } catch (e) {
      flash((e as Error).message);
    }
  }

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));
  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((p) => p.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function remove(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api(`${base}/products/${product.id}`, { method: 'DELETE' });
      setProducts((rows) => rows.filter((r) => r.id !== product.id));
      flash(`Deleted ${product.name}`);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
          <input
            className="field pl-10"
            placeholder="Search by name, SKU or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="field w-auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="field w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProductStatus | '')}
        >
          <option value="">Any status</option>
          {(Object.keys(STATUS_LABEL) as ProductStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Link to="/products/new" className="btn-primary">
          <IconPlus width={16} height={16} />
          Add product
        </Link>
      </div>

      {isAdmin && selected.size > 0 && (
        <BulkBar
          count={selected.size}
          categories={categories}
          brands={brands}
          onApply={bulkUpdate}
          onClear={() => setSelected(new Set())}
        />
      )}

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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                {isAdmin && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-500"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all shown"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-ink-500">
                    Loading catalogue...
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-10 text-center text-ink-500">
                    No products match those filters.
                  </td>
                </tr>
              )}
              {visible.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  base={base}
                  categoryName={categoryName(p.category)}
                  selected={isAdmin ? selected.has(p.id) : undefined}
                  onSelect={() => toggleOne(p.id)}
                  onPatched={patchRow}
                  onStatus={changeStatus}
                  onDelete={remove}
                  onError={flash}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-ink-300">
        Showing {visible.length} of {products.length} products. Everything marked live is served to
        the mobile app.
      </p>
    </div>
  );
}

function ProductRow({
  product,
  base,
  categoryName,
  selected,
  onSelect,
  onPatched,
  onStatus,
  onDelete,
  onError,
}: {
  product: Product;
  base: string;
  categoryName: string;
  /** undefined = no selection column (vendor view) */
  selected?: boolean;
  onSelect: () => void;
  onPatched: (p: Product) => void;
  onStatus: (p: Product, status: ProductStatus) => void;
  onDelete: (p: Product) => void;
  onError: (msg: string) => void;
}) {
  const src = imageSrc(product);
  return (
    <tr className="hover:bg-ink-50/60">
      {selected !== undefined && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand-500"
            checked={selected}
            onChange={onSelect}
            aria-label={`Select ${product.name}`}
          />
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-white">
            {src ? (
              <img src={src} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-300">
                no image
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{product.name}</p>
            <p className="truncate text-xs text-ink-300">
              {product.brandName ? `${product.brandName} · ` : ''}
              {product.source === 'seed' ? 'Original catalogue' : 'Added in dashboard'} · {product.unit}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-ink-700">{product.sku}</td>
      <td className="px-4 py-3 text-ink-700">{categoryName}</td>
      <td className="px-4 py-3">
        <PriceEditor product={product} base={base} onPatched={onPatched} onError={onError} />
      </td>
      <td className="px-4 py-3">
        {product.stockQty > 0 ? (
          <span className="text-ink-700">{product.stockQty}</span>
        ) : (
          <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            Out of stock
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <select
          value={product.status}
          onChange={(e) => onStatus(product, e.target.value as ProductStatus)}
          className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[product.status]}`}
          title="Only Live products appear in the app"
        >
          {(Object.keys(STATUS_LABEL) as ProductStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Link
            to={`/products/${product.id}`}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
            title="Edit product"
          >
            <IconEdit width={17} height={17} />
          </Link>
          <button
            onClick={() => onDelete(product)}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600"
            title="Delete product"
          >
            <IconTrash width={17} height={17} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Inline selling-price editor. Saves through the pricing endpoint. */
function PriceEditor({
  product,
  base,
  onPatched,
  onError,
}: {
  product: Product;
  base: string;
  onPatched: (p: Product) => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(product.price));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      // general product update, not the admin-only /pricing quick-action endpoint —
      // this same path already handles a price-only patch, and works for vendors too
      const res = await api<{ data: Product }>(`${base}/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ price: Number(price) }),
      });
      onPatched(res.data);
      setEditing(false);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          setPrice(String(product.price));
          setEditing(true);
        }}
        className="group text-left"
        title="Click to edit pricing"
      >
        <span className="font-semibold text-ink-900 group-hover:text-brand-700">
          {formatMoney(product.price)}
        </span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        className="field w-20 px-2 py-1 text-xs"
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        aria-label="Selling price"
        placeholder="Price"
      />
      <button onClick={save} disabled={busy} className="btn-primary px-2 py-1 text-xs">
        {busy ? '...' : 'Save'}
      </button>
      <button onClick={() => setEditing(false)} className="btn-ghost px-2 py-1 text-xs">
        Cancel
      </button>
    </div>
  );
}

/** Shown while rows are ticked: apply one change to all of them. */
function BulkBar({
  count,
  categories,
  brands,
  onApply,
  onClear,
}: {
  count: number;
  categories: Category[];
  brands: Brand[];
  onApply: (change: { status?: ProductStatus; category?: string; brandId?: string | null }) => Promise<void>;
  onClear: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const apply = (change: Parameters<typeof onApply>[0]) => {
    setBusy(true);
    void onApply(change).finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm">
      <span className="font-semibold text-brand-700">{count} selected</span>
      <select
        className="field w-auto py-1"
        value=""
        disabled={busy}
        onChange={(e) => e.target.value && apply({ status: e.target.value as ProductStatus })}
      >
        <option value="">Set status...</option>
        {(Object.keys(STATUS_LABEL) as ProductStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <select
        className="field w-auto py-1"
        value=""
        disabled={busy}
        onChange={(e) => e.target.value && apply({ category: e.target.value })}
      >
        <option value="">Move to category...</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className="field w-auto py-1"
        value=""
        disabled={busy}
        onChange={(e) => e.target.value && apply({ brandId: e.target.value === 'none' ? null : e.target.value })}
      >
        <option value="">Set brand...</option>
        <option value="none">No brand</option>
        {brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button className="btn-ghost ml-auto py-1" onClick={onClear}>
        Clear selection
      </button>
    </div>
  );
}
