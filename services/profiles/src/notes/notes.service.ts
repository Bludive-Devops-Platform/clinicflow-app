import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async addVisitNote(staffUserId: string, appointmentId: string, note: string) {
    const scheduling = this.config.get<string>('SCHEDULING_BASE_URL');

    // Validate appointment exists
    try {
      // We'll add this endpoint in scheduling next if you don't have it:
      // GET /appointments/:id (internal-ish)
      const res = await lastValueFrom(this.http.get(`${scheduling}/appointments/${appointmentId}`, { timeout: 3000 }));
      const appt = res.data;

      if (!appt?.patientUserId) throw new Error('Invalid appointment response');

      return this.prisma.visitNote.create({
        data: {
          appointmentId,
          patientUserId: appt.patientUserId,
          staffUserId,
          note,
        },
      });
    } catch {
      throw new BadRequestException('Appointment not found or scheduling service unreachable');
    }
  }

  async notesForAppointment(appointmentId: string) {
    return this.prisma.visitNote.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
