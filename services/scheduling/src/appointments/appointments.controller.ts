import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { RequireRoles } from '../auth/require-roles';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';
import { NotificationsClient } from '../notifications/notifications.client';

class BookDto {
  @IsString()
  serviceId: string;

  @IsString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  startTime?: string; // HH:MM

  @IsOptional()
  @IsEmail()
  patientEmail?: string;

  @IsOptional()
  @IsString()
  patientName?: string;
}

class RescheduleDto {
  @IsString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  startTime?: string; // HH:MM

  @IsEmail()
  patientEmail: string;

  @IsOptional()
  @IsString()
  patientName?: string;
}

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private appts: AppointmentsService,
    private notify: NotificationsClient,
  ) {}

  private nameFromEmail(email: string) {
    const left = (email || '').split('@')[0] || 'Patient';
    return left.replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  // PATIENT: Book appointment (auto-assign any available provider)
  @RequireRoles('PATIENT')
  @Post()
  async book(@Req() req: any, @Body() dto: BookDto) {
    const appt = await this.appts.bookAnyAvailable(
      req.user.id,
      dto.serviceId,
      dto.date,
      dto.startTime,
    );

    const serviceName = await this.appts.getServiceName(dto.serviceId);

    // fire-and-forget style (don’t block response)
    this.notify.bookingConfirmation({
      recipient: req.user.email,
      patientName: this.nameFromEmail(req.user.email),
      serviceName,
      startAt: appt.startAt.toISOString(),
      clinicName: 'ClinicFlow Demo Clinic',
    });

    return {
      appointmentId: appt.id,
      providerId: appt.providerId,
      startAt: appt.startAt,
      endAt: appt.endAt,
      status: appt.status,
    };
  }

  // PATIENT: View own appointments (demo-ready)
  @RequireRoles('PATIENT')
  @Get('mine')
  async mine(@Req() req: any) {
    return this.appts.myAppointments(req.user.id);
  }

  // STAFF: View own schedule for a given date
  @RequireRoles('STAFF')
  @Get('provider/mine')
  async mySchedule(@Req() req: any, @Query('date') date: string) {
    return this.appts.providerSchedule(req.user.id, date);
  }

   // Internal-ish: used by Profiles service to validate appointment + get patientUserId
  @Get(':id')
  async getOne(@Param('id') id: string) {
    const appt = await this.appts.getById(id);
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }
 
  // PATIENT: Cancel appointment
  @RequireRoles('PATIENT')
  @Delete(':id')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.appts.cancel(req.user.id, id);
  }

  // PATIENT: Reschedule appointment (auto-assign any available provider again)
  @RequireRoles('PATIENT')
  @Patch(':id/reschedule')
  async reschedule(@Req() req: any, @Param('id') id: string, @Body() dto: RescheduleDto) {
    const result = await this.appts.reschedule(req.user.id, id, dto.date, dto.startTime);

    // result.newAppt should exist based on your implementation
    const serviceName = await this.appts.getServiceName(result.newAppt.serviceId);

    this.notify.bookingConfirmation({
      recipient: req.user.email,
      patientName: this.nameFromEmail(req.user.email),
      serviceName,
      startAt: result.newAppt.startAt.toISOString(),
      clinicName: 'ClinicFlow Demo Clinic',
    });

    return result;
  }
}
