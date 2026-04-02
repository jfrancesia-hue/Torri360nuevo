import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '@toori360/shared';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR)
  findAll(
    @TenantId() tenantId: string,
    @Query('propertyId') propertyId?: string,
    @Query('unitId') unitId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assetsService.findAll(tenantId, {
      propertyId,
      unitId,
      status,
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
    });
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  create(
    @TenantId() tenantId: string,
    @Body() dto: {
      propertyId: string;
      unitId?: string;
      name: string;
      type: string;
      brand?: string;
      model?: string;
      status?: string;
      installDate?: string;
      warrantyEnd?: string;
      notes?: string;
    },
  ) {
    return this.assetsService.create(tenantId, dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<{
      name: string;
      type: string;
      brand: string;
      model: string;
      status: string;
      installDate: string;
      warrantyEnd: string;
      notes: string;
    }>,
  ) {
    return this.assetsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.assetsService.remove(tenantId, id);
  }
}
