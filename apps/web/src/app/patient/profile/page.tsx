'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Profile = {
  id: string;
  userId: string;
  fullName?: string | null;
  phone?: string | null;
  dob?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export default function PatientProfilePage() {
  const profiles = process.env.NEXT_PUBLIC_PROFILES_API || 'profiles';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const data = await apiFetch(`${profiles}/profiles/me`);
      setProfile(data);
    } catch (e: any) {
      setMsg(e.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(key: keyof Profile, value: string) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save() {
    if (!profile) return;
    setMsg(null);
    setSaving(true);
    try {
      const payload = {
        fullName: profile.fullName ?? '',
        phone: profile.phone ?? '',
        dob: profile.dob ?? '',
        address: profile.address ?? '',
        emergencyContact: profile.emergencyContact ?? '',
      };

      const updated = await apiFetch(`${profiles}/profiles/me`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setProfile(updated);
      setMsg('Profile saved ✅');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your personal details for your clinic records.
        </p>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {loading ? 'Loading…' : 'Profile details'}
          </div>
          <button
            onClick={load}
            className="rounded-xl border px-4 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {!loading && !profile && (
          <div className="mt-4 text-sm text-gray-500">
            Could not load profile.
          </div>
        )}

        {profile && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm">Full name</label>
              <input
                className="mt-1 w-full rounded-xl border p-3"
                value={profile.fullName ?? ''}
                onChange={(e) => setField('fullName', e.target.value)}
                placeholder="e.g. Ada Okoye"
              />
            </div>

            <div>
              <label className="text-sm">Phone</label>
              <input
                className="mt-1 w-full rounded-xl border p-3"
                value={profile.phone ?? ''}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+234…"
              />
            </div>

            <div>
              <label className="text-sm">Date of birth</label>
              <input
                className="mt-1 w-full rounded-xl border p-3"
                value={profile.dob ?? ''}
                onChange={(e) => setField('dob', e.target.value)}
                placeholder="YYYY-MM-DD"
              />
              <div className="text-xs text-gray-500 mt-1">
                Keep it as YYYY-MM-DD (simple for demo).
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm">Address</label>
              <input
                className="mt-1 w-full rounded-xl border p-3"
                value={profile.address ?? ''}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="City / Street"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm">Emergency contact</label>
              <input
                className="mt-1 w-full rounded-xl border p-3"
                value={profile.emergencyContact ?? ''}
                onChange={(e) => setField('emergencyContact', e.target.value)}
                placeholder="Name + phone"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl border px-5 py-3 font-medium"
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>

              {msg && <div className="text-sm text-gray-700">{msg}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
