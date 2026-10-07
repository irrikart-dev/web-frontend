import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { IconEdit, IconPlus, IconTrash } from '../components/icons';
import { api } from '../lib/api';
import { getBrands, invalidateBrands } from '../lib/brands';
import type { Brand } from '../lib/types';

export function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    invalidateBrands();
    try {
      setBrands(await getBrands());
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

  function add(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    void run(async () => {
      await api('/admin/brands', { method: 'POST', body: JSON.stringify({ name: newName.trim() }) });
      setNewName('');
    });
  }

  function rename(e: FormEvent) {
    e.preventDefault();
    if (!editing?.name.trim()) return;
    void run(async () => {
      await api(`/admin/brands/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ name: editing.name.trim() }) });
      setEditing(null);
    });
  }

  function remove(brand: Brand) {
    if (!confirm(`Delete "${brand.name}"?`)) return;
    void run(() => api(`/admin/brands/${brand.id}`, { method: 'DELETE' }));
  }

  return (
    <div className="max-w-3xl space-y-5">
      <form onSubmit={add} className="flex gap-3">
        <input
          className="field"
          placeholder="New brand name, e.g. Jain Irrigation"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button className="btn-primary shrink-0" disabled={!newName.trim()}>
          <IconPlus width={16} height={16} />
          Add brand
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
            <tr>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {loading && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-ink-500">
                  Loading brands...
                </td>
              </tr>
            )}
            {!loading && brands.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-ink-500">
                  No brands yet. Add one above, then pick it on a product.
                </td>
              </tr>
            )}
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3">
                  {editing?.id === b.id ? (
                    <form onSubmit={rename} className="flex gap-2">
                      <input
                        className="field py-1"
                        value={editing.name}
                        onChange={(e) => setEditing({ id: b.id, name: e.target.value })}
                        autoFocus
                      />
                      <button className="btn-primary px-2 py-1 text-xs">Save</button>
                      <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <span className="font-semibold text-ink-900">{b.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-700">{b.productCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditing({ id: b.id, name: b.name })}
                      className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                      title="Rename"
                    >
                      <IconEdit width={17} height={17} />
                    </button>
                    <button
                      onClick={() => remove(b)}
                      className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600"
                      title={b.productCount ? 'Reassign its products first' : 'Delete brand'}
                    >
                      <IconTrash width={17} height={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
