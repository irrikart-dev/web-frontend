import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { Dropzone } from '../components/Dropzone';
import { Field, Toggle } from '../components/form';
import { IconEdit, IconPlus, IconTrash } from '../components/icons';
import { ImageThumbnail } from '../components/ImageThumbnail';
import { Modal } from '../components/Modal';
import { ApiError, api, resolveAssetUrl, uploadImage } from '../lib/api';
import type { Banner } from '../lib/types';

type FormState = Omit<Banner, 'id' | 'link' | 'imageUrl'> & { link: string; imageUrl: string };

const EMPTY: FormState = {
  eyebrow: '',
  title: '',
  subtitle: '',
  ctaLabel: '',
  link: '',
  imageUrl: '',
  position: 0,
  active: true,
};

/** Hero banners on the app's home screen, shown in `position` order. */
export function BannersPage() {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Banner | 'new' | null>(null);

  const load = useCallback(async () => {
    try {
      setBanners((await api<{ data: Banner[] }>('/admin/banners')).data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(b: Banner) {
    if (!confirm(`Delete the "${b.title}" banner? This cannot be undone.`)) return;
    try {
      await api(`/admin/banners/${b.id}`, { method: 'DELETE' });
      setBanners((rows) => rows?.filter((r) => r.id !== b.id) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete the banner.');
    }
  }

  async function toggle(b: Banner) {
    try {
      const res = await api<{ data: Banner }>(`/admin/banners/${b.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !b.active }),
      });
      setBanners((rows) => rows?.map((r) => (r.id === b.id ? res.data : r)) ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update the banner.');
    }
  }

  const sorted = banners ? [...banners].sort((a, b) => a.position - b.position) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <p className="text-sm text-ink-500">
          Hero banners on the app's home screen. Artwork: 1080 × 560 px. Lower position shows first.
        </p>
        <button className="btn-primary ml-auto" onClick={() => setEditing('new')}>
          <IconPlus width={16} height={16} />
          Add banner
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!sorted && !error && <p className="text-sm text-ink-500">Loading banners...</p>}
      {sorted?.length === 0 && (
        <div className="card px-4 py-10 text-center text-sm text-ink-500">
          No banners yet — the app falls back to its built-in artwork.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted?.map((b) => {
          const src = resolveAssetUrl(b.imageUrl);
          return (
            <div key={b.id} className={`card overflow-hidden ${b.active ? '' : 'opacity-60'}`}>
              <div className="aspect-[1080/560] bg-ink-50">
                {src ? (
                  <img src={src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-300">No image</div>
                )}
              </div>
              <div className="space-y-1 p-4">
                {b.eyebrow && <p className="text-[11px] font-semibold tracking-wide text-brand-700 uppercase">{b.eyebrow}</p>}
                <p className="font-semibold text-ink-900">{b.title}</p>
                {b.subtitle && <p className="text-xs text-ink-500">{b.subtitle}</p>}
                <div className="flex items-center gap-2 pt-3">
                  <span className="text-xs text-ink-300">Position {b.position}</span>
                  <button
                    className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${
                      b.active ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'
                    }`}
                    onClick={() => toggle(b)}
                    title={b.active ? 'Hide from the app' : 'Show in the app'}
                  >
                    {b.active ? 'Live' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => setEditing(b)}
                    className="rounded-lg p-2 text-ink-500 transition hover:bg-brand-50 hover:text-brand-700"
                    title="Edit banner"
                  >
                    <IconEdit width={17} height={17} />
                  </button>
                  <button
                    onClick={() => remove(b)}
                    className="rounded-lg p-2 text-ink-500 transition hover:bg-red-50 hover:text-red-600"
                    title="Delete banner"
                  >
                    <IconTrash width={17} height={17} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <BannerForm
            banner={editing === 'new' ? null : editing}
            nextPosition={(sorted?.at(-1)?.position ?? -1) + 1}
            onClose={() => setEditing(null)}
            onSaved={(saved) => {
              setBanners((rows) =>
                rows?.some((r) => r.id === saved.id) ? rows.map((r) => (r.id === saved.id ? saved : r)) : [...(rows ?? []), saved],
              );
              setEditing(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function BannerForm({
  banner,
  nextPosition,
  onClose,
  onSaved,
}: {
  banner: Banner | null;
  nextPosition: number;
  onClose: () => void;
  onSaved: (b: Banner) => void;
}) {
  const [form, setForm] = useState<FormState>(
    banner
      ? { ...banner, link: banner.link ?? '', imageUrl: banner.imageUrl ?? '' }
      : { ...EMPTY, position: nextPosition },
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: 'eyebrow' | 'title' | 'subtitle' | 'ctaLabel' | 'link') => ({
    className: 'field',
    value: form[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
  });

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
    const orNull = (v: string) => v.trim() || null;
    const payload = {
      eyebrow: orNull(form.eyebrow),
      title: form.title.trim(),
      subtitle: orNull(form.subtitle),
      ctaLabel: orNull(form.ctaLabel),
      link: orNull(form.link),
      imageUrl: orNull(form.imageUrl),
      position: Number(form.position) || 0,
      active: form.active,
    };
    try {
      const res = await api<{ data: Banner }>(banner ? `/admin/banners/${banner.id}` : '/admin/banners', {
        method: banner ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the banner.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h3 className="text-sm font-bold text-ink-900">{banner ? 'Edit banner' : 'New banner'}</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Field label="Image" hint="1080 × 560 px, JPG or PNG, up to 5MB.">
        <div className="space-y-3">
          <ImageThumbnail src={resolveAssetUrl(form.imageUrl)} className="aspect-[1080/560] w-full" emptyLabel="" />
          <Dropzone uploading={uploading} onFile={onFile} />
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Eyebrow" hint="Small line above the title, e.g. “Monsoon offer”.">
          <input {...text('eyebrow')} maxLength={40} />
        </Field>
        <Field label="Title" required>
          <input {...text('title')} maxLength={80} required />
        </Field>
        <Field label="Subtitle">
          <input {...text('subtitle')} maxLength={120} />
        </Field>
        <Field label="Button label" hint="e.g. “Shop now”.">
          <input {...text('ctaLabel')} maxLength={30} />
        </Field>
        <Field label="Link" hint="Where the banner opens, e.g. a category or product link.">
          <input {...text('link')} maxLength={200} />
        </Field>
        <Field label="Position">
          <input
            className="field"
            type="number"
            min={0}
            value={form.position}
            onChange={(e) => set('position', Number(e.target.value))}
          />
        </Field>
      </div>

      <Toggle label="Live" hint="Hidden banners stay here but don't show in the app." checked={form.active} onChange={(v) => set('active', v)} />

      <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
        <button type="button" className="btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
