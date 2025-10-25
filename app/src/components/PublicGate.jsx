'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function PublicGate({ children }) {
  const router = useRouter();
  const { user, accessToken, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return;
    if (accessToken && user?.role) {
      // sudah login → arahkan ke home sesuai role
      if (user.role === 'ADMIN') router.replace('/admin');
      else router.replace('/pos');
    }
  }, [initialized, accessToken, user, router]);

  if (!initialized) return null;           // tunggu bootstrap
  if (accessToken) return null;            // sedang redirect

  return children;                          // belum login → izinkan lihat halaman publik
}
