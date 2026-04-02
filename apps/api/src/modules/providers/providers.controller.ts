import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '@toori360/shared';

@ApiTags('Providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Listar proveedores' })
  findAll(
    @TenantId() tenantId: string,
    @Query() query: { page?: number; limit?: number; search?: string; status?: string; tradeId?: string },
  ) {
    return this.providersService.findAll(tenantId, query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Crear proveedor' })
  create(@TenantId() tenantId: string, @Body() dto: CreateProviderDto) {
    return this.providersService.create(tenantId, dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Detalle de proveedor' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.providersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Actualizar proveedor' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProviderDto> & { status?: string },
  ) {
    return this.providersService.update(tenantId, id, dto);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Métricas del proveedor' })
  getStats(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.providersService.getStats(tenantId, id);
  }

  @Post(':id/trades')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Agregar rubro a proveedor' })
  addTrade(
    @TenantId() tenantId: string,
    @Param('id') providerId: string,
    @Body() body: { tradeId: string; coverageZones?: string[]; hourlyRate?: number },
  ) {
    return this.providersService.addTrade(tenantId, providerId, body.tradeId, body);
  }
}
