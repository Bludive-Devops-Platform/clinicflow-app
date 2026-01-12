import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addMinutes, overlaps, toDateOnlyUTC, toDateTimeUTC } from '../common/time';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Public booking endpoint (Patient).
   * Uses one DB transaction and delegates core logic to bookAnyAvailableTx().
   */
  async bookAnyAvailable(
    patientUserId: string,
    serviceId: string,
    date: string,
    startTime?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      return this.bookAnyAvailableTx(tx, patientUserId, serviceId, date, startTime);
    });
  }

  /**
   * Core booking logic that MUST run inside an existing transaction.
   * This is what we reuse for reschedule.
   */
  private async bookAnyAvailableTx(
    tx: Prisma.TransactionClient,
    patientUserId: string,
    serviceId: string,
    date: string,
    startTime?: string,
  ) {
    const svc = await tx.clinicService.findUnique({ where: { id: serviceId } });
    if (!svc || !svc.active) throw new BadRequestException('Invalid service');

    const dateOnly = toDateOnlyUTC(date);

    // Find candidate providers with availability that day (deterministic "first available")
    const providers = await tx.provider.findMany({
      where: { active: true, availability: { some: { date: dateOnly } } },
      include: { availability: { where: { date: dateOnly } } },
      orderBy: { createdAt: 'asc' },
    });

    if (providers.length === 0) {
      throw new BadRequestException('No providers available on this date');
    }

    const desiredStart = startTime ? toDateTimeUTC(date, startTime) : null;
    const desiredEnd = desiredStart ? addMinutes(desiredStart, svc.durationMinutes) : null;

    // For each provider, check if they can take the desired slot, or find earliest slot.
    for (const p of providers) {
      const dayStart = toDateTimeUTC(date, '00:00');
      const dayEnd = toDateTimeUTC(date, '23:59');

      const existing = await tx.appointment.findMany({
        where: {
          providerId: p.id,
          status: { not: 'CANCELLED' },
          startAt: { gte: dayStart, lte: dayEnd },
        },
        select: { startAt: true, endAt: true },
      });

      // Try desired time first if provided
      if (desiredStart && desiredEnd) {
        const inBlock = p.availability.some((b) => {
          const bStart = toDateTimeUTC(date, b.startTime);
          const bEnd = toDateTimeUTC(date, b.endTime);
          return desiredStart >= bStart && desiredEnd <= bEnd;
        });

        if (!inBlock) continue;

        const busy = existing.some((a) => overlaps(desiredStart, desiredEnd, a.startAt, a.endAt));
        if (busy) continue;

        return tx.appointment.create({
          data: {
            patientUserId,
            providerId: p.id,
            serviceId,
            startAt: desiredStart,
            endAt: desiredEnd,
            status: 'BOOKED',
          },
        });
      }

      // If no startTime given: find earliest slot for this provider
      for (const b of p.availability) {
        let cursor = toDateTimeUTC(date, b.startTime);
        const bEnd = toDateTimeUTC(date, b.endTime);

        while (addMinutes(cursor, svc.durationMinutes) <= bEnd) {
          const slotStart = cursor;
          const slotEnd = addMinutes(cursor, svc.durationMinutes);

          const busy = existing.some((a) => overlaps(slotStart, slotEnd, a.startAt, a.endAt));
          if (!busy) {
            return tx.appointment.create({
              data: {
                patientUserId,
                providerId: p.id,
                serviceId,
                startAt: slotStart,
                endAt: slotEnd,
                status: 'BOOKED',
              },
            });
          }

          cursor = addMinutes(cursor, svc.durationMinutes);
        }
      }
    }

    throw new BadRequestException('No available slot for selected time/date');
  }

  // ----------------------------
  // Demo-ready endpoints
  // ----------------------------

  async myAppointments(patientUserId: string) {
    const rows = await this.prisma.appointment.findMany({
      where: { patientUserId },
      orderBy: { startAt: 'asc' },
      include: {
        service: { select: { name: true, durationMinutes: true } },
        provider: { select: { id: true, userId: true, specialty: true } },
      },
    });

    return rows.map((a) => ({
      id: a.id,
      service: a.service.name,
      providerId: a.providerId,
      providerUserId: a.provider.userId,
      specialty: a.provider.specialty,
      startAt: a.startAt,
      endAt: a.endAt,
      status: a.status,
    }));
  }

    async getServiceName(serviceId: string) {
    const svc = await this.prisma.clinicService.findUnique({ where: { id: serviceId } });
    return svc?.name ?? 'Clinic Service';
  }

    async getById(appointmentId: string) {
    return this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        patientUserId: true,
        providerId: true,
        serviceId: true,
        startAt: true,
        endAt: true,
        status: true,
      },
    });
  }

  async providerSchedule(providerUserId: string, date: string) {
    const provider = await this.prisma.provider.findUnique({ where: { userId: providerUserId } });
    if (!provider) return [];

    const dayStart = toDateTimeUTC(date, '00:00');
    const dayEnd = toDateTimeUTC(date, '23:59');

    const rows = await this.prisma.appointment.findMany({
      where: {
        providerId: provider.id,
        status: { not: 'CANCELLED' },
        startAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { startAt: 'asc' },
      include: { service: { select: { name: true } } },
    });

    return rows.map((i) => ({
      id: i.id,
      patientUserId: i.patientUserId,
      service: i.service.name,
      startAt: i.startAt,
      endAt: i.endAt,
      status: i.status,
    }));
  }

  async cancel(patientUserId: string, appointmentId: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.patientUserId !== patientUserId) throw new ForbiddenException('Not your appointment');

    if (appt.status === 'CANCELLED') return appt;

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED' },
    });
  }

  async reschedule(patientUserId: string, appointmentId: string, newDate: string, newStartTime?: string) {
    return this.prisma.$transaction(async (tx) => {
      const oldAppt = await tx.appointment.findUnique({ where: { id: appointmentId } });
      if (!oldAppt) throw new NotFoundException('Appointment not found');
      if (oldAppt.patientUserId !== patientUserId) throw new ForbiddenException('Not your appointment');
      if (oldAppt.status === 'CANCELLED') throw new BadRequestException('Cannot reschedule a cancelled appointment');

      // Keep history
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'RESCHEDULED' },
      });

      // Create the new booking (auto-assign any available)
      const newAppt = await this.bookAnyAvailableTx(
        tx,
        patientUserId,
        oldAppt.serviceId,
        newDate,
        newStartTime,
      );

      return {
        oldAppointmentId: appointmentId,
        newAppointmentId: newAppt.id,
        newAppt,
      };
    });
  }
}
