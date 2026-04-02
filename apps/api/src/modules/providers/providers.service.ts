import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@toori360/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    tradeId?: string;
  }) {
    const { page = 1, limit = 20, search, status, tradeId } = query;

    const where: Prisma.ProviderWhereInput = {
      tenantId,
      ...(status && { status: status as Prisma.EnumProviderStatusFilter }),
      ...(tradeId && { trades: { some: { tradeId } } }),
      ...(search && {
        OR: [
          { businessName: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [providers, total] = await Promise.all([
      this.prisma.provider.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { avgRating: 'desc' },
        include: {
          trades: { include: { trade: { select: { id: true, name: true, icon: true } } } },
          _count: { select: { tickets: true, ratings: true } },
        },
      }),
      this.prisma.provider.count({ where }),
    ]);

    return {
      data: providers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, tenantId },
      include: {
        trades: { include: { trade: true } },
        ratings: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { tickets: true, quotes: true, visits: true } },
      },
    });

    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    return { data: provider };
  }

  async create(tenantId: string, dto: CreateProviderDto) {
    const provider = await this.prisma.provider.create({
      data: { tenantId, ...dto, status: 'PENDING' },
    });
    return { data: provider };
  }

  async update(tenantId: string, id: string, dto: Partial<CreateProviderDto> & { status?: string }) {
    await this.findOne(tenantId, id);
    const provider = await this.prisma.provider.update({
      where: { id },
      data: dto as Prisma.ProviderUpdateInput,
    });
    return { data: provider };
  }

  async addTrade(tenantId: string, providerId: string, tradeId: string, data: {
    coverageZones?: string[];
    hourlyRate?: number;
    availableHours?: Record<string, string>;
  }) {
    await this.findOne(tenantId, providerId);

    const providerTrade = await this.prisma.providerTrade.upsert({
      where: { providerId_tradeId: { providerId, tradeId } },
      update: {
        coverageZones: data.coverageZones || [],
        hourlyRate: data.hourlyRate,
        availableHours: data.availableHours || {},
      },
      create: {
        providerId,
        tradeId,
        coverageZones: data.coverageZones || [],
        hourlyRate: data.hourlyRate,
        availableHours: data.availableHours || {},
      },
    });

    return { data: providerTrade };
  }

  async getStats(tenantId: string, providerId: string) {
    await this.findOne(tenantId, providerId);

    const [totalTickets, openTickets, totalRatings, avgRating] = await Promise.all([
      this.prisma.ticket.count({ where: { tenantId, providerId } }),
      this.prisma.ticket.count({
        where: {
          tenantId,
          providerId,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      }),
      this.prisma.rating.count({ where: { providerId } }),
      this.prisma.rating.aggregate({
        where: { providerId },
        _avg: { score: true },
      }),
    ]);

    return {
      data: {
        totalTickets,
        openTickets,
        totalRatings,
        avgRating: avgRating._avg.score || 0,
      },
    };
  }
}
