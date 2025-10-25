'use client';

import AuthGate from '@/components/AuthGate';
import { apiFetch } from '@/lib/api';
import { useEffect, useState } from 'react';
import DashboardPage from './dashboard/page';

export default function AdminPage() {
  const [ping, setPing] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch('/api/v1/secure/admin-ping');
      const data = await res.json();
      setPing(data);
    })();
  }, []);

  return (
    <AuthGate allow={['ADMIN']}>
      <div className="p-6">
        <DashboardPage/>
      </div>
    </AuthGate>
  );
}
