import { Controller, Get, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { IdentityAuthGuard } from '../auth/identity-auth.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @UseGuards(IdentityAuthGuard)
  @Get()
  list() {
    return this.services.listActive();
  }
}
