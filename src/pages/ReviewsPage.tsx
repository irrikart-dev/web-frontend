import { useCallback, useEffect, useState } from 'react';

import { IconSearch } from '../components/icons';
import { ApiError, api } from '../lib/api';
import { formatDate } from '../lib/format';
import type { AdminReview, Paged, ReviewStatus } from '../lib/types';

const LIMIT = 25;

const STATUS_LABEL: Record<ReviewStatus, string> = { PENDING: 'Pending', APPROVED: 'Live', REJECTED: 'Hidden' };
const STATUS_STYLE: Record<ReviewStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-brand-50 text-brand-700',
  REJECTED: 'bg-ink-100 text-ink-500',
};

const customerLabel = (c: AdminReview['customer']) => c.name ?? c.phone ?? c.email ?? 'Customer';

/**
 * Reviews go live in the app as soon as they're posted; staff moderate after the
 * fact. Hiding one (REJECTED) takes it off the product page and out of the rating.
 */
export function ReviewsPage() {
  const [data, setData] = useState<Paged<AdminReview> | null>(null);
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set('status', status);
    if (rating) params.set('rating', rating);
    if (query) params.set('search', query);
    try {
      setData((await api<{ data: Paged<AdminReview> }>(`/admin/reviews?${params}`)).data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, status, rating, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setReviewStatus(review: AdminReview, next: ReviewStatus) {
    setBusyId(review.id);
    try {
      const res = await api<{ data: AdminReview }>(`/admin/reviews/${review.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      setData((d) => d && { ...d, items: d.items.map((r) => (r.id === review.id ? res.data : r)) });
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update the review.');
    } finally {
      setBusyId(null);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-300" />
          <input
            className="field pl-10"
            placeholder="Comment, product or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="field w-auto" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)}>
          <option value="">All reviews</option>
          {(Object.keys(STATUS_LABEL) as ReviewStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select className="field w-auto" value={rating} onChange={(e) => resetPage(setRating)(e.target.value)}>
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-ink-50 text-left text-xs font-semibold tracking-wide text-ink-500 uppercase">
              <tr>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Posted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {!data && !error && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    Loading reviews...
                  </td>
                </tr>
              )}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                    No reviews match those filters.
                  </td>
                </tr>
              )}
              {data?.items.map((r) => (
                <tr key={r.id} className="align-top hover:bg-ink-50/60">
                  <td className="max-w-sm px-4 py-3">
                    <p className="font-semibold text-amber-600" aria-label={`${r.rating} out of 5`}>
                      {'★'.repeat(r.rating)}
                      <span className="text-ink-100">{'★'.repeat(5 - r.rating)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-ink-700">
                      {r.comment ?? <span className="text-ink-300">No comment</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{r.product.title}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink-900">{customerLabel(r.customer)}</p>
                    <p className="text-xs text-ink-300">{r.customer.phone ?? r.customer.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {r.status !== 'APPROVED' && (
                        <button
                          className="btn-ghost px-3 py-1.5"
                          disabled={busyId === r.id}
                          onClick={() => setReviewStatus(r, 'APPROVED')}
                        >
                          {r.status === 'REJECTED' ? 'Restore' : 'Approve'}
                        </button>
                      )}
                      {r.status !== 'REJECTED' && (
                        <button
                          className="btn-danger px-3 py-1.5"
                          disabled={busyId === r.id}
                          onClick={() => setReviewStatus(r, 'REJECTED')}
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.total > LIMIT && (
        <div className="flex items-center justify-end gap-2 text-sm text-ink-500">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {pages}
          </span>
          <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
