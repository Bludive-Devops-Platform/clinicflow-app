'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';

type ScheduleItem = {
  id: string;
  patientUserId: string;
  service: string;
  startAt: string;
  endAt: string;
  status: string;
};

type Note = {
  id: string;
  appointmentId: string;
  patientUserId: string;
  staffUserId: string;
  note: string;
  createdAt: string;
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

export default function StaffSchedulePage() {
  const scheduling = process.env.NEXT_PUBLIC_SCHEDULING_API || 'scheduling';
  const profiles = process.env.NEXT_PUBLIC_PROFILES_API || 'profiles';

  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [selected, setSelected] = useState<ScheduleItem | null>(null);

  // patient profile preview (optional but nice)
  const [patientProfile, setPatientProfile] = useState<any>(null);

  // notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');
  const [working, setWorking] = useState(false);

  async function loadSchedule() {
    setMsg(null);
    setLoading(true);
    setSelected(null);
    setNotes([]);
    setPatientProfile(null);

    try {
      const data = await apiFetch(`${scheduling}/appointments/provider/mine?date=${encodeURIComponent(date)}`);
      setItems(data);
    } catch (e: any) {
      setItems([]);
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function selectItem(i: ScheduleItem) {
    setSelected(i);
    setMsg(null);
    setNotes([]);
    setPatientProfile(null);

    try {
      // Load patient profile (staff allowed)
      const p = await apiFetch(`${profiles}/profiles/patient/${i.patientUserId}`);
      setPatientProfile(p);
    } catch {
      setPatientProfile(null);
    }

    try {
      // List visit notes for this appointment
      const n = await apiFetch(`${profiles}/visit-notes?appointmentId=${encodeURIComponent(i.id)}`);
      setNotes(n);
    } catch {
      setNotes([]);
    }
  }

  async function addNote() {
    if (!selected) return;
    if (!noteText.trim()) return;

    setWorking(true);
    setMsg(null);
    try {
      await apiFetch(`${profiles}/visit-notes`, {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: selected.id,
          note: noteText.trim(),
        }),
      });

      setNoteText('');
      const n = await apiFetch(`${profiles}/visit-notes?appointmentId=${encodeURIComponent(selected.id)}`);
      setNotes(n);
      setMsg('Visit note saved ✅');
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your appointments and write visit notes.
        </p>
      </div>

      <div className="rounded-2xl border p-5 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <label className="text-sm">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border p-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button
            onClick={loadSchedule}
            className="rounded-xl border px-4 py-3 text-sm"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {loading ? 'Loading…' : `${items.length} appointment(s)`}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {/* Left: schedule list */}
          <div className="space-y-3">
            {(!loading && items.length === 0) && (
              <div className="text-sm text-gray-500">No appointments for this date.</div>
            )}

            {items.map((i) => (
              <button
                key={i.id}
                onClick={() => selectItem(i)}
                className={`w-full text-left rounded-2xl border p-4 hover:shadow-sm transition ${
                  selected?.id === i.id ? 'shadow-sm' : ''
                }`}
              >
                <div className="font-medium">{i.service}</div>
                <div className="text-sm text-gray-500">
                  {fmt(i.startAt)} → {fmt(i.endAt)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Status: {i.status} • Patient ID: {i.patientUserId}
                </div>
              </button>
            ))}
          </div>

          {/* Right: selected appointment details + notes */}
          <div className="rounded-2xl border p-4">
            {!selected && (
              <div className="text-sm text-gray-500">
                Select an appointment to view patient profile and add notes.
              </div>
            )}

            {selected && (
              <div className="space-y-4">
                <div>
                  <div className="font-semibold">Appointment</div>
                  <div className="text-sm text-gray-500">
                    {selected.service} • {fmt(selected.startAt)}
                  </div>
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-sm font-medium">Patient profile</div>
                  {patientProfile ? (
                    <div className="text-sm text-gray-700 mt-2 space-y-1">
                      <div><span className="text-gray-500">Name:</span> {patientProfile.fullName ?? '—'}</div>
                      <div><span className="text-gray-500">Phone:</span> {patientProfile.phone ?? '—'}</div>
                      <div><span className="text-gray-500">DOB:</span> {patientProfile.dob ?? '—'}</div>
                      <div><span className="text-gray-500">Emergency:</span> {patientProfile.emergencyContact ?? '—'}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-2">
                      No profile details available.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border p-3">
                  <div className="text-sm font-medium">Visit notes</div>

                  <div className="mt-2 space-y-2 max-h-44 overflow-auto">
                    {notes.length === 0 && (
                      <div className="text-sm text-gray-500">No notes yet.</div>
                    )}
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-xl border p-3">
                        <div className="text-sm">{n.note}</div>
                        <div className="text-xs text-gray-500 mt-1">{fmt(n.createdAt)}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <textarea
                      className="w-full rounded-xl border p-3 text-sm"
                      rows={3}
                      placeholder="Write a short visit note…"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <button
                      onClick={addNote}
                      disabled={working || !noteText.trim()}
                      className="mt-2 w-full rounded-xl border px-4 py-3 font-medium"
                    >
                      {working ? 'Saving…' : 'Save visit note'}
                    </button>
                  </div>
                </div>

                {msg && <div className="rounded-xl border p-3 text-sm">{msg}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
