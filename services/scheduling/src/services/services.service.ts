import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  listActive() {
    return this.prisma.clinicService.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, durationMinutes: true, active: true },
    });
  }
}
