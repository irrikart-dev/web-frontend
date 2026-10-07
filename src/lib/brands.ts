import { api } from './api';
import type { Brand } from './types';

// same caching pattern as categories.ts — small list, needed by the product form and filters
let cache: Brand[] | null = null;
let inflight: Promise<Brand[]> | null = null;

export async function getBrands(): Promise<Brand[]> {
  if (cache) return cache;
  if (!inflight) {
    // public endpoint so the VENDOR role's product form can read it too
    inflight = api<{ data: Brand[] }>('/catalog/brands', { auth: false })
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

export function invalidateBrands() {
  cache = null;
}
