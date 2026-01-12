'use client';

import { clearToken, clearUser, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push('/login');
    if (u.role !== 'ADMIN') return router.push('/patient/book');
    setUser(u);
  }, [router]);

  function logout() {
    clearToken();
    clearUser();
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">ClinicFlow</div>
            <div className="text-xs text-gray-500">Admin Console</div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <a className="underline" href="/admin/users">Users</a>
            <button onClick={logout} className="rounded-xl border px-3 py-2">Logout</button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {children}
      </div>
    </div>
  );
}
