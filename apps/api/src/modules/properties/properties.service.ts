import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@toori360/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: ListPropertiesDto) {
    const { page = 1, limit = 20, search, type } = query;

    const where: Prisma.PropertyWhereInput = {
      tenantId,
      ...(type && { type: type as Prisma.EnumPropertyTypeFilter }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { units: true, tickets: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId },
      include: {
        units: { orderBy: { identifier: 'asc' } },
        assets: true,
        children: { include: { _count: { select: { units: true } } } },
        _count: { select: { tickets: true } },
      },
    });

    if (!property) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    return { data: property };
  }

  async create(tenantId: string, dto: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data: { tenantId, ...dto },
    });
    return { data: property };
  }

  async update(tenantId: string, id: string, dto: Partial<CreatePropertyDto>) {
    await this.findOne(tenantId, id);
    const property = await this.prisma.property.update({
      where: { id },
      data: dto,
    });
    return { data: property };
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.property.delete({ where: { id } });
    return { data: { message: 'Propiedad eliminada' } };
  }

  async getUnits(tenantId: string, propertyId: string) {
    await this.findOne(tenantId, propertyId);

    const units = await this.prisma.unit.findMany({
      where: { propertyId },
      orderBy: { identifier: 'asc' },
      include: { _count: { select: { tickets: true } } },
    });

    return { data: units };
  }

  async createUnit(tenantId: string, propertyId: string, dto: {
    identifier: string;
    floor?: string;
    type: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    await this.findOne(tenantId, propertyId);

    const unit = await this.prisma.unit.create({
      data: { propertyId, ...dto as Parameters<typeof this.prisma.unit.create>[0]['data'] },
    });

    return { data: unit };
  }
}
