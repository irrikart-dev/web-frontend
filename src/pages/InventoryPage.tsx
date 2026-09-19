import { useCallback, useEffect, useMemo, useState } from 'react';

import { IconSearch } from '../components/icons';
import { api, imageSrc } from '../lib/api';
import { getCategories } from '../lib/categories';
import type { Category, Product } from '../lib/types';

const LOW_STOCK_THRESHOLD = 10;

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
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

  const patchRow = useCallback((updated: Product) => {
    setProducts((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
  }, []);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!categoryFilter || p.category === categoryFilter) &&
        (!lowStockOnly || p.stockQty < LOW_STOCK_THRESHOLD) &&
        (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
  }, [products, search, categoryFilter, lowStockOnly]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stockQty < LOW_STOCK_THRESHOLD).length,
    [products],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
          <input
            className="field pl-10"
            placeholder="Search by name or SKU..."
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
        <button
          onClick={() => setLowStockOnly((v) => !v)}
          className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
            lowStockOnly
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-ink-100 text-ink-500 hover:bg-ink-100/70'
          }`}
        >
          Low stock ({lowStockCount})
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    Loading inventory...
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-ink-500">
                    No products match those filters.
                  </td>
                </tr>
              )}
              {visible.map((p) => (
                <InventoryRow
                  key={p.id}
                  product={p}
                  categoryName={categoryName(p.category)}
                  onPatched={patchRow}
                  onError={flash}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-ink-300">
        Every stock change here is recorded in the inventory ledger with reason &quot;manual&quot;.
      </p>
    </div>
  );
}

function InventoryRow({
  product,
  categoryName,
  onPatched,
  onError,
}: {
  product: Product;
  categoryName: string;
  onPatched: (p: Product) => void;
  onError: (msg: string) => void;
}) {
  const src = imageSrc(product);
  const [value, setValue] = useState(String(product.stockQty));
  const [busy, setBusy] = useState(false);
  const dirty = Number(value) !== product.stockQty;
  const low = product.stockQty < LOW_STOCK_THRESHOLD;

  async function save() {
    const stock = Number(value);
    if (!Number.isInteger(stock) || stock < 0) {
      onError('Stock must be a whole number, 0 or more.');
      setValue(String(product.stockQty));
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ data: Product }>(`/admin/products/${product.id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock }),
      });
      onPatched(res.data);
    } catch (e) {
      onError((e as Error).message);
      setValue(String(product.stockQty));
    } finally {
      setBusy(false);
    }
  }

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
          <p className="truncate font-semibold text-ink-900">{product.name}</p>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-ink-700">{product.sku}</td>
      <td className="px-4 py-3 text-ink-700">{categoryName}</td>
      <td className="px-4 py-3">
        {low ? (
          <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            {product.stockQty} left
          </span>
        ) : (
          <span className="text-ink-700">{product.stockQty}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <input
            className="field w-20 px-2 py-1 text-xs"
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="New stock quantity"
          />
          <button
            onClick={save}
            disabled={busy || !dirty}
            className="btn-primary px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? '...' : 'Set'}
          </button>
        </div>
      </td>
    </tr>
  );
}
