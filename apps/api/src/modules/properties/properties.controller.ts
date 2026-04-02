import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '@toori360/shared';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Listar propiedades' })
  findAll(@TenantId() tenantId: string, @Query() query: ListPropertiesDto) {
    return this.propertiesService.findAll(tenantId, query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Crear propiedad' })
  create(@TenantId() tenantId: string, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(tenantId, dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Detalle de propiedad' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.propertiesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Actualizar propiedad' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreatePropertyDto>,
  ) {
    return this.propertiesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar propiedad' })
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.propertiesService.remove(tenantId, id);
  }

  @Get(':id/units')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  @ApiOperation({ summary: 'Listar unidades de propiedad' })
  getUnits(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.propertiesService.getUnits(tenantId, id);
  }

  @Post(':id/units')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Crear unidad en propiedad' })
  createUnit(
    @TenantId() tenantId: string,
    @Param('id') propertyId: string,
    @Body() dto: {
      identifier: string;
      floor?: string;
      type: string;
      contactName?: string;
      contactPhone?: string;
      contactEmail?: string;
    },
  ) {
    return this.propertiesService.createUnit(tenantId, propertyId, dto);
  }
}
