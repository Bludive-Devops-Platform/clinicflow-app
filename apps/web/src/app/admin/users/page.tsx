'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

type User = {
  id: string;
  email: string;
  role: 'PATIENT' | 'STAFF' | 'ADMIN';
};

export default function AdminUsersPage() {
  const identity = process.env.NEXT_PUBLIC_IDENTITY_API || '/identity';
  const scheduling = process.env.NEXT_PUBLIC_SCHEDULING_API || '/scheduling';

  const [email, setEmail] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [specialty, setSpecialty] = useState('General Practice');
  const [msg, setMsg] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function findUserByEmail() {
    setMsg(null);
    setUser(null);
    setWorking(true);

    try {
      const res = await apiFetch(
        `${identity}/admin/users/by-email?email=${encodeURIComponent(email)}`
      );

      if (!res) {
        setMsg('No user found for that email.');
        setUser(null);
        return;
      }

      setUser(res);
      setMsg('User found ✅');
    } catch (e: any) {
      setMsg(e.message);
      setUser(null);
    } finally {
      setWorking(false);
    }
  }


  async function setRole(role: 'PATIENT' | 'STAFF' | 'ADMIN') {
    if (!user) return;
    setMsg(null);
    setWorking(true);
    try {
      await apiFetch(`${identity}/admin/users/${user.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setMsg(`Role updated to ${role} ✅`);
      // update UI state
      setUser({ ...user, role });
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function createProvider() {
    if (!user) return;
    setMsg(null);
    setWorking(true);
    try {
      await apiFetch(`${scheduling}/providers`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id, // NOTE: your CreateProviderDto expects STAFF userId from Identity; your identity uses id for that user.
          specialty,
        }),
      });
      setMsg('Provider created ✅ (This STAFF can now receive auto-assign bookings)');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setWorking(false);
    }
  }

  async function listProviders() {
    setMsg(null);
    setWorking(true);
    try {
      const res = await apiFetch(`${scheduling}/providers`);
      setMsg(`Providers in system: ${Array.isArray(res) ? res.length : 'loaded'} ✅`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Admin • Users & Providers</h1>
        <p className="text-sm text-gray-500 mt-1">
          Promote users to STAFF and register them as clinic providers.
        </p>
      </div>

      <div className="rounded-2xl border p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-sm">Find user by email</label>
            <input
              className="mt-1 w-full rounded-xl border p-3"
              placeholder="e.g. dr.amaka@clinicflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={findUserByEmail}
              disabled={working || !email.trim()}
              className="w-full rounded-xl border px-4 py-3 font-medium"
            >
              {working ? 'Working…' : 'Find user'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm">Provider specialty (for Create Provider)</label>
          <input
            className="mt-1 w-full rounded-xl border p-3"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>

        {user && (
          <div className="rounded-2xl border p-4 space-y-3">
            <div>
              <div className="font-medium">{user.email}</div>
              <div className="text-sm text-gray-500">User ID: {user.id}</div>
              <div className="text-sm">
                Role: <span className="font-semibold">{user.role}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={working}
                onClick={() => setRole('STAFF')}
              >
                Promote to STAFF
              </button>

              <button
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={working}
                onClick={() => setRole('PATIENT')}
              >
                Set PATIENT
              </button>

              <button
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={working}
                onClick={() => setRole('ADMIN')}
              >
                Promote to ADMIN
              </button>

              <button
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={working || user.role !== 'STAFF'}
                onClick={createProvider}
                title={user.role !== 'STAFF' ? 'User must be STAFF first' : ''}
              >
                Create Provider
              </button>

              <button
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={working}
                onClick={listProviders}
              >
                List Providers
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Recommended flow: Promote to STAFF → Create Provider.
            </div>
          </div>
        )}

        {msg && <div className="rounded-xl border p-3 text-sm">{msg}</div>}
      </div>
    </div>
  );
}
