import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';

@Injectable()
export class NotifyService {
  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {}

  private buildHtml(title: string, body: string) {
    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>${title}</h2>
        <p>${body}</p>
        <p style="margin-top:20px;color:#666;">ClinicFlow</p>
      </div>
    `;
  }

  async bookingConfirmation(payload: any) {
    const subject = `Appointment Confirmed — ${payload.serviceName}`;
    const html = this.buildHtml(
      'Appointment Confirmed',
      `Hello <b>${payload.patientName}</b>, your appointment for <b>${payload.serviceName}</b> is confirmed for <b>${payload.startAt}</b>.`,
    );

    const job = await this.prisma.notificationJob.create({
      data: {
        type: 'BOOKING_CONFIRMATION',
        recipient: payload.recipient,
        subject,
        payload,
        status: 'PENDING',
      },
    });

    try {
      await this.mailer.send(payload.recipient, subject, html);

      await this.prisma.deliveryLog.create({
        data: { jobId: job.id, provider: 'smtp', success: true, message: 'Sent via SMTP' },
      });

      return this.prisma.notificationJob.update({
        where: { id: job.id },
        data: { status: 'SENT' },
      });
    } catch (e: any) {
      await this.prisma.deliveryLog.create({
        data: { jobId: job.id, provider: 'smtp', success: false, message: e?.message ?? 'Send failed' },
      });

      return this.prisma.notificationJob.update({
        where: { id: job.id },
        data: { status: 'FAILED' },
      });
    }
  }

  async reminder(payload: any) {
    const subject = `Appointment Reminder — ${payload.serviceName}`;
    const html = this.buildHtml(
      'Appointment Reminder',
      `Hello <b>${payload.patientName}</b>, this is a reminder for your <b>${payload.serviceName}</b> appointment at <b>${payload.startAt}</b>.`,
    );

    const job = await this.prisma.notificationJob.create({
      data: {
        type: 'APPOINTMENT_REMINDER',
        recipient: payload.recipient,
        subject,
        payload,
        status: 'PENDING',
      },
    });

    try {
      await this.mailer.send(payload.recipient, subject, html);

      await this.prisma.deliveryLog.create({
        data: { jobId: job.id, provider: 'smtp', success: true, message: 'Sent via SMTP' },
      });

      return this.prisma.notificationJob.update({
        where: { id: job.id },
        data: { status: 'SENT' },
      });
    } catch (e: any) {
      await this.prisma.deliveryLog.create({
        data: { jobId: job.id, provider: 'smtp', success: false, message: e?.message ?? 'Send failed' },
      });

      return this.prisma.notificationJob.update({
        where: { id: job.id },
        data: { status: 'FAILED' },
      });
    }
  }

  async logs(limit = 50) {
    return this.prisma.notificationJob.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { deliveries: true },
    });
  }
}
