import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMinutes, overlaps, toDateOnlyUTC, toDateTimeUTC, formatHHMM } from '../common/time';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getDailyAvailability(date: string, serviceId: string) {
    const svc = await this.prisma.clinicService.findUnique({ where: { id: serviceId } });
    if (!svc || !svc.active) throw new BadRequestException('Invalid service');

    const dateOnly = toDateOnlyUTC(date);

    // active providers who have availability blocks that day
    const providers = await this.prisma.provider.findMany({
      where: {
        active: true,
        availability: { some: { date: dateOnly } },
      },
      include: { availability: { where: { date: dateOnly } } },
      orderBy: { createdAt: 'asc' },
    });

    // pull appointments for that day (non-cancelled)
    const dayStart = toDateTimeUTC(date, '00:00');
    const dayEnd = toDateTimeUTC(date, '23:59');

    const appts = await this.prisma.appointment.findMany({
      where: {
        status: { not: 'CANCELLED' },
        startAt: { gte: dayStart, lte: dayEnd },
      },
      select: { providerId: true, startAt: true, endAt: true },
    });

    // Build slot map: "09:00" -> {start,end,count}
    const slotMap = new Map<string, { start: Date; end: Date; count: number }>();

    for (const p of providers) {
      const pAppts = appts.filter(a => a.providerId === p.id);

      for (const block of p.availability) {
        // block.startTime/endTime are HH:MM
        let cursor = toDateTimeUTC(date, block.startTime);
        const blockEnd = toDateTimeUTC(date, block.endTime);

        while (addMinutes(cursor, svc.durationMinutes) <= blockEnd) {
          const slotStart = cursor;
          const slotEnd = addMinutes(cursor, svc.durationMinutes);

          const busy = pAppts.some(a => overlaps(slotStart, slotEnd, a.startAt, a.endAt));
          if (!busy) {
            const key = formatHHMM(slotStart);
            const existing = slotMap.get(key);
            if (!existing) slotMap.set(key, { start: slotStart, end: slotEnd, count: 1 });
            else existing.count += 1;
          }

          cursor = addMinutes(cursor, svc.durationMinutes);
        }
      }
    }

    return Array.from(slotMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([startTime, v]) => ({
        startTime,
        endTime: formatHHMM(v.end),
        availableProviders: v.count,
      }));
  }
}
