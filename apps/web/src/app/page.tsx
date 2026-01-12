'use client';

import { useEffect } from 'react';
import { getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const u = getUser();
    if (!u) return router.push('/login');

    if (u.role === 'ADMIN') return router.push('/admin/users');
    if (u.role === 'STAFF') return router.push('/staff/schedule');
    return router.push('/patient/book');
  }, [router]);

  return null;
}
