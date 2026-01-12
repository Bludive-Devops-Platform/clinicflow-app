import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async createProvider(userId: string, specialty?: string) {
    // userId is from Identity service (STAFF user)
    try {
      return await this.prisma.provider.create({
        data: { userId, specialty: specialty || null, active: true },
        select: { id: true, userId: true, specialty: true, active: true, createdAt: true },
      });
    } catch {
      throw new BadRequestException('Provider already exists for this userId (or invalid input)');
    }
  }

  listProviders() {
    return this.prisma.provider.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, userId: true, specialty: true, active: true },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.provider.findUnique({ where: { userId } });
  }
}
