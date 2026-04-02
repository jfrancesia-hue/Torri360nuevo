import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '@toori360/shared';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  findAll(
    @TenantId() tenantId: string,
    @Query() query: { page?: number; limit?: number; role?: string },
  ) {
    return this.usersService.findAll(tenantId, query);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @TenantId() tenantId: string,
    @Body() dto: { email: string; name: string; password: string; role: string; phone?: string },
  ) {
    return this.usersService.create(tenantId, dto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.usersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: { name?: string; phone?: string; role?: string; status?: string },
  ) {
    return this.usersService.update(tenantId, id, dto);
  }
}
