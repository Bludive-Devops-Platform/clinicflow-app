import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NotificationsClient {
  private readonly logger = new Logger(NotificationsClient.name);

  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async bookingConfirmation(payload: {
    recipient: string;
    patientName: string;
    serviceName: string;
    startAt: string;
    clinicName?: string;
  }) {
    const base = this.config.get<string>('NOTIFICATIONS_BASE_URL');
    if (!base) {
      this.logger.warn('NOTIFICATIONS_BASE_URL not set; skipping notification');
      return;
    }

    try {
      await lastValueFrom(
        this.http.post(`${base}/notify/booking-confirmation`, payload, { timeout: 3000 }),
      );
    } catch (e: any) {
      // Do NOT block booking — just log
      this.logger.warn(`Booking confirmation failed: ${e?.message ?? 'unknown error'}`);
    }
  }
}
