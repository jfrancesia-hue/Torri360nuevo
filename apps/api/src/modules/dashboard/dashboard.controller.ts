import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '@toori360/shared';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  getOverview(@TenantId() tenantId: string) {
    return this.dashboardService.getOverview(tenantId);
  }

  @Get('tickets-by-status')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  getTicketsByStatus(@TenantId() tenantId: string) {
    return this.dashboardService.getTicketsByStatus(tenantId);
  }

  @Get('providers-ranking')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR)
  getProvidersRanking(@TenantId() tenantId: string) {
    return this.dashboardService.getProvidersRanking(tenantId);
  }

  @Get('sla-compliance')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AUDITOR)
  getSlaCompliance(@TenantId() tenantId: string) {
    return this.dashboardService.getSlaCompliance(tenantId);
  }

  @Get('monthly-trend')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  getMonthlyTrend(
    @TenantId() tenantId: string,
    @Query('months') months?: string,
  ) {
    return this.dashboardService.getMonthlyTrend(tenantId, months ? parseInt(months) : 6);
  }

  @Get('by-category')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  getByCategory(@TenantId() tenantId: string) {
    return this.dashboardService.getByCategory(tenantId);
  }

  @Get('report')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.AUDITOR)
  getReport(
    @TenantId() tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.dashboardService.getReport(tenantId, from, to);
  }
}
