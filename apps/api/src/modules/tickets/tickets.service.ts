import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@toori360/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { UpdateTicketDto, ChangeTicketStatusDto, AddTicketEventDto } from './dto/update-ticket.dto';
import {
  TicketStatus,
  Priority,
  UserRole,
  UserPayload,
  isValidTransition,
  generateTicketNumber,
} from '@toori360/shared';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  async findAll(tenantId: string, query: ListTicketsDto, user: UserPayload) {
    const {
      page = 1, limit = 20, status, priority, propertyId, providerId,
      categoryId, requesterId, assigneeId, search, from, to,
      sort = 'createdAt', order = 'desc',
    } = query;

    const where: Prisma.TicketWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(propertyId && { propertyId }),
      ...(providerId && { providerId }),
      ...(categoryId && { categoryId }),
      ...(requesterId && { requesterId }),
      ...(assigneeId && { assigneeId }),
      ...(from || to ? {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      } : {}),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { number: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // REQUESTER only sees their own tickets
    if (user.role === UserRole.REQUESTER) {
      where.requesterId = user.id;
    }

    // PROVIDER_USER only sees assigned tickets
    if (user.role === UserRole.PROVIDER_USER) {
      where.provider = {
        email: user.email,
      };
    }

    const validSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'number'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortField]: order },
        include: {
          property: { select: { id: true, name: true, address: true } },
          unit: { select: { id: true, identifier: true } },
          provider: { select: { id: true, businessName: true, avgRating: true } },
          requester: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true } },
          category: { select: { id: true, name: true, icon: true } },
          trade: { select: { id: true, name: true, icon: true } },
          _count: { select: { events: true, quotes: true, attachments: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, tenantId },
      include: {
        property: true,
        unit: true,
        asset: true,
        category: true,
        trade: true,
        requester: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true } },
        provider: {
          include: { trades: { include: { trade: { select: { name: true } } } } },
        },
        slaConfig: true,
        events: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, role: true } },
            attachments: true,
          },
        },
        quotes: {
          include: {
            provider: { select: { id: true, businessName: true, avgRating: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        visits: {
          orderBy: { scheduledAt: 'desc' },
        },
        attachments: { orderBy: { createdAt: 'desc' } },
        ratings: true,
        checklists: true,
      },
    });

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return { data: ticket };
  }

  async create(tenantId: string, requesterId: string, dto: CreateTicketDto) {
    // Generate ticket number
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const sequence = await this.prisma.$transaction(async (tx) => {
      const seq = await tx.ticketSequence.upsert({
        where: { tenantId },
        update: {
          sequence: { increment: 1 },
          yearMonth,
        },
        create: { tenantId, yearMonth, sequence: 1 },
      });
      return seq.sequence;
    });

    const number = generateTicketNumber(sequence, now);

    // Find SLA config for priority
    const slaConfig = await this.prisma.slaConfig.findUnique({
      where: {
        tenantId_priority: { tenantId, priority: dto.priority || Priority.MEDIUM },
      },
    });

    const ticket = await this.prisma.ticket.create({
      data: {
        tenantId,
        number,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || Priority.MEDIUM,
        categoryId: dto.categoryId,
        tradeId: dto.tradeId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        assetId: dto.assetId,
        requesterId,
        source: dto.source || 'WEB',
        tags: dto.tags || [],
        slaConfigId: slaConfig?.id,
        slaDueAt: slaConfig
          ? new Date(now.getTime() + slaConfig.resolutionTimeHours * 3600000)
          : undefined,
        status: TicketStatus.NEW,
      },
    });

    // Create SYSTEM event
    await this.prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        userId: requesterId,
        eventType: 'SYSTEM',
        data: { message: 'Ticket creado' },
        visibility: 'ALL',
      },
    });

    this.realtime.notifyNewTicket(tenantId, {
      id: ticket.id,
      number: ticket.number,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
    });

    return { data: ticket };
  }

  async update(tenantId: string, id: string, dto: UpdateTicketDto, user: UserPayload) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const prevPriority = ticket.priority;
    const updated = await this.prisma.ticket.update({
      where: { id },
      data: dto as Prisma.TicketUpdateInput,
    });

    // Record priority change event
    if (dto.priority && dto.priority !== prevPriority) {
      await this.prisma.ticketEvent.create({
        data: {
          ticketId: id,
          userId: user.id,
          eventType: 'PRIORITY_CHANGE',
          data: { from: prevPriority, to: dto.priority },
          visibility: 'INTERNAL',
        },
      });
    }

    // Record assignment event
    if (dto.assigneeId && dto.assigneeId !== ticket.assigneeId) {
      await this.prisma.ticketEvent.create({
        data: {
          ticketId: id,
          userId: user.id,
          eventType: 'ASSIGNMENT',
          data: { assigneeId: dto.assigneeId, providerId: dto.providerId },
          visibility: 'INTERNAL',
        },
      });
    }

    this.realtime.notifyTicketUpdated(tenantId, id, { updated: true });

    return { data: updated };
  }

  async changeStatus(tenantId: string, id: string, dto: ChangeTicketStatusDto, user: UserPayload) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    if (!isValidTransition(ticket.status as TicketStatus, dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${ticket.status} → ${dto.status}`,
      );
    }

    const updateData: Prisma.TicketUpdateInput = { status: dto.status };
    if (dto.status === TicketStatus.CLOSED || dto.status === TicketStatus.CANCELLED) {
      updateData.closedAt = new Date();
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.ticketEvent.create({
      data: {
        ticketId: id,
        userId: user.id,
        eventType: 'STATUS_CHANGE',
        data: {
          from: ticket.status,
          to: dto.status,
          ...(dto.reason && { reason: dto.reason }),
        },
        visibility: 'ALL',
      },
    });

    this.realtime.notifyTicketUpdated(tenantId, id, { status: dto.status });

    return { data: updated };
  }

  async addEvent(tenantId: string, id: string, dto: AddTicketEventDto, user: UserPayload) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const event = await this.prisma.ticketEvent.create({
      data: {
        ticketId: id,
        userId: user.id,
        eventType: dto.eventType,
        data: { content: dto.content },
        visibility: dto.visibility || 'ALL',
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    this.realtime.notifyTicketEvent(tenantId, id, {
      id: event.id,
      eventType: event.eventType,
      data: event.data,
      visibility: event.visibility,
      createdAt: event.createdAt,
      user: event.user,
    });

    return { data: event };
  }

  async getTimeline(tenantId: string, id: string, user: UserPayload) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const visibilityFilter: string[] = ['ALL'];
    if (user.role !== UserRole.PROVIDER_USER) {
      visibilityFilter.push('INTERNAL', 'CLIENT');
    }
    if (user.role !== UserRole.REQUESTER) {
      visibilityFilter.push('PROVIDER');
    }

    const events = await this.prisma.ticketEvent.findMany({
      where: {
        ticketId: id,
        visibility: { in: visibilityFilter as ('ALL' | 'INTERNAL' | 'PROVIDER' | 'CLIENT')[] },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
        attachments: true,
      },
    });

    return { data: events };
  }

  async assign(tenantId: string, id: string, providerId: string, user: UserPayload) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const provider = await this.prisma.provider.findFirst({ where: { id: providerId, tenantId } });
    if (!provider) throw new NotFoundException('Proveedor no encontrado');

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        providerId,
        assigneeId: user.id,
        status: TicketStatus.ASSIGNED,
      },
    });

    await this.prisma.ticketEvent.create({
      data: {
        ticketId: id,
        userId: user.id,
        eventType: 'ASSIGNMENT',
        data: {
          providerId,
          providerName: provider.businessName,
          from: ticket.status,
          to: TicketStatus.ASSIGNED,
        },
        visibility: 'INTERNAL',
      },
    });

    return { data: updated };
  }

  async rateProvider(tenantId: string, ticketId: string, score: number, comment: string | undefined, user: UserPayload) {
    if (score < 1 || score > 5 || !Number.isInteger(score)) {
      throw new BadRequestException('La puntuación debe ser un entero entre 1 y 5');
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    if (!ticket.providerId) throw new BadRequestException('El ticket no tiene proveedor asignado');
    if (ticket.status !== TicketStatus.VALIDATED && ticket.status !== TicketStatus.CLOSED) {
      throw new BadRequestException('Solo se puede calificar tickets validados o cerrados');
    }

    const rating = await this.prisma.rating.upsert({
      where: { ticketId_ratedBy: { ticketId, ratedBy: user.id } },
      create: { ticketId, providerId: ticket.providerId, ratedBy: user.id, score, comment },
      update: { score, comment },
    });

    // Recalculate provider avgRating
    const agg = await this.prisma.rating.aggregate({
      where: { providerId: ticket.providerId },
      _avg: { score: true },
    });
    await this.prisma.provider.update({
      where: { id: ticket.providerId },
      data: { avgRating: agg._avg.score ?? 0 },
    });

    await this.prisma.ticketEvent.create({
      data: {
        ticketId,
        userId: user.id,
        eventType: 'SYSTEM',
        data: { message: `Proveedor calificado con ${score}/5${comment ? ` — ${comment}` : ''}`, score },
        visibility: 'INTERNAL',
      },
    });

    return { data: rating };
  }

  async getStats(tenantId: string) {
    const [byStatus, byPriority, total, overSla] = await Promise.all([
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where: { tenantId, status: { notIn: ['CLOSED', 'CANCELLED'] } },
        _count: true,
      }),
      this.prisma.ticket.count({ where: { tenantId } }),
      this.prisma.ticket.count({
        where: {
          tenantId,
          slaDueAt: { lt: new Date() },
          status: { notIn: ['CLOSED', 'CANCELLED', 'VALIDATED'] },
        },
      }),
    ]);

    return {
      data: {
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
        total,
        overSla,
      },
    };
  }
}
