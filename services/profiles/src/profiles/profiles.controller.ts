import { Controller, Get, Patch, Req, Body, Param } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { RequireRoles } from '../auth/require-roles';
import { UpdatePatientProfileDto } from './dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private profiles: ProfilesService) {}

  // Patient: get my profile (auto-create if missing)
  @RequireRoles('PATIENT')
  @Get('me')
  me(@Req() req: any) {
    return this.profiles.getOrCreatePatient(req.user.id);
  }

  // Patient: update my profile
  @RequireRoles('PATIENT')
  @Patch('me')
  update(@Req() req: any, @Body() dto: UpdatePatientProfileDto) {
    return this.profiles.updatePatient(req.user.id, dto);
  }

  // Staff/Admin: view a patient profile by userId
  @RequireRoles('STAFF', 'ADMIN')
  @Get('patient/:userId')
  getPatient(@Param('userId') userId: string) {
    return this.profiles.getPatientByUserId(userId);
  }
}
