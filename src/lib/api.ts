import { firebaseAuth } from './firebase';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

/** Origin product/category images are served from (relative to the API base). */
export const ASSET_ORIGIN = API_BASE.replace(/\/api\/v1$/, '');

/**
 * Firebase ID tokens expire hourly; `getIdToken()` returns the cached one and
 * transparently refreshes it in the background when it's close to expiry, so
 * every request just asks for "the current token" instead of storing one.
 */
async function currentToken(): Promise<string | null> {
  return (await firebaseAuth.currentUser?.getIdToken()) ?? null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** zod's `flatten()` shape from the validate() middleware, if this was a 400. */
    public details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> },
  ) {
    super(message);
  }
}

/** Fired when the API rejects our token, so the app can bounce to the login page. */
export const onUnauthorized = new EventTarget();

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const token = auth ? await currentToken() : null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(0, `Cannot reach the API at ${API_BASE}. Is the backend running?`);
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}) as Record<string, unknown>);

  if (!res.ok) {
    if (res.status === 401 && auth) {
      onUnauthorized.dispatchEvent(new Event('unauthorized'));
    }
    throw new ApiError(
      res.status,
      (body as { message?: string }).message ?? `Request failed (${res.status})`,
      (body as { details?: ApiError['details'] }).details,
    );
  }
  return body as T;
}

/** Uploads an image file to object storage, returns its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const token = await currentToken();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/admin/uploads/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const body = await res.json().catch(() => ({}) as Record<string, unknown>);
  if (!res.ok) {
    throw new ApiError(res.status, (body as { message?: string }).message ?? 'Upload failed');
  }
  return (body as { data: { url: string } }).data.url;
}

/** Resolves an API-relative asset path (or an already-absolute URL) to something an `<img>` can load. */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith('http') ? url : `${ASSET_ORIGIN}${url}`;
}

/** Resolves a product's stored image to something an `<img>` can load. */
export function imageSrc(product: { displayImageUrl: string | null }): string | null {
  return resolveAssetUrl(product.displayImageUrl);
}
