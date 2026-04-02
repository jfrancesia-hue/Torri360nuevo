import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { UpdateTicketDto, ChangeTicketStatusDto, AddTicketEventDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, UserPayload } from '@toori360/shared';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'KPIs de tickets' })
  getStats(@TenantId() tenantId: string) {
    return this.ticketsService.getStats(tenantId);
  }

  @Get()
  @Roles(
    UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR,
    UserRole.REQUESTER, UserRole.PROVIDER_USER,
  )
  @ApiOperation({ summary: 'Listar tickets con filtros' })
  findAll(
    @TenantId() tenantId: string,
    @Query() query: ListTicketsDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.ticketsService.findAll(tenantId, query, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.REQUESTER)
  @ApiOperation({ summary: 'Crear ticket' })
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.create(tenantId, user.id, dto);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR,
    UserRole.REQUESTER, UserRole.PROVIDER_USER,
  )
  @ApiOperation({ summary: 'Detalle del ticket' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.ticketsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Actualizar ticket' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.ticketsService.update(tenantId, id, dto, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Cambiar estado del ticket' })
  changeStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: ChangeTicketStatusDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.ticketsService.changeStatus(tenantId, id, dto, user);
  }

  @Post(':id/events')
  @Roles(
    UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR,
    UserRole.REQUESTER, UserRole.PROVIDER_USER,
  )
  @ApiOperation({ summary: 'Agregar evento al ticket' })
  addEvent(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddTicketEventDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.ticketsService.addEvent(tenantId, id, dto, user);
  }

  @Get(':id/timeline')
  @Roles(
    UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR,
    UserRole.REQUESTER, UserRole.PROVIDER_USER,
  )
  @ApiOperation({ summary: 'Timeline del ticket' })
  getTimeline(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.ticketsService.getTimeline(tenantId, id, user);
  }

  @Post(':id/rate')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.REQUESTER)
  @ApiOperation({ summary: 'Calificar proveedor del ticket' })
  rate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { score: number; comment?: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.ticketsService.rateProvider(tenantId, id, body.score, body.comment, user);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Asignar proveedor al ticket' })
  assign(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { providerId: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.ticketsService.assign(tenantId, id, body.providerId, user);
  }
}
