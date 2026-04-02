import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  ticketSequence: {
    upsert: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRATION: '15m',
      JWT_REFRESH_SECRET: 'test-refresh',
      JWT_REFRESH_EXPIRATION: '7d',
    };
    return map[key] ?? null;
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if tenant slug already exists', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: 'existing-tenant' });

      await expect(
        service.register({
          tenantName: 'Existing Tenant',
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create tenant and user on successful register', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue({
        id: 'tenant-id',
        name: 'New Tenant',
        slug: 'new-tenant',
      });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 'tenant-id',
      });

      const result = await service.register({
        tenantName: 'New Tenant',
        email: 'test@test.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tenant');
      expect(mockPrisma.tenant.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException with invalid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
