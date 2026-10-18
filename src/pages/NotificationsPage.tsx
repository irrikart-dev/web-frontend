import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { Field } from '../components/form';
import { ApiError, api } from '../lib/api';
import { formatDate } from '../lib/format';
import type { NotificationCampaign } from '../lib/types';

const TITLE_MAX = 65;
const BODY_MAX = 240;

/**
 * Broadcast composer. Every active customer gets it in the app's notification
 * centre, and as a push on each phone they're signed in on. Order, return and
 * refund updates are sent automatically — this is for announcements and offers.
 */
export function NotificationsPage() {
  const [campaigns, setCampaigns] = useState<NotificationCampaign[] | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCampaigns((await api<{ data: NotificationCampaign[] }>('/admin/notifications/campaigns')).data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!confirm('Send this to every customer now? It cannot be recalled.')) return;
    setSending(true);
    setError(null);
    try {
      const res = await api<{ data: NotificationCampaign }>('/admin/notifications/campaigns', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), body: body.trim(), link: link.trim() || undefined }),
      });
      setCampaigns((rows) => [res.data, ...(rows ?? [])]);
      setNotice(`Sent to ${res.data.recipients} customers — ${res.data.pushSent} phones reached.`);
      setTitle('');
      setBody('');
      setLink('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the notification.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <form onSubmit={send} className="card h-fit space-y-4 p-5">
        <div>
          <h3 className="text-sm font-bold text-ink-900">New announcement</h3>
          <p className="mt-1 text-xs text-ink-500">
            Goes to every active customer. Order, return and refund updates are sent automatically.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {notice && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">{notice}</p>}

        <Field label="Title" required hint={`${title.length}/${TITLE_MAX}`}>
          <input className="field" value={title} maxLength={TITLE_MAX} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Message" required hint={`${body.length}/${BODY_MAX}`}>
          <textarea
            className="field min-h-24"
            value={body}
            maxLength={BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </Field>
        <Field label="Opens" hint="Optional in-app link, e.g. a category or product link.">
          <input className="field" value={link} maxLength={300} onChange={(e) => setLink(e.target.value)} />
        </Field>

        <div className="rounded-lg border border-ink-100 bg-ink-50 p-3">
          <p className="text-[11px] font-semibold tracking-wide text-ink-500 uppercase">Preview</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">{title || 'Title'}</p>
          <p className="text-sm text-ink-700">{body || 'Your message'}</p>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary" disabled={sending || !title.trim() || !body.trim()}>
            {sending ? 'Sending...' : 'Send to all customers'}
          </button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 px-4 py-3">
          <h3 className="text-sm font-bold text-ink-900">Sent</h3>
        </div>
        {!campaigns && !error && <p className="px-4 py-8 text-center text-sm text-ink-500">Loading...</p>}
        {campaigns?.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-500">Nothing sent yet.</p>}
        <ul className="divide-y divide-ink-100">
          {campaigns?.map((c) => (
            <li key={c.id} className="px-4 py-3 text-sm">
              <div className="flex items-baseline gap-2">
                <p className="font-semibold text-ink-900">{c.title}</p>
                <span className="ml-auto shrink-0 text-xs text-ink-300">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-ink-700">{c.body}</p>
              <p className="mt-1 text-xs text-ink-500">
                {c.recipients} customers · {c.pushSent} phones reached
                {c.pushFailed > 0 ? ` · ${c.pushFailed} failed` : ''}
                {c.link ? ` · opens ${c.link}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
