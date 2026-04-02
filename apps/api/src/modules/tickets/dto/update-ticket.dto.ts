import { IsOptional, IsEnum, IsString, IsUUID, IsArray, MinLength, MaxLength } from 'class-validator';
import { Priority, TicketStatus } from '@toori360/shared';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  tradeId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ChangeTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AddTicketEventDto {
  @IsEnum(['MESSAGE', 'NOTE', 'FILE_UPLOAD'])
  eventType: 'MESSAGE' | 'NOTE' | 'FILE_UPLOAD';

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @IsOptional()
  @IsEnum(['INTERNAL', 'PROVIDER', 'CLIENT', 'ALL'])
  visibility?: 'INTERNAL' | 'PROVIDER' | 'CLIENT' | 'ALL' = 'ALL';
}
