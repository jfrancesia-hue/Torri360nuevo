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
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        status: 'ACTIVE',
      },
      include: { tenant: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.tenant.status === 'SUSPENDED') {
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
