import { z } from 'zod';
import { Priority, TicketSource, TicketStatus, UserRole } from '../types/enums';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const uuidSchema = z.string().uuid();

export const createTicketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  categoryId: z.string().uuid().optional(),
  tradeId: z.string().uuid().optional(),
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  source: z.nativeEnum(TicketSource).default(TicketSource.WEB),
  tags: z.array(z.string()).default([]),
});

export const updateTicketSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  priority: z.nativeEnum(Priority).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tradeId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  assetId: z.string().uuid().nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const ticketStatusChangeSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  reason: z.string().max(500).optional(),
});

export const listTicketsSchema = paginationSchema.extend({
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  propertyId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  requesterId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const createPropertySchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  lat: z.number().optional(),
  lng: z.number().optional(),
  type: z.enum(['BUILDING', 'HOUSE', 'COMPLEX', 'OFFICE', 'COMMERCIAL']),
  parentId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export const createUnitSchema = z.object({
  identifier: z.string().min(1).max(50),
  floor: z.string().max(20).optional(),
  type: z.enum(['APARTMENT', 'LOCAL', 'COMMON_AREA', 'PARKING', 'STORAGE', 'OFFICE']),
  contactName: z.string().max(200).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().optional(),
});

export const createProviderSchema = z.object({
  businessName: z.string().min(2).max(200),
  cuit: z.string().max(20).optional(),
  contactName: z.string().min(2).max(200),
  phone: z.string().min(6).max(50),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  tenantName: z.string().min(2).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(200),
  phone: z.string().max(50).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListTicketsInput = z.infer<typeof listTicketsSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
