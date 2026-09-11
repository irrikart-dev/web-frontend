import { api } from './api';
import type { Category } from './types';

// Categories rarely change and every catalogue page needs them — cache the list
// in memory instead of every page/route change re-fetching it from scratch.
let cache: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

export async function getCategories(): Promise<Category[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = api<{ data: Category[] }>('/admin/categories')
      .then((res) => {
        cache = res.data;
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Call after any category create/update/delete so the next read is fresh. */
export function invalidateCategories() {
  cache = null;
}
