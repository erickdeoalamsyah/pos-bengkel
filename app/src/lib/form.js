import { apiFetch } from '@/lib/api';

export async function getJSON(url) {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function postJSON(url, body) {
  const res = await apiFetch(url, { method: 'POST', body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

export async function putJSON(url, body) {
  const res = await apiFetch(url, { method: 'PUT', body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

export async function deleteJSON(url) {
  const res = await apiFetch(url, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}