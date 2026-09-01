const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';
export const API_BASE = RAW_BASE.replace(/\/+$/, '');

/** Origin the API serves `/static/...` images from. */
export const ASSET_ORIGIN = API_BASE.replace(/\/api\/v1$/, '');

const TOKEN_KEY = 'irrikart.admin.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Field-level validation messages, ready to attach to inputs. */
    public fields?: Record<string, string>,
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
  const token = tokenStore.get();

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
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
      tokenStore.clear();
      onUnauthorized.dispatchEvent(new Event('unauthorized'));
    }
    throw new ApiError(
      res.status,
      (body as { error?: string }).error ?? `Request failed (${res.status})`,
      (body as { fields?: Record<string, string> }).fields,
    );
  }
  return body as T;
}

/** Resolves a product image to something an `<img>` can load. */
export function imageSrc(product: { displayImageUrl: string | null }): string | null {
  const url = product.displayImageUrl;
  if (!url) return null;
  return url.startsWith('http') ? url : `${ASSET_ORIGIN}${url}`;
}
