'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { statusPill } from '@/lib/ui';

type Appt = {
  id: string;
  service: string;
  providerId: string;
  providerUserId: string;
  specialty?: string | null;
  startAt: string;
  endAt: string;
  status: 'BOOKED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
};

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

function badge(status: Appt['status']) {
  const base = 'inline-flex items-center rounded-full border px-2 py-1 text-xs';
  if (status === 'BOOKED') return `${base}`;
  if (status === 'COMPLETED') return `${base}`;
  if (status === 'RESCHEDULED') return `${base}`;
  return `${base}`;
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function MyAppointmentsPage() {
  const scheduling = process.env.NEXT_PUBLIC_SCHEDULING_API || '/scheduling';
  const user = useMemo(() => getUser(), []);
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // reschedule modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Appt | null>(null);
  const [newDate, setNewDate] = useState(todayISO());
  const [newTime, setNewTime] = useState(''); // optional
  const [working, setWorking] = useState(false);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const data = await apiFetch(`${scheduling}/appointments/mine`);
      setItems(data);
    } catch (e: any) {
      setMsg(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cancelAppt(id: string) {
    setMsg(null);
    setWorking(true);
    try {
      await apiFetch(`${scheduling}/appointments/${id}`, { method: 'DELETE' });
      await load();
      setMsg('Appointment cancelled.');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setWorking(false);
    }
  }

  function openReschedule(a: Appt) {
    setSelected(a);
    setNewDate(todayISO());
    setNewTime('');
    setOpen(true);
  }

  async function confirmReschedule() {
    if (!selected) return;
    setMsg(null);
    setWorking(true);
    try {
      const payload: any = {
        date: newDate,
        patientEmail: user?.email ?? 'unknown@example.com',
        patientName: user?.email ? user.email.split('@')[0] : 'Patient',
      };
      if (newTime.trim()) payload.startTime = newTime.trim();

      await apiFetch(`${scheduling}/appointments/${selected.id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setOpen(false);
      setSelected(null);
      await load();
      setMsg('Rescheduled successfully. A confirmation email should be sent.');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My appointments</h1>
        <p className="text-sm text-gray-500 mt-1">
          View, cancel, or reschedule your bookings.
        </p>
      </div>

      <div className="rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {loading ? 'Loading…' : `${items.length} appointment(s)`}
          </div>
          <button
            onClick={load}
            className="rounded-xl border px-4 py-2 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {!loading && items.length === 0 && (
            <div className="text-sm text-gray-500">No appointments yet.</div>
          )}

          {items.map((a) => (
            <div key={a.id} className="rounded-2xl border p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">{a.service}</div>
                  <div className="text-sm text-gray-500">
                    {fmt(a.startAt)} → {fmt(a.endAt)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Provider: {a.specialty ?? '—'} • Appointment ID: {a.id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={statusPill(a.status)}>{a.status}</span>

                  <button
                    className="rounded-xl border px-3 py-2 text-sm"
                    onClick={() => openReschedule(a)}
                    disabled={working || a.status === 'CANCELLED'}
                  >
                    Reschedule
                  </button>

                  <button
                    className="rounded-xl border px-3 py-2 text-sm"
                    onClick={() => cancelAppt(a.id)}
                    disabled={working || a.status === 'CANCELLED'}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {msg && <div className="mt-4 rounded-xl border p-3 text-sm">{msg}</div>}
      </div>

      {/* Reschedule modal */}
      {open && selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">Reschedule</div>
                <div className="text-sm text-gray-500">
                  {selected.service}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={working}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm">New date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border p-3"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm">New time (optional)</label>
                <input
                  placeholder="e.g. 10:00 (leave blank for earliest available)"
                  className="mt-1 w-full rounded-xl border p-3"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Format: HH:MM (24-hour). If blank, system picks the earliest slot.
                </div>
              </div>

              <button
                onClick={confirmReschedule}
                disabled={working}
                className="w-full rounded-xl border px-4 py-3 font-medium"
              >
                {working ? 'Working…' : 'Confirm reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
