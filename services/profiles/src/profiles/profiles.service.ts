import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UpdateProfile = {
  fullName?: string;
  phone?: string;
  dob?: string;
  address?: string;
  emergencyContact?: string;
};

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getOrCreatePatient(userId: string) {
    return this.prisma.patientProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePatient(userId: string, data: UpdateProfile) {
    return this.prisma.patientProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getPatientByUserId(userId: string) {
    return this.prisma.patientProfile.findUnique({ where: { userId } });
  }
}
