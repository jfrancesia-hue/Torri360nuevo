import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getSlaConfigs(tenantId: string) {
    const configs = await this.prisma.slaConfig.findMany({
      where: { tenantId },
      orderBy: { priority: 'asc' },
    });
    return { data: configs };
  }

  async updateSlaConfig(tenantId: string, slaId: string, dto: {
    responseTimeHours?: number;
    resolutionTimeHours?: number;
  }) {
    const config = await this.prisma.slaConfig.findFirst({ where: { id: slaId, tenantId } });
    if (!config) throw new NotFoundException('Configuración SLA no encontrada');

    const updated = await this.prisma.slaConfig.update({
      where: { id: slaId },
      data: dto,
    });

    return { data: updated };
  }

  async getProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, plan: true, status: true, createdAt: true },
    });
    return { data: tenant };
  }
}
