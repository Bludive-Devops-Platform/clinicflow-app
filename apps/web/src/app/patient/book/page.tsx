'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getUser } from '@/lib/auth';

type ClinicService = { id: string; name: string; durationMinutes: number };
type Slot = { startTime: string; endTime: string; availableProviders: number };

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookPage() {
  const scheduling = process.env.NEXT_PUBLIC_SCHEDULING_API || 'scheduling';
  const [services, setServices] = useState<ClinicService[]>([]);
  const [serviceId, setServiceId] = useState<string>('');
  const [date, setDate] = useState<string>(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [booking, setBooking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const user = useMemo(() => getUser(), []);

  useEffect(() => {
    (async () => {
      const data = await apiFetch(`${scheduling}/services`);
      setServices(data);
      if (data?.[0]?.id) setServiceId(data[0].id);
    })();
  }, [scheduling]);

  async function loadSlots() {
    if (!serviceId || !date) return;
    setMsg(null);
    setLoadingSlots(true);
    try {
      const data = await apiFetch(
        `${scheduling}/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`
      );
      setSlots(data);
    } catch (e: any) {
      setSlots([]);
      setMsg(e.message);
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (serviceId && date) loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date]);

  async function book(startTime: string) {
    setMsg(null);
    setBooking(true);
    try {
      const svc = services.find(s => s.id === serviceId);
      const payload = {
        serviceId,
        date,
        startTime,
        patientEmail: user?.email ?? 'unknown@example.com',
        patientName: user?.email ? user.email.split('@')[0] : 'Patient',
      };

      const res = await apiFetch(`${scheduling}/appointments`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMsg(`Booked ✅ ${svc?.name ?? 'Service'} at ${startTime}. Appointment ID: ${res.appointmentId}`);
      await loadSlots(); // refresh availability
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Book an appointment with us quickly</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pick a service and a time — we’ll assign the first available provider.
        </p>
      </div>

      <div className="rounded-2xl border p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm">Service</label>
            <select
              className="mt-1 w-full rounded-xl border p-3"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} mins)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border p-3"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {loadingSlots ? 'Loading availability…' : `${slots.length} available slot(s)`}
          </div>
          <button
            onClick={loadSlots}
            className="rounded-xl border px-4 py-2 text-sm"
            disabled={loadingSlots}
          >
            Refresh
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {slots.map((s) => (
            <button
              key={s.startTime}
              onClick={() => book(s.startTime)}
              disabled={booking}
              className="rounded-2xl border p-4 text-left hover:shadow-sm transition"
            >
              <div className="font-medium">{s.startTime} – {s.endTime}</div>
              <div className="text-xs text-gray-500 mt-1">
                {s.availableProviders} provider(s) available
              </div>
            </button>
          ))}

          {!loadingSlots && slots.length === 0 && (
            <div className="text-sm text-gray-500">
              No available slots. Try another date or service.
            </div>
          )}
        </div>

        {msg && (
          <div className="rounded-xl border p-3 text-sm">
            {msg}
          </div>
        )}
      </div>

    </div>
  );
}
