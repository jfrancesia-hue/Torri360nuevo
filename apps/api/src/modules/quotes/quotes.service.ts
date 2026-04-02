import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPayload } from '@toori360/shared';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async requestQuote(tenantId: string, ticketId: string, providerIds: string[], user: UserPayload) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'AWAITING_QUOTE' },
    });

    await this.prisma.ticketEvent.create({
      data: {
        ticketId,
        userId: user.id,
        eventType: 'QUOTE_SENT',
        data: { providerIds, requestedAt: new Date().toISOString() },
        visibility: 'INTERNAL',
      },
    });

    return { data: { message: `Presupuesto solicitado a ${providerIds.length} proveedor(es)` } };
  }

  async create(tenantId: string, ticketId: string, dto: {
    providerId: string;
    amount: number;
    currency?: string;
    description: string;
    estimatedDays?: number;
    conditions?: string;
  }, user: UserPayload) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const quote = await this.prisma.quote.create({
      data: {
        ticketId,
        providerId: dto.providerId,
        amount: dto.amount,
        currency: dto.currency || 'ARS',
        description: dto.description,
        estimatedDays: dto.estimatedDays,
        conditions: dto.conditions,
        status: 'PENDING',
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'QUOTE_RECEIVED' },
    });

    await this.prisma.ticketEvent.create({
      data: {
        ticketId,
        userId: user.id,
        eventType: 'QUOTE_SENT',
        data: { quoteId: quote.id, amount: dto.amount, currency: dto.currency || 'ARS' },
        visibility: 'INTERNAL',
      },
    });

    return { data: quote };
  }

  async findAll(tenantId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const { page = 1, limit = 30, status } = query;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where: {
          ticket: { tenantId },
          ...(status && { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' }),
        },
        include: {
          ticket: { select: { id: true, number: true, title: true, status: true } },
          provider: { select: { id: true, businessName: true, contactName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.quote.count({
        where: {
          ticket: { tenantId },
          ...(status && { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' }),
        },
      }),
    ]);

    return { data: quotes, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findByTicket(tenantId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const quotes = await this.prisma.quote.findMany({
      where: { ticketId },
      include: {
        provider: { select: { id: true, businessName: true, avgRating: true, contactName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: quotes };
  }

  async approve(tenantId: string, quoteId: string, user: UserPayload) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId },
      include: { ticket: true },
    });

    if (!quote || quote.ticket.tenantId !== tenantId) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (quote.status !== 'PENDING') {
      throw new BadRequestException('El presupuesto ya fue procesado');
    }

    const updatedQuote = await this.prisma.$transaction(async (tx) => {
      const [approved] = await Promise.all([
        tx.quote.update({
          where: { id: quoteId },
          data: { status: 'APPROVED', approvedBy: user.id, approvedAt: new Date() },
        }),
        tx.quote.updateMany({
          where: { ticketId: quote.ticketId, id: { not: quoteId }, status: 'PENDING' },
          data: { status: 'REJECTED' },
        }),
        tx.ticket.update({
          where: { id: quote.ticketId },
          data: { status: 'APPROVED', providerId: quote.providerId },
        }),
        tx.ticketEvent.create({
          data: {
            ticketId: quote.ticketId,
            userId: user.id,
            eventType: 'QUOTE_APPROVED',
            data: { quoteId, amount: quote.amount },
            visibility: 'ALL',
          },
        }),
      ]);
      return approved;
    });

    return { data: updatedQuote };
  }

  async reject(tenantId: string, quoteId: string, reason: string, user: UserPayload) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId },
      include: { ticket: true },
    });

    if (!quote || quote.ticket.tenantId !== tenantId) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (quote.status !== 'PENDING') {
      throw new BadRequestException('Solo se pueden rechazar presupuestos pendientes');
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    await this.prisma.ticketEvent.create({
      data: {
        ticketId: quote.ticketId,
        userId: user.id,
        eventType: 'QUOTE_REJECTED',
        data: { quoteId, reason },
        visibility: 'ALL',
      },
    });

    return { data: updatedQuote };
  }
}
