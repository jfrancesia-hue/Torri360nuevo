import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '@toori360/shared';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('profile')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getProfile(@TenantId() tenantId: string) {
    return this.tenantsService.getProfile(tenantId);
  }

  @Get('sla')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getSlaConfigs(@TenantId() tenantId: string) {
    return this.tenantsService.getSlaConfigs(tenantId);
  }

  @Patch('sla/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateSlaConfig(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { responseTimeHours?: number; resolutionTimeHours?: number },
  ) {
    return this.tenantsService.updateSlaConfig(tenantId, id, dto);
  }
}
