import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { RealtimeGateway } from '../modules/realtime/realtime.gateway';

@Injectable()
export class SlaCheckerWorker {
  private readonly logger = new Logger(SlaCheckerWorker.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private realtime: RealtimeGateway,
  ) {}

  // Runs every 30 minutes
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkSlaBreaches() {
    this.logger.log('Running SLA breach check...');

    const now = new Date();
    const warningThresholdMs = 2 * 60 * 60 * 1000; // 2 hours warning
    const warningCutoff = new Date(now.getTime() + warningThresholdMs);

    // Tickets already breached (overdue)
    const breached = await this.prisma.ticket.findMany({
      where: {
        slaDueAt: { lt: now },
        status: { notIn: ['CLOSED', 'CANCELLED', 'VALIDATED'] },
        slaAlertSent: false,
      },
      include: {
        requester: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        tenant: { select: { id: true } },
      },
      take: 50,
    });

    await Promise.all(breached.map(async (ticket) => {
      // Update DB atomically
      await this.prisma.$transaction([
        this.prisma.ticketEvent.create({
          data: {
            ticketId: ticket.id,
            eventType: 'SLA_ALERT',
            data: { message: 'SLA vencido', slaDueAt: ticket.slaDueAt?.toISOString() },
            visibility: 'INTERNAL',
          },
        }),
        this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { slaAlertSent: true },
        }),
      ]);

      // Fire notifications in parallel
      const notifyPromises: Promise<void>[] = [];

      if (ticket.assignee?.email) {
        notifyPromises.push(
          this.notifications.sendSlaAlert(
            {
              number: ticket.number,
              title: ticket.title,
              slaDueAt: ticket.slaDueAt?.toISOString() || '',
            },
            ticket.assignee.email,
            ticket.assignee.name,
          ),
        );
      }

      if (ticket.tenant?.id) {
        this.realtime.notifyTicketUpdated(ticket.tenant.id, ticket.id, {
          slaAlert: true,
          slaDueAt: ticket.slaDueAt,
        });
      }

      await Promise.all(notifyPromises);
    }));

    // Tickets about to breach in 2 hours (warning)
    const aboutToBreachCount = await this.prisma.ticket.count({
      where: {
        slaDueAt: { gte: now, lte: warningCutoff },
        status: { notIn: ['CLOSED', 'CANCELLED', 'VALIDATED'] },
      },
    });

    this.logger.log(
      `SLA check: ${breached.length} breached processed, ${aboutToBreachCount} nearing deadline`,
    );
  }
}
