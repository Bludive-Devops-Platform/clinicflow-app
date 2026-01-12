import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

export type Role = 'PATIENT' | 'STAFF' | 'ADMIN';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private allowed: Role[]) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user?.role) throw new ForbiddenException('Missing role');

    if (!this.allowed.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
