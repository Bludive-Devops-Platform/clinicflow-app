import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { IdentityAuthGuard } from '../auth/identity-auth.guard';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [ServicesService, IdentityAuthGuard],
  controllers: [ServicesController],
})
export class ServicesModule {}
