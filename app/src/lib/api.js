const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// util untuk menyimpan/ambil token dari zustand tanpa import melingkar
let _getAccessToken = () => null;
let _setAccessToken = () => {};

export function bindTokenFns(getter, setter) {
  _getAccessToken = getter;
  _setAccessToken = setter;
}

/**
 * apiFetch: otomatis attach Authorization
 * jika 401 -> coba refresh (pakai cookie rt) -> retry sekali
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  const accessToken = _getAccessToken?.();

  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const doFetch = async () =>
    fetch(url, { ...options, headers, credentials: 'include' }); // include => kirim cookie refresh saat perlu

  let res = await doFetch();

  // Kalau unauthorized, coba refresh lalu ulang sekali
  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) {
      const newHeaders = new Headers(headers);
      const newAccess = _getAccessToken?.();
      if (newAccess) newHeaders.set('Authorization', `Bearer ${newAccess}`);
      res = await fetch(url, { ...options, headers: newHeaders, credentials: 'include' });
    }
  }

  return res;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // penting agar cookie rt terkirim
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.accessToken) {
      _setAccessToken?.(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
