import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ListPropertiesDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['BUILDING', 'HOUSE', 'COMPLEX', 'OFFICE', 'COMMERCIAL'])
  type?: string;
}
