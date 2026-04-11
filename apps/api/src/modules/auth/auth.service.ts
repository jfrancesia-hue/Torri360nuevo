import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserPayload } from '@toori360/shared';
import { slugify } from '@toori360/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {
    if (!this.config.get('JWT_SECRET') || !this.config.get('JWT_REFRESH_SECRET')) {
      throw new InternalServerErrorException('JWT_SECRET and JWT_REFRESH_SECRET must be set');
    }
  }

  async register(dto: RegisterDto) {
    const slug = slugify(dto.tenantName);

    const existingTenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      throw new ConflictException('Ya existe un tenant con ese nombre');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.tenantName,
        slug,
        plan: 'FREE',
        status: 'TRIAL',
      },
    });

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        role: 'ADMIN',
        passwordHash,
        status: 'ACTIVE',
      },
    });

    // Create default SLA configs
    const slaDefaults = [
      { priority: 'CRITICAL' as const, responseTimeHours: 2, resolutionTimeHours: 24 },
      { priority: 'HIGH' as const, responseTimeHours: 4, resolutionTimeHours: 48 },
      { priority: 'MEDIUM' as const, responseTimeHours: 8, resolutionTimeHours: 72 },
      { priority: 'LOW' as const, responseTimeHours: 24, resolutionTimeHours: 168 },
    ];
    for (const sla of slaDefaults) {
      await this.prisma.slaConfig.create({
        data: { tenantId: tenant.id, ...sla },
      });
    }

    const tokens = this.generateTokens(user.id, tenant.id, user.email, user.role, user.name);
    return {
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan },
        ...tokens,
      },
    };
  }

  async login(dto: LoginDto) {
    try {
      this.logger.debug(`Login attempt for email: ${dto.email}`);
      
      const user = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          status: 'ACTIVE',
        },
        include: { tenant: true },
      });

      if (!user) {
        this.logger.warn(`Login failed: user not found for email ${dto.email}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (!user.passwordHash) {
        this.logger.warn(`Login failed: user ${user.id} has no password hash`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordValid) {
        this.logger.warn(`Login failed: invalid password for user ${user.id}`);
        throw new UnauthorizedException('Credenciales inválidas');
      }

      if (user.tenant.status === 'SUSPENDED') {
        this.logger.warn(`Login failed: tenant ${user.tenantId} is suspended`);
        throw new UnauthorizedException('La cuenta está suspendida');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const tokens = this.generateTokens(
        user.id,
        user.tenantId,
        user.email,
        user.role,
        user.name,
      );

      this.logger.log(`Login successful for user ${user.id}`);
      return {
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
          },
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
            plan: user.tenant.plan,
          logoUrl: user.tenant.logoUrl,
        },
        ...tokens,
      },
    };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error en el login. Por favor intenta de nuevo.');
    }
  }

  async getMe(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          plan: user.tenant.plan,
          logoUrl: user.tenant.logoUrl,
          onboardingCompleted: user.tenant.onboardingCompleted,
        },
      },
    };
  }

  async refreshToken(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, status: 'ACTIVE' },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      data: this.generateTokens(user.id, user.tenantId, user.email, user.role, user.name),
    };
  }

  private generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string,
    name: string,
  ) {
    const payload: UserPayload = { id: userId, tenantId, email, role, name };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRATION') || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRATION') || '7d',
    });

    return { accessToken, refreshToken };
  }

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; type: string };

    try {
      payload = this.jwtService.verify(token, {
        secret: this.config.get('JWT_SECRET'),
      });
    } catch {
      throw new BadRequestException('El enlace de restablecimiento es inválido o expiró');
    }

    if (payload.type !== 'password-reset') {
      throw new BadRequestException('Token inválido');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, status: 'ACTIVE' },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { data: { message: 'Contraseña actualizada correctamente' } };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, status: 'ACTIVE' },
      include: { tenant: true },
    });

    // Always return success to avoid email enumeration
    if (!user) {
      return { data: { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' } };
    }

    // Signed JWT as reset token — no DB field needed, expires in 1h
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { secret: this.config.get('JWT_SECRET'), expiresIn: '1h' },
    );

    const appUrl = this.config.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    this.notifications.sendPasswordReset(user.email, user.name, resetToken, appUrl).catch((err) => {
      this.logger.error('Failed to send password reset email', err);
    });

    return { data: { message: 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.' } };
  }
}
