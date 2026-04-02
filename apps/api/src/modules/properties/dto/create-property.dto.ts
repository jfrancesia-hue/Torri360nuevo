import {
  IsString, IsEnum, IsOptional, IsNumber, IsUUID, MinLength, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Edificio San Martín 450' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'San Martín 450, Catamarca' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ enum: ['BUILDING', 'HOUSE', 'COMPLEX', 'OFFICE', 'COMMERCIAL'] })
  @IsEnum(['BUILDING', 'HOUSE', 'COMPLEX', 'OFFICE', 'COMMERCIAL'])
  type: 'BUILDING' | 'HOUSE' | 'COMPLEX' | 'OFFICE' | 'COMMERCIAL';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
