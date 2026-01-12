import { applyDecorators, UseGuards } from '@nestjs/common';
import { IdentityAuthGuard } from './identity-auth.guard';
import { RolesGuard } from './roles.guard';
import { Role } from './roles';

export function RequireRoles(...roles: Role[]) {
  return applyDecorators(
    UseGuards(IdentityAuthGuard),
    UseGuards(new RolesGuard(roles)),
  );
}
