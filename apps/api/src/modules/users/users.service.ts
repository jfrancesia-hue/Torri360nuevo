import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: { page?: number; limit?: number; role?: string }) {
    const { page = 1, limit = 20, role } = query;
    const where = { tenantId, ...(role && { role: role as Parameters<typeof this.prisma.user.findMany>[0]['where'] extends { role?: infer R } ? R : never }) };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId, ...(role && { role: role as 'ADMIN' | 'OPERATOR' | 'SUPERVISOR' | 'REQUESTER' | 'PROVIDER_USER' | 'AUDITOR' | 'SUPER_ADMIN' }) },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, email: true, name: true, role: true, status: true,
          avatarUrl: true, phone: true, lastLogin: true, createdAt: true,
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    return { data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true, email: true, name: true, role: true, status: true,
        avatarUrl: true, phone: true, lastLogin: true, createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { data: user };
  }

  async create(tenantId: string, dto: {
    email: string;
    name: string;
    password: string;
    role: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findFirst({ where: { tenantId, email: dto.email } });
    if (existing) throw new ConflictException('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        role: dto.role as 'ADMIN' | 'OPERATOR' | 'SUPERVISOR' | 'REQUESTER' | 'PROVIDER_USER' | 'AUDITOR',
        phone: dto.phone,
        passwordHash,
        status: 'ACTIVE',
      },
      select: {
        id: true, email: true, name: true, role: true, status: true, phone: true, createdAt: true,
      },
    });
    return { data: user };
  }

  async update(tenantId: string, id: string, dto: {
    name?: string;
    phone?: string;
    role?: string;
    status?: string;
  }) {
    await this.findOne(tenantId, id);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto as Parameters<typeof this.prisma.user.update>[0]['data'],
      select: { id: true, email: true, name: true, role: true, status: true, phone: true },
    });
    return { data: user };
  }
}
