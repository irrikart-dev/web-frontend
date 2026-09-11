import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { IconEdit, IconPlus, IconSearch, IconTrash } from '../components/icons';
import { api, imageSrc } from '../lib/api';
import { getCategories } from '../lib/categories';
import { formatMoney } from '../lib/format';
import type { Category, Product } from '../lib/types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([api<{ data: Product[] }>('/admin/products'), getCategories()]);
      setProducts(p.data);
      setCategories(c);
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
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.slug.includes(q)),
    );
  }, [products, search, categoryFilter]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  async function toggle(product: Product, field: 'active') {
    try {
      const res = await api<{ data: Product }>(`/admin/products/${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: !product[field] }),
      });
      patchRow(res.data);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  async function remove(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/products/${product.id}`, { method: 'DELETE' });
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
        <Link to="/products/new" className="btn-primary">
          <IconPlus width={16} height={16} />
          Add product
        </Link>
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Pricing</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    Loading catalogue...
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-500">
                    No products match those filters.
                  </td>
                </tr>
              )}
              {visible.map((p) => (
                <ProductRow
                  key={p.id}
                  product={p}
                  categoryName={categoryName(p.category)}
                  onPatched={patchRow}
                  onToggle={toggle}
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
  categoryName,
  onPatched,
  onToggle,
  onDelete,
  onError,
}: {
  product: Product;
  categoryName: string;
  onPatched: (p: Product) => void;
  onToggle: (p: Product, field: 'active') => void;
  onDelete: (p: Product) => void;
  onError: (msg: string) => void;
}) {
  const src = imageSrc(product);
  return (
    <tr className="hover:bg-ink-50/60">
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
              {product.source === 'seed' ? 'Original catalogue' : 'Added in dashboard'} ·{' '}
              {product.unit}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-ink-700">{product.sku}</td>
      <td className="px-4 py-3 text-ink-700">{categoryName}</td>
      <td className="px-4 py-3">
        <PriceEditor product={product} onPatched={onPatched} onError={onError} />
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
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onToggle(product, 'active')}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              product.active
                ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                : 'bg-ink-100 text-ink-500 hover:bg-ink-100/70'
            }`}
            title="Live products appear in the app"
          >
            {product.active ? 'Live' : 'Hidden'}
          </button>
        </div>
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
  onPatched,
  onError,
}: {
  product: Product;
  onPatched: (p: Product) => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(product.price));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await api<{ data: Product }>(`/admin/products/${product.id}/pricing`, {
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
