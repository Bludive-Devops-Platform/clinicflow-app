import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Role, hasRole } from './roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private allowed: Role[]) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.role) throw new ForbiddenException('Missing role');
    if (!hasRole(user.role, this.allowed)) throw new ForbiddenException('Insufficient permissions');

    return true;
  }
}
