import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toDateOnlyUTC } from '../common/time';

@Injectable()
export class AvailabilityAdminService {
  constructor(private prisma: PrismaService) {}

  async addForProvider(providerId: string, date: string, startTime: string, endTime: string) {
    // basic validation
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      throw new BadRequestException('startTime/endTime must be HH:MM');
    }
    if (startTime >= endTime) throw new BadRequestException('startTime must be < endTime');

    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!provider || !provider.active) throw new BadRequestException('Invalid providerId');

    return this.prisma.availabilityBlock.create({
      data: {
        providerId,
        date: toDateOnlyUTC(date),
        startTime,
        endTime,
      },
    });
  }
}
