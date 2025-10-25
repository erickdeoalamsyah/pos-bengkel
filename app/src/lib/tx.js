// src/lib/tx.js
import { apiFetch } from '@/lib/api';

/** Cancel / void transaksi */
export async function cancelTransaction(id, reason = '') {
  const res = await apiFetch(`/api/v1/transactions/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Gagal membatalkan transaksi');
  return data;
}
