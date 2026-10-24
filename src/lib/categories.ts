import { api } from './api';
import type { Category } from './types';

// Categories rarely change and every catalogue page needs them — cache the list
// in memory instead of every page/route change re-fetching it from scratch.
let cache: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

export async function getCategories(): Promise<Category[]> {
  if (cache) return cache;
  if (!inflight) {
    // public endpoint, not /admin/categories — identical data (categories have no
    // visibility flag), but this way it also works for the VENDOR role's product form
    inflight = api<{ data: Category[] }>('/catalog/categories', { auth: false })
      .then((res) => {
        cache = treeOrder(res.data);
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Each top-level category followed by its sub-categories, with `label` set for dropdowns. */
function treeOrder(rows: Category[]): Category[] {
  const byId = new Map(rows.map((c) => [c.id, c]));
  const isTop = (c: Category) => !c.parentId || !byId.has(c.parentId);
  const out: Category[] = [];
  for (const top of rows.filter(isTop)) {
    out.push({ ...top, label: top.name });
    for (const child of rows.filter((c) => c.parentId === top.id)) {
      out.push({ ...child, label: `${top.name} › ${child.name}` });
    }
  }
  return out;
}

/** A product filed under `filterId` or one of its sub-categories. */
export function inCategory(productCategoryId: string, filterId: string, categories: Category[]) {
  if (productCategoryId === filterId) return true;
  return categories.find((c) => c.id === productCategoryId)?.parentId === filterId;
}

/** Call after any category create/update/delete so the next read is fresh. */
export function invalidateCategories() {
  cache = null;
}
