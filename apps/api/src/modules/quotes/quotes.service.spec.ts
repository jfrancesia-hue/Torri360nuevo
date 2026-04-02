import { Test, TestingModule } from '@nestjs/testing';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const mockPrisma = {
  quote: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  ticket: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  ticketEvent: {
    create: jest.fn(),
  },
};

const mockUser = { id: 'user-id', tenantId: 'tenant-id', role: 'ADMIN', email: 'a@a.com', name: 'Admin' };

describe('QuotesService', () => {
  let service: QuotesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('approve', () => {
    it('should throw NotFoundException when quote not found', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue(null);

      await expect(service.approve('tenant-id', 'bad-id', mockUser as never)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when quote already processed', async () => {
      mockPrisma.quote.findFirst.mockResolvedValue({
        id: 'quote-id',
        status: 'APPROVED',
        ticket: { tenantId: 'tenant-id' },
      });

      await expect(service.approve('tenant-id', 'quote-id', mockUser as never)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated quotes', async () => {
      mockPrisma.quote.findMany.mockResolvedValue([]);
      mockPrisma.quote.count.mockResolvedValue(0);

      const result = await service.findAll('tenant-id');
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });
});
