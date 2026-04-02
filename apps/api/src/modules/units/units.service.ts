import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  private async getUnit(tenantId: string, id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!unit) throw new NotFoundException('Unidad no encontrada');
    return unit;
  }

  async update(tenantId: string, id: string, dto: Partial<{
    identifier: string;
    floor: string;
    type: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
  }>) {
    await this.getUnit(tenantId, id);
    const unit = await this.prisma.unit.update({
      where: { id },
      data: dto as Parameters<typeof this.prisma.unit.update>[0]['data'],
    });
    return { data: unit };
  }

  async remove(tenantId: string, id: string) {
    await this.getUnit(tenantId, id);
    await this.prisma.unit.delete({ where: { id } });
    return { data: { deleted: true } };
  }
}
