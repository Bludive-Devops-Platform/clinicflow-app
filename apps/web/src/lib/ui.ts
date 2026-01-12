export function statusPill(status: string) {
  const base = 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border';
  if (status === 'BOOKED') return `${base}`;
  if (status === 'CANCELLED') return `${base}`;
  if (status === 'RESCHEDULED') return `${base}`;
  if (status === 'COMPLETED') return `${base}`;
  return base;
}
