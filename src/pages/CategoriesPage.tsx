import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { IconEdit, IconPlus, IconTrash } from '../components/icons';
import { Dropzone } from '../components/Dropzone';
import { Field } from '../components/form';
import { ImageThumbnail } from '../components/ImageThumbnail';
import { Modal } from '../components/Modal';
import { ApiError, api, resolveAssetUrl, uploadImage } from '../lib/api';
import { getCategories, invalidateCategories } from '../lib/categories';
import type { Category } from '../lib/types';

interface FormState {
  name: string;
  blurb: string;
  imageUrl: string;
}

const EMPTY: FormState = { name: '', blurb: '', imageUrl: '' };

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await getCategories());
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

  async function remove(category: Category) {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/categories/${category.id}`, { method: 'DELETE' });
      invalidateCategories();
      setCategories((rows) => rows.filter((r) => r.id !== category.id));
      flash(`Deleted ${category.name}`);
    } catch (e) {
      flash(e instanceof ApiError ? e.message : 'Could not delete category.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <p className="text-sm text-ink-500">
          Categories organise the product catalogue and set what surfaces in the app.
        </p>
        <button className="btn-primary ml-auto" onClick={() => setEditingId('new')}>
          <IconPlus width={16} height={16} />
          Add category
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
          <CategoryForm
            key={editingId}
            category={editingId === 'new' ? null : categories.find((c) => c.id === editingId) ?? null}
            onClose={() => setEditingId(null)}
            onSaved={(saved) => {
              setCategories((rows) =>
                rows.some((r) => r.id === saved.id)
                  ? rows.map((r) => (r.id === saved.id ? saved : r))
                  : [...rows, saved].sort((a, b) => a.name.localeCompare(b.name)),
              );
              setEditingId(null);
              flash(editingId === 'new' ? `Added ${saved.name}` : `Saved ${saved.name}`);
            }}
          />
        </Modal>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-ink-500">
                    Loading categories...
                  </td>
                </tr>
              )}
              {!loading && categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-ink-500">
                    No categories yet.
                  </td>
                </tr>
              )}
              {categories.map((c) => {
                const src = resolveAssetUrl(c.imageUrl);
                return (
                  <tr key={c.id} className="hover:bg-ink-50/60">
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
                          <p className="truncate font-semibold text-ink-900">{c.name}</p>
                          <p className="truncate text-xs text-ink-300">{c.blurb}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{c.productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingId(c.id)}
                          className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                          title="Edit category"
                        >
                          <IconEdit width={17} height={17} />
                        </button>
                        <button
                          onClick={() => remove(c)}
                          disabled={c.productCount > 0}
                          className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            c.productCount > 0
                              ? 'Move or delete its products first'
                              : 'Delete category'
                          }
                        >
                          <IconTrash width={17} height={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoryForm({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: (c: Category) => void;
}) {
  const [form, setForm] = useState<FormState>(
    category
      ? { name: category.name, blurb: category.blurb, imageUrl: category.imageUrl ?? '' }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onFile(file: File) {
    setUploading(true);
    try {
      set('imageUrl', await uploadImage(file));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      blurb: form.blurb.trim(),
      imageUrl: form.imageUrl.trim() || null,
    };

    try {
      const res = category
        ? await api<{ data: Category }>(`/admin/categories/${category.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await api<{ data: Category }>('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
      invalidateCategories();
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h3 className="text-sm font-bold text-ink-900">
        {category ? `Edit ${category.name}` : 'New category'}
      </h3>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Field label="Name" required>
        <input
          className="field"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </Field>

      <Field label="Description">
        <textarea
          className="field min-h-20 resize-y"
          value={form.blurb}
          onChange={(e) => set('blurb', e.target.value)}
          placeholder="One line describing what lives in this category."
        />
      </Field>

      <Field label="Image">
        <div className="space-y-3">
          <ImageThumbnail
            src={resolveAssetUrl(form.imageUrl)}
            className="mx-auto h-24 w-24"
            emptyLabel=""
          />
          <Dropzone uploading={uploading} onFile={onFile} />
        </div>
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
