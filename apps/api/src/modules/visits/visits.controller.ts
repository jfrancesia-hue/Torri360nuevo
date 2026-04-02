import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, UserPayload } from '@toori360/shared';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  create(
    @TenantId() tenantId: string,
    @Body() dto: {
      ticketId: string;
      providerId: string;
      scheduledAt: string;
      windowStart?: string;
      windowEnd?: string;
      notes?: string;
    },
    @CurrentUser() user: UserPayload,
  ) {
    return this.visitsService.create(tenantId, dto, user);
  }

  @Get('by-ticket/:ticketId')
  @Roles(
    UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR,
    UserRole.REQUESTER, UserRole.PROVIDER_USER,
  )
  findByTicket(
    @TenantId() tenantId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.visitsService.findByTicket(tenantId, ticketId);
  }

  @Get('calendar')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR)
  getCalendar(
    @TenantId() tenantId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.visitsService.getCalendar(tenantId, from, to);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: {
      scheduledAt?: string;
      windowStart?: string;
      windowEnd?: string;
      status?: string;
      rescheduleReason?: string;
    },
    @CurrentUser() user: UserPayload,
  ) {
    return this.visitsService.update(tenantId, id, dto, user);
  }

  @Post(':id/confirm')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.PROVIDER_USER)
  confirm(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.visitsService.confirm(tenantId, id, user);
  }

  @Post(':id/checkin')
  @Roles(UserRole.PROVIDER_USER, UserRole.ADMIN, UserRole.OPERATOR)
  checkin(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { lat: number; lng: number },
    @CurrentUser() user: UserPayload,
  ) {
    return this.visitsService.checkin(tenantId, id, body.lat, body.lng, user);
  }

  @Post(':id/checkout')
  @Roles(UserRole.PROVIDER_USER, UserRole.ADMIN, UserRole.OPERATOR)
  checkout(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { notes: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.visitsService.checkout(tenantId, id, body.notes, user);
  }
}
