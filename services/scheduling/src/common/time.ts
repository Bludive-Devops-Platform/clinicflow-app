export function toDateOnlyUTC(dateStr: string): Date {
  // "2026-01-05" -> 2026-01-05T00:00:00.000Z
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function toDateTimeUTC(dateStr: string, timeHHMM: string): Date {
  // "2026-01-05" + "09:30" -> 2026-01-05T09:30:00.000Z
  return new Date(`${dateStr}T${timeHHMM}:00.000Z`);
}

export function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60000);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function formatHHMM(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
