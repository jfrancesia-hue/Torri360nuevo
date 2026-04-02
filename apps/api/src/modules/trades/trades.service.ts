import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TradesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { tenantId, parentId: null },
      include: {
        children: true,
        _count: { select: { providers: true } },
      },
      orderBy: { name: 'asc' },
    });
    return { data: trades };
  }

  async create(tenantId: string, dto: { name: string; icon?: string; parentId?: string }) {
    const trade = await this.prisma.trade.create({
      data: { tenantId, ...dto },
    });
    return { data: trade };
  }

  async update(tenantId: string, id: string, dto: { name?: string; icon?: string }) {
    const existing = await this.prisma.trade.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Rubro no encontrado');

    const trade = await this.prisma.trade.update({ where: { id }, data: dto });
    return { data: trade };
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.trade.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Rubro no encontrado');

    await this.prisma.trade.delete({ where: { id } });
    return { data: { message: 'Rubro eliminado' } };
  }
}
