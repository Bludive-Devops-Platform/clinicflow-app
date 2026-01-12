import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityAdminService } from './availability-admin.service';
import { RequireRoles } from '../auth/require-roles';
import { ProvidersService } from '../providers/providers.service';

class AddAvailabilityAdminDto {
  providerId: string;
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

class AddAvailabilitySelfDto {
  date: string;
  startTime: string;
  endTime: string;
}

@Controller('availability')
export class AvailabilityController {
  constructor(
    private availability: AvailabilityService,
    private adminAvailability: AvailabilityAdminService,
    private providers: ProvidersService,
  ) {}

  // Anyone logged in can view daily slots for a service
  @RequireRoles('PATIENT', 'STAFF', 'ADMIN')
  @Get()
  get(@Query('date') date: string, @Query('serviceId') serviceId: string) {
    return this.availability.getDailyAvailability(date, serviceId);
  }

  // ADMIN adds availability for any provider
  @RequireRoles('ADMIN')
  @Post()
  addAdmin(@Body() dto: AddAvailabilityAdminDto) {
    return this.adminAvailability.addForProvider(dto.providerId, dto.date, dto.startTime, dto.endTime);
  }

  // STAFF adds availability for self (based on their Identity userId)
  @RequireRoles('STAFF')
  @Post('self')
  async addSelf(@Req() req: any, @Body() dto: AddAvailabilitySelfDto) {
    const provider = await this.providers.findByUserId(req.user.id);
    if (!provider) {
      // staff exists in Identity but is not created as a provider yet
      throw new Error('No Provider record for this staff. Ask admin to create provider first.');
    }
    return this.adminAvailability.addForProvider(provider.id, dto.date, dto.startTime, dto.endTime);
  }
}
