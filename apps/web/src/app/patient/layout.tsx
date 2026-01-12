'use client';

import { clearToken, clearUser, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getUser();

    if (!u) {
      router.push('/login');
      return;
    }

    // ✅ prevent ADMIN/STAFF from using patient portal
    if (u.role === 'ADMIN') {
      router.push('/admin/users');
      return;
    }

    if (u.role === 'STAFF') {
      router.push('/staff/schedule');
      return;
    }

    // only PATIENT continues
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
            <div className="text-xs text-gray-500">Patient Portal</div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <a className="underline" href="/patient/book">Book</a>
            <a className="underline" href="/patient/appointments">My Appointments</a>
            <a className="underline" href="/patient/profile">My Profile</a>
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
