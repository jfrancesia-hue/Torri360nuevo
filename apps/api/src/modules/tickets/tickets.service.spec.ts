import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TicketStatus } from '@toori360/shared';

const mockPrisma = {
  ticket: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  ticketEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  ticketSequence: {
    upsert: jest.fn().mockResolvedValue({ sequence: 1 }),
  },
  provider: {
    findFirst: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
  },
  rating: {
    upsert: jest.fn(),
  },
  category: {
    findFirst: jest.fn(),
  },
};

const mockNotifications = {
  sendTicketCreated: jest.fn(),
  sendTicketStatusChanged: jest.fn(),
};

const mockRealtime = {
  notifyTicketUpdated: jest.fn(),
  notifyTicketEvent: jest.fn(),
  notifyNewTicket: jest.fn(),
};

const mockUser = {
  id: 'user-id',
  tenantId: 'tenant-id',
  role: 'ADMIN',
  email: 'admin@test.com',
  name: 'Admin',
};

describe('TicketsService', () => {
  let service: TicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: RealtimeGateway, useValue: mockRealtime },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should throw NotFoundException when ticket does not exist', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue(null);

      await expect(service.findOne('tenant-id', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return ticket when found', async () => {
      const mockTicket = {
        id: 'ticket-id',
        tenantId: 'tenant-id',
        number: 'TK-202604-0001',
        title: 'Test ticket',
        status: TicketStatus.NEW,
        events: [],
        provider: null,
        category: null,
        property: { id: 'prop-id', name: 'Test Property', address: 'Calle 123' },
        unit: null,
        asset: null,
        requester: { id: 'user-id', name: 'Test', email: 'test@test.com' },
        assignee: null,
      };
      mockPrisma.ticket.findFirst.mockResolvedValue(mockTicket);

      const result = await service.findOne('tenant-id', 'ticket-id');
      expect(result.data).toEqual(mockTicket);
    });
  });

  describe('changeStatus', () => {
    it('should throw BadRequestException for invalid status transition', async () => {
      mockPrisma.ticket.findFirst.mockResolvedValue({
        id: 'ticket-id',
        tenantId: 'tenant-id',
        status: TicketStatus.NEW,
      });

      await expect(
        service.changeStatus(
          'tenant-id',
          'ticket-id',
          { status: TicketStatus.COMPLETED },
          mockUser as never,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('should return stats object', async () => {
      mockPrisma.ticket.count.mockResolvedValue(5);
      mockPrisma.ticket.groupBy.mockResolvedValue([]);
      mockPrisma.ticket.findMany.mockResolvedValue([]);

      const result = await service.getStats('tenant-id');
      expect(result).toHaveProperty('data');
    });
  });
});
