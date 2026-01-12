import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(email: string, passwordHash: string, role: Role = Role.PATIENT) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already exists');

    return this.prisma.user.create({
      data: { email, passwordHash, role },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }
    // ... inside UsersService
  async updateRole(userId: string, role: Role) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, role: true, createdAt: true },
      });
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}
