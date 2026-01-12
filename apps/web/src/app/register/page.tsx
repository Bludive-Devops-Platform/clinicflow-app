'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const identity = process.env.NEXT_PUBLIC_IDENTITY_API || 'identity';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      await apiFetch(`${identity}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setMsg('Registered! You can now log in.');
    } catch (err: any) {
      setMsg(err.message);
    }
  }

  return (
    <div className="min-h-screen clinic-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">ClinicFlow patient portal</p>

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
            Register
          </button>

          {msg && <div className="text-sm text-gray-700">{msg}</div>}
        </form>

        <div className="mt-4 text-sm">
          Already have an account? <a className="underline" href="/login">Log in</a>
        </div>
      </div>
    </div>
  );
}
