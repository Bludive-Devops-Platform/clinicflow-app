import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: Number(this.config.get<string>('SMTP_PORT') || 1025),
      secure: false,
    });
  }

  async send(to: string, subject: string, html: string, from?: string) {
    const sender = from ?? this.config.get<string>('SMTP_FROM') ?? 'no-reply@clinicflow.com';
    return this.transporter.sendMail({
      from: sender,
      to,
      subject,
      html,
    });
  }
}
