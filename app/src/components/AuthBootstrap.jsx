'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

export default function AuthBootstrap() {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => { initAuth(); }, [initAuth]);
  return null;
}
