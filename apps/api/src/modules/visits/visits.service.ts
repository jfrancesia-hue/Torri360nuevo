import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPayload, isValidTransition, TicketStatus } from '@toori360/shared';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: {
    ticketId: string;
    providerId: string;
    scheduledAt: string;
    windowStart?: string;
    windowEnd?: string;
    notes?: string;
  }, user: UserPayload) {
    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      throw new BadRequestException('La visita debe programarse para una fecha futura');
    }

    const ticket = await this.prisma.ticket.findFirst({ where: { id: dto.ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const visit = await this.prisma.visit.create({
      data: {
        ticketId: dto.ticketId,
        providerId: dto.providerId,
        scheduledAt: new Date(dto.scheduledAt),
        windowStart: dto.windowStart,
        windowEnd: dto.windowEnd,
        notes: dto.notes,
        status: 'SCHEDULED',
      },
    });

    await Promise.all([
      this.prisma.ticket.update({
        where: { id: dto.ticketId },
        data: { status: 'SCHEDULING_VISIT' },
      }),
      this.prisma.ticketEvent.create({
        data: {
          ticketId: dto.ticketId,
          userId: user.id,
          eventType: 'VISIT_SCHEDULED',
          data: {
            visitId: visit.id,
            scheduledAt: dto.scheduledAt,
            providerId: dto.providerId,
          },
          visibility: 'ALL',
        },
      }),
    ]);

    return { data: visit };
  }

  async confirm(tenantId: string, visitId: string, user: UserPayload) {
    const visit = await this.getVisitWithTenant(tenantId, visitId);

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: { status: 'CONFIRMED' },
    });

    await this.prisma.ticketEvent.create({
      data: {
        ticketId: visit.ticketId,
        userId: user.id,
        eventType: 'VISIT_CONFIRMED',
        data: { visitId },
        visibility: 'ALL',
      },
    });

    return { data: updated };
  }

  async checkin(tenantId: string, visitId: string, lat: number, lng: number, user: UserPayload) {
    const visit = await this.getVisitWithTenant(tenantId, visitId);

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: { status: 'IN_PROGRESS', checkinAt: new Date(), checkinLat: lat, checkinLng: lng },
    });

    await Promise.all([
      this.prisma.ticket.update({
        where: { id: visit.ticketId },
        data: { status: 'IN_PROGRESS' },
      }),
      this.prisma.ticketEvent.create({
        data: {
          ticketId: visit.ticketId,
          userId: user.id,
          eventType: 'CHECKIN',
          data: { visitId, lat, lng, checkinAt: new Date().toISOString() },
          visibility: 'ALL',
        },
      }),
    ]);

    return { data: updated };
  }

  async checkout(tenantId: string, visitId: string, notes: string, user: UserPayload) {
    const visit = await this.getVisitWithTenant(tenantId, visitId);

    if (visit.status !== 'IN_PROGRESS') {
      throw new BadRequestException('La visita no está en curso');
    }

    const ticket = await this.prisma.ticket.findFirst({ where: { id: visit.ticketId } });
    if (ticket && !isValidTransition(ticket.status as TicketStatus, TicketStatus.COMPLETED)) {
      throw new BadRequestException(`No se puede completar el ticket desde el estado ${ticket.status}`);
    }

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: { status: 'COMPLETED', checkoutAt: new Date(), notes },
    });

    await Promise.all([
      this.prisma.ticket.update({
        where: { id: visit.ticketId },
        data: { status: 'COMPLETED' },
      }),
      this.prisma.ticketEvent.create({
        data: {
          ticketId: visit.ticketId,
          userId: user.id,
          eventType: 'CHECKOUT',
          data: { visitId, notes, checkoutAt: new Date().toISOString() },
          visibility: 'ALL',
        },
      }),
    ]);

    return { data: updated };
  }

  async update(tenantId: string, visitId: string, dto: {
    scheduledAt?: string;
    windowStart?: string;
    windowEnd?: string;
    status?: string;
    rescheduleReason?: string;
  }, user: UserPayload) {
    const visit = await this.getVisitWithTenant(tenantId, visitId);

    const updated = await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.windowStart && { windowStart: dto.windowStart }),
        ...(dto.windowEnd && { windowEnd: dto.windowEnd }),
        ...(dto.status && { status: dto.status as 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'RESCHEDULED' }),
        ...(dto.rescheduleReason && { rescheduleReason: dto.rescheduleReason }),
      },
    });

    if (dto.scheduledAt) {
      await this.prisma.ticketEvent.create({
        data: {
          ticketId: visit.ticketId,
          userId: user.id,
          eventType: 'VISIT_RESCHEDULED',
          data: { visitId, newDate: dto.scheduledAt, reason: dto.rescheduleReason },
          visibility: 'ALL',
        },
      });
    }

    return { data: updated };
  }

  async getCalendar(tenantId: string, from: string, to: string) {
    const visits = await this.prisma.visit.findMany({
      where: {
        ticket: { tenantId },
        scheduledAt: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: {
        ticket: { select: { id: true, number: true, title: true, status: true, priority: true } },
        provider: { select: { id: true, businessName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return { data: visits };
  }

  async findByTicket(tenantId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, tenantId } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    const visits = await this.prisma.visit.findMany({
      where: { ticketId },
      orderBy: { scheduledAt: 'desc' },
    });

    return { data: visits };
  }

  private async getVisitWithTenant(tenantId: string, visitId: string) {
    const visit = await this.prisma.visit.findFirst({
      where: { id: visitId, ticket: { tenantId } },
    });
    if (!visit) throw new NotFoundException('Visita no encontrada');
    return visit;
  }
}
