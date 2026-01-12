import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { RequireRoles } from '../auth/require-roles';
import { IsOptional, IsString } from 'class-validator';

class CreateProviderDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  specialty?: string;
}

@Controller('providers')
export class ProvidersController {
  constructor(private providers: ProvidersService) {}

  @RequireRoles('ADMIN')
  @Post()
  create(@Body() dto: CreateProviderDto) {
    return this.providers.createProvider(dto.userId, dto.specialty);
  }

  @RequireRoles('ADMIN')
  @Get()
  list() {
    return this.providers.listProviders();
  }
}
