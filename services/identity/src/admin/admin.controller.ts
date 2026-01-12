import { Body, Controller, Param, Patch, UseGuards, Get, Query } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private users: UsersService) {}

  @Get('by-email')
  async getByEmail(@Query('email') email: string) {
    return this.users.findByEmail(email);
  }

  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.users.updateRole(id, dto.role);
  }
}
