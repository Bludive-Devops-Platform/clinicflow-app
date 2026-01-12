import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IdentityAuthGuard } from './identity-auth.guard';

@Global()
@Module({
  imports: [HttpModule, ConfigModule],
  providers: [IdentityAuthGuard],
  exports: [IdentityAuthGuard],
})
export class AuthModule {}
