import { api } from './api';
import type { Vendor } from './types';

// same caching pattern as categories.ts — the vendor list is small and admin screens
// (the product form's vendor picker, the vendors page itself) all need it
let cache: Vendor[] | null = null;
let inflight: Promise<Vendor[]> | null = null;

export async function getVendors(): Promise<Vendor[]> {
  if (cache) return cache;
  if (!inflight) {
    inflight = api<{ data: Vendor[] }>('/admin/vendors')
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

export function invalidateVendors() {
  cache = null;
}
