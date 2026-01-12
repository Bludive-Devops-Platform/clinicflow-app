'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const identity = process.env.NEXT_PUBLIC_IDENTITY_API || '/identity';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      const login = await apiFetch(`${identity}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setToken(login.accessToken);

      const me = await apiFetch(`${identity}/me`);
      setUser(me);

      // route based on role
      if (me.role === 'ADMIN') router.push('/admin/users');
      else if (me.role === 'STAFF') router.push('/staff/schedule');
      else router.push('/patient/book');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen clinic-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Log in to ClinicFlow</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm">Email</label>
            <input className="mt-1 w-full rounded-xl border p-3"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input type="password" className="mt-1 w-full rounded-xl border p-3"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="w-full rounded-xl border px-4 py-3 font-medium">
            Log in
          </button>

          {msg && <div className="text-sm text-gray-700">{msg}</div>}
        </form>

        <div className="mt-4 text-sm">
          New here? <a className="underline" href="/register">Create account</a>
        </div>
      </div>
    </div>
  );
}
