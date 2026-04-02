import {
  AttachmentCategory,
  EventType,
  NotificationChannel,
  NotificationStatus,
  Plan,
  Priority,
  PropertyType,
  ProviderStatus,
  QuoteStatus,
  TenantStatus,
  TicketSource,
  TicketStatus,
  UnitType,
  UserRole,
  UserStatus,
  Visibility,
  VisitStatus,
} from './enums';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  settings: Record<string, unknown>;
  logoUrl?: string | null;
  status: TenantStatus;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  phone?: string | null;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  status: UserStatus;
  supabaseAuthId?: string | null;
  lastLogin?: Date | null;
  notificationPrefs: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  type: PropertyType;
  parentId?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  propertyId: string;
  identifier: string;
  floor?: string | null;
  type: UnitType;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  propertyId?: string | null;
  unitId?: string | null;
  name: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  installDate?: Date | null;
  warrantyEnd?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider {
  id: string;
  tenantId: string;
  businessName: string;
  cuit?: string | null;
  contactName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  status: ProviderStatus;
  avgRating: number;
  avgResponseTime?: number | null;
  totalJobs: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  tenantId: string;
  name: string;
  icon?: string | null;
  parentId?: string | null;
  createdAt: Date;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  icon?: string | null;
  parentId?: string | null;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  tenantId: string;
  number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  categoryId?: string | null;
  tradeId?: string | null;
  propertyId: string;
  unitId?: string | null;
  assetId?: string | null;
  requesterId: string;
  assigneeId?: string | null;
  providerId?: string | null;
  slaConfigId?: string | null;
  slaDueAt?: Date | null;
  source: TicketSource;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date | null;
}

export interface TicketEvent {
  id: string;
  ticketId: string;
  userId?: string | null;
  eventType: EventType;
  data: Record<string, unknown>;
  visibility: Visibility;
  createdAt: Date;
}

export interface Quote {
  id: string;
  ticketId: string;
  providerId: string;
  amount: number;
  currency: string;
  description: string;
  estimatedDays?: number | null;
  conditions?: string | null;
  status: QuoteStatus;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Visit {
  id: string;
  ticketId: string;
  providerId: string;
  scheduledAt: Date;
  windowStart?: string | null;
  windowEnd?: string | null;
  status: VisitStatus;
  checkinAt?: Date | null;
  checkoutAt?: Date | null;
  checkinLat?: number | null;
  checkinLng?: number | null;
  notes?: string | null;
  rescheduleReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  ticketId: string;
  eventId?: string | null;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  category: AttachmentCategory;
  uploadedBy: string;
  createdAt: Date;
}

export interface SlaConfig {
  id: string;
  tenantId: string;
  priority: Priority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  escalationRules: unknown[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: string;
  ticketId: string;
  providerId: string;
  ratedBy: string;
  score: number;
  comment?: string | null;
  createdAt: Date;
}

export interface Checklist {
  id: string;
  ticketId: string;
  name: string;
  items: Array<{ text: string; checked: boolean }>;
  completedAt?: Date | null;
  completedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  ticketId?: string | null;
  channel: NotificationChannel;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  status: NotificationStatus;
  sentAt?: Date | null;
  createdAt: Date;
}
