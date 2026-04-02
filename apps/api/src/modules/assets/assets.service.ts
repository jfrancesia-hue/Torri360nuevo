import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: {
    propertyId?: string;
    unitId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { propertyId, unitId, status, page = 1, limit = 50 } = query;

    const baseWhere = {
      ...(propertyId
        ? { propertyId }
        : { property: { tenantId } }),
      ...(unitId && { unitId }),
      ...(status && { status: status as 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED' }),
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where: baseWhere,
        include: {
          property: { select: { id: true, name: true } },
          unit: { select: { id: true, identifier: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.asset.count({ where: baseWhere }),
    ]);

    return { data: assets, meta: { total, page, limit } };
  }

  async create(tenantId: string, dto: {
    propertyId: string;
    unitId?: string;
    name: string;
    type: string;
    brand?: string;
    model?: string;
    status?: string;
    installDate?: string;
    warrantyEnd?: string;
    notes?: string;
  }) {
    // Verify property belongs to tenant
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    const asset = await this.prisma.asset.create({
      data: {
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        name: dto.name,
        type: dto.type,
        brand: dto.brand,
        model: dto.model,
        status: (dto.status as 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED') ?? 'ACTIVE',
        installDate: dto.installDate ? new Date(dto.installDate) : undefined,
        warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : undefined,
        notes: dto.notes,
      },
    });

    return { data: asset };
  }

  async update(tenantId: string, id: string, dto: Partial<{
    name: string;
    type: string;
    status: string;
    brand: string;
    model: string;
    installDate: string;
    warrantyEnd: string;
    notes: string;
  }>) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!asset) throw new NotFoundException('Activo no encontrado');

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        status: dto.status as AssetStatus | undefined,
        brand: dto.brand,
        model: dto.model,
        notes: dto.notes,
        installDate: dto.installDate ? new Date(dto.installDate) : undefined,
        warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : undefined,
      },
    });

    return { data: updated };
  }

  async remove(tenantId: string, id: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!asset) throw new NotFoundException('Activo no encontrado');

    await this.prisma.asset.delete({ where: { id } });
    return { data: { deleted: true } };
  }
}
