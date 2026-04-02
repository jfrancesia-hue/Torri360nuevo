import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, UserPayload } from '@toori360/shared';

@ApiTags('Quotes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('quotes')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.quotesService.findAll(tenantId, {
      page: page ? +page : 1,
      limit: limit ? +limit : 30,
      status,
    });
  }

  @Post('tickets/:ticketId/quotes/request')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  requestQuote(
    @TenantId() tenantId: string,
    @Param('ticketId') ticketId: string,
    @Body() body: { providerIds: string[] },
    @CurrentUser() user: UserPayload,
  ) {
    return this.quotesService.requestQuote(tenantId, ticketId, body.providerIds, user);
  }

  @Post('tickets/:ticketId/quotes')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.PROVIDER_USER)
  create(
    @TenantId() tenantId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: {
      providerId: string;
      amount: number;
      currency?: string;
      description: string;
      estimatedDays?: number;
      conditions?: string;
    },
    @CurrentUser() user: UserPayload,
  ) {
    return this.quotesService.create(tenantId, ticketId, dto, user);
  }

  @Get('tickets/:ticketId/quotes')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  findByTicket(@TenantId() tenantId: string, @Param('ticketId') ticketId: string) {
    return this.quotesService.findByTicket(tenantId, ticketId);
  }

  @Post('quotes/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR)
  approve(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.quotesService.approve(tenantId, id, user);
  }

  @Post('quotes/:id/reject')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR)
  reject(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.quotesService.reject(tenantId, id, body.reason, user);
  }
}
