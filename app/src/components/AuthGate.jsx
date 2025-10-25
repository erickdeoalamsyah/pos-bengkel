'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

export default function AuthGate({ children, allow = ['ADMIN', 'CASHIER'] }) {
  const router = useRouter();
  const { user, accessToken, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) return; // tunggu initAuth selesai
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (user && !allow.includes(user.role)) {
      if (user.role === 'ADMIN') router.replace('/admin');
      else router.replace('/pos');
    }
  }, [initialized, user, accessToken, allow, router]);

  // sebelum initialized, jangan render apa pun (hindari flicker/redirect palsu)
  if (!initialized) return null;
  if (!accessToken) return null;
  if (user && !allow.includes(user.role)) return null;

  return children;
}
