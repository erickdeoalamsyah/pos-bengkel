import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch, bindTokenFns } from '@/lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      expiresIn: null,
      initialized: false, // <-- penting: biar gate nunggu

      setSession: ({ user, accessToken, expiresIn }) =>
        set({ user, accessToken, expiresIn }),

      clearSession: () =>
        set({ user: null, accessToken: null, expiresIn: null }),

      async login(username, password) {
        const res = await apiFetch('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Login failed');
        set({
          user: data.user,
          accessToken: data.accessToken,
          expiresIn: data.expiresIn,
        });
        return data;
      },

      async logout() {
        await apiFetch('/api/v1/auth/logout', { method: 'POST' });
        set({ user: null, accessToken: null, expiresIn: null });
      },

      getToken: () => get().accessToken,
      setToken: (t) => set({ accessToken: t }),

      // dipanggil saat app start: rehydrate dari storage & coba refresh pakai cookie
      async initAuth() {
        try {
          // kalau belum ada token, coba refresh (cookie rt dikirim otomatis)
          if (!get().accessToken) {
            const res = await apiFetch('/api/v1/auth/refresh', { method: 'POST' });
            if (res.ok) {
              const data = await res.json();
              if (data?.accessToken) set({ accessToken: data.accessToken });
            }
          }
        } catch (e) {
          // abaikan error refresh; user tetap dianggap belum login
        } finally {
          set({ initialized: true });
        }
      },
    }),
    { name: 'bk-auth' } // persist ke localStorage
  )
);

// hubungkan api.js ke store supaya apiFetch bisa baca/tulis token
bindTokenFns(
  () => useAuthStore.getState().getToken(),
  (t) => useAuthStore.getState().setToken(t)
);
