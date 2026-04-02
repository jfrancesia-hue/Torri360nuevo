import { Controller, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '@toori360/shared';

@ApiTags('Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<{
      identifier: string;
      floor: string;
      type: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
    }>,
  ) {
    return this.unitsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.unitsService.remove(tenantId, id);
  }
}
