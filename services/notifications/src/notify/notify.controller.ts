import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { NotifyService } from './notify.service';
import { BookingConfirmationDto, ReminderDto } from './dto';

@Controller('notify')
export class NotifyController {
  constructor(private notify: NotifyService) {}

  @Post('booking-confirmation')
  booking(@Body() dto: BookingConfirmationDto) {
    return this.notify.bookingConfirmation(dto);
  }

  @Post('reminder')
  reminder(@Body() dto: ReminderDto) {
    return this.notify.reminder(dto);
  }

  @Get('logs')
  logs(@Query('limit') limit?: string) {
    return this.notify.logs(limit ? Number(limit) : 50);
  }
}
