import { Test, TestingModule } from '@nestjs/testing';
import { PropertiesService } from './properties.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  property: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  unit: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('PropertiesService', () => {
  let service: PropertiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
      mockPrisma.property.findMany.mockResolvedValue([
        { id: 'prop-1', name: 'Test', address: 'Calle 123', _count: { units: 0, tickets: 0 } },
      ]);
      mockPrisma.property.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-id', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-id', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a property', async () => {
      const mockProperty = {
        id: 'new-prop',
        tenantId: 'tenant-id',
        name: 'Edificio Test',
        address: 'San Martín 450',
        type: 'BUILDING',
      };
      mockPrisma.property.create.mockResolvedValue(mockProperty);

      const result = await service.create('tenant-id', {
        name: 'Edificio Test',
        address: 'San Martín 450',
        type: 'BUILDING',
      });

      expect(result.data).toEqual(mockProperty);
      expect(mockPrisma.property.create).toHaveBeenCalledTimes(1);
    });
  });
});
