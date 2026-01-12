import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsClient } from './notifications.client';

@Module({
  imports: [HttpModule],   
  providers: [NotificationsClient],
  exports: [NotificationsClient],
})
export class NotificationsModule {}
