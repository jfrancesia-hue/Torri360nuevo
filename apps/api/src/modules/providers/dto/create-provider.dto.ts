import { IsString, IsOptional, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProviderDto {
  @ApiProperty({ example: 'Plomeros Unidos SRL' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  businessName: string;

  @ApiPropertyOptional({ example: '30-12345678-9' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cuit?: string;

  @ApiProperty({ example: 'Roberto Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  contactName: string;

  @ApiProperty({ example: '+54 383 4123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  phone: string;

  @ApiPropertyOptional({ example: 'contacto@plomeros.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
