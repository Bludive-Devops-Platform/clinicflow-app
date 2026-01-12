import { Module } from '@nestjs/common';
import { NotifyController } from './notify.controller';
import { NotifyService } from './notify.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerService } from './mailer.service';

@Module({
  imports: [PrismaModule],
  controllers: [NotifyController],
  providers: [NotifyService, MailerService],
})
export class NotifyModule {}
