import {
  Controller, Post, Delete, Get, Param, Body, UploadedFile,
  UseInterceptors, UseGuards, ParseFilePipe, MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, UserPayload } from '@toori360/shared';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('ticket/:ticketId')
  @Roles(
    UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR,
    UserRole.REQUESTER, UserRole.PROVIDER_USER,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string', enum: ['BEFORE', 'AFTER', 'QUOTE_DOC', 'DOCUMENT', 'EVIDENCE', 'OTHER'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  upload(
    @TenantId() tenantId: string,
    @Param('ticketId') ticketId: string,
    @UploadedFile(
      new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE })] }),
    )
    file: Express.Multer.File,
    @Body('category') category: string = 'DOCUMENT',
    @CurrentUser() user: UserPayload,
  ) {
    return this.uploadsService.uploadToTicket(tenantId, ticketId, file, category, user);
  }

  @Get('ticket/:ticketId')
  @Roles(
    UserRole.ADMIN, UserRole.OPERATOR, UserRole.SUPERVISOR, UserRole.AUDITOR,
    UserRole.REQUESTER, UserRole.PROVIDER_USER,
  )
  listByTicket(
    @TenantId() tenantId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.uploadsService.listByTicket(tenantId, ticketId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.uploadsService.deleteAttachment(tenantId, id, user);
  }
}
