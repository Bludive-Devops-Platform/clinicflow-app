import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class IdentityAuthGuard implements CanActivate {
  constructor(
    private http: HttpService,
    private config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = auth.substring('Bearer '.length);
    const baseUrl = this.config.get<string>('IDENTITY_BASE_URL');

    try {
      const res = await lastValueFrom(
        this.http.get(`${baseUrl}/me`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 3000,
        }),
      );

      req.user = res.data;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
