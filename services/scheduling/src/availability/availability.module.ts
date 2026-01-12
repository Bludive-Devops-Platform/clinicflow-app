import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityAdminService } from './availability-admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProvidersModule } from '../providers/providers.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, ProvidersModule, HttpModule],   // <-- IMPORTANT (so ProvidersService is available)
  controllers: [AvailabilityController],
  providers: [
    AvailabilityService,
    AvailabilityAdminService,                 // <-- IMPORTANT (so Nest can inject it)
  ],
})
export class AvailabilityModule {}
