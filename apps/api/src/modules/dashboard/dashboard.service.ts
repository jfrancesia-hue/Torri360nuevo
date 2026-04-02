import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalOpen,
      totalOpenLastMonth,
      closedThisMonth,
      overSla,
      avgResolutionTime,
      byStatus,
      byPriority,
    ] = await Promise.all([
      this.prisma.ticket.count({
        where: { tenantId, status: { notIn: ['CLOSED', 'CANCELLED'] } },
      }),
      this.prisma.ticket.count({
        where: {
          tenantId,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
          createdAt: { lt: startOfMonth },
        },
      }),
      this.prisma.ticket.count({
        where: { tenantId, status: 'CLOSED', closedAt: { gte: startOfMonth } },
      }),
      this.prisma.ticket.count({
        where: {
          tenantId,
          slaDueAt: { lt: now },
          status: { notIn: ['CLOSED', 'CANCELLED', 'VALIDATED'] },
        },
      }),
      this.prisma.ticket.findMany({
        where: { tenantId, status: 'CLOSED', closedAt: { gte: startOfMonth } },
        select: { createdAt: true, closedAt: true },
      }),
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
    ]);

    const avgResolutionMs =
      avgResolutionTime.reduce((acc, t) => {
        if (!t.closedAt) return acc;
        return acc + (t.closedAt.getTime() - t.createdAt.getTime());
      }, 0) / (avgResolutionTime.length || 1);

    const avgResolutionHours = Math.round(avgResolutionMs / 3600000);

    return {
      data: {
        kpis: {
          totalOpen,
          totalOpenChange: totalOpen - totalOpenLastMonth,
          closedThisMonth,
          overSla,
          avgResolutionHours,
        },
        byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
        byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
      },
    };
  }

  async getTicketsByStatus(tenantId: string) {
    const byStatus = await this.prisma.ticket.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
    });

    return { data: byStatus.map((s) => ({ status: s.status, count: s._count })) };
  }

  async getProvidersRanking(tenantId: string) {
    const providers = await this.prisma.provider.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        businessName: true,
        avgRating: true,
        avgResponseTime: true,
        totalJobs: true,
        trades: { include: { trade: { select: { name: true } } } },
      },
      orderBy: { avgRating: 'desc' },
      take: 10,
    });

    return { data: providers };
  }

  async getMonthlyTrend(tenantId: string, months = 6) {
    const now = new Date();

    const result = await Promise.all(
      Array.from({ length: months }, (_, idx) => months - 1 - idx).map(async (i) => {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const [created, closed] = await Promise.all([
          this.prisma.ticket.count({
            where: { tenantId, createdAt: { gte: start, lte: end } },
          }),
          this.prisma.ticket.count({
            where: { tenantId, status: 'CLOSED', closedAt: { gte: start, lte: end } },
          }),
        ]);

        return { month: start.toISOString().slice(0, 7), created, closed };
      }),
    );

    return { data: result };
  }

  async getByCategory(tenantId: string) {
    const byCategory = await this.prisma.ticket.groupBy({
      by: ['categoryId'],
      where: { tenantId },
      _count: true,
    });

    const categoryIds = byCategory
      .filter((x) => x.categoryId)
      .map((x) => x.categoryId as string);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true },
    });

    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    return {
      data: byCategory.map((x) => ({
        category: x.categoryId ? (categoryMap[x.categoryId]?.name || 'Sin categoría') : 'Sin categoría',
        icon: x.categoryId ? categoryMap[x.categoryId]?.icon : null,
        count: x._count,
      })),
    };
  }

  async getReport(tenantId: string, from?: string, to?: string) {
    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };

    const hasDateFilter = from || to;

    const [tickets, providers, categories, byPriority, byStatus] = await Promise.all([
      this.prisma.ticket.findMany({
        where: {
          tenantId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        select: {
          number: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          closedAt: true,
          slaDueAt: true,
          slaAlertSent: true,
          category: { select: { name: true } },
          property: { select: { name: true } },
          provider: { select: { businessName: true } },
          requester: { select: { name: true, email: true } },
          assignee: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.provider.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          businessName: true,
          avgRating: true,
          totalJobs: true,
          avgResponseTime: true,
          _count: { select: { tickets: true, quotes: true } },
        },
        orderBy: { totalJobs: 'desc' },
        take: 50,
      }),
      this.prisma.ticket.groupBy({
        by: ['categoryId'],
        where: { tenantId, ...(hasDateFilter && { createdAt: dateFilter }) },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where: { tenantId, ...(hasDateFilter && { createdAt: dateFilter }) },
        _count: true,
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: { tenantId, ...(hasDateFilter && { createdAt: dateFilter }) },
        _count: true,
      }),
    ]);

    return {
      data: {
        tickets,
        providers,
        byPriority: byPriority.map((x) => ({ priority: x.priority, count: x._count })),
        byStatus: byStatus.map((x) => ({ status: x.status, count: x._count })),
        summary: {
          total: tickets.length,
          closed: tickets.filter((t) => t.status === 'CLOSED').length,
          overSla: tickets.filter((t) => t.slaAlertSent).length,
        },
      },
    };
  }

  async getSlaCompliance(tenantId: string) {
    const [total, overSla, closedOnTime] = await Promise.all([
      this.prisma.ticket.count({
        where: { tenantId, slaConfigId: { not: null } },
      }),
      this.prisma.ticket.count({
        where: {
          tenantId,
          slaDueAt: { lt: new Date() },
          status: { notIn: ['CLOSED', 'CANCELLED', 'VALIDATED'] },
        },
      }),
      this.prisma.ticket.count({
        where: {
          tenantId,
          status: { in: ['CLOSED', 'VALIDATED'] },
          closedAt: { not: null },
        },
      }),
    ]);

    const complianceRate = total > 0 ? Math.round(((total - overSla) / total) * 100) : 100;

    return { data: { total, overSla, closedOnTime, complianceRate } };
  }
}
