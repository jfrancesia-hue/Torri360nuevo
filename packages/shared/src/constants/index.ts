import { TicketStatus, Priority, UserRole } from '../types/enums';

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.RECEIVED, TicketStatus.CANCELLED],
  [TicketStatus.RECEIVED]: [TicketStatus.IN_REVIEW, TicketStatus.ASSIGNED, TicketStatus.CANCELLED],
  [TicketStatus.IN_REVIEW]: [
    TicketStatus.ASSIGNED,
    TicketStatus.AWAITING_QUOTE,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.ASSIGNED]: [
    TicketStatus.AWAITING_QUOTE,
    TicketStatus.SCHEDULING_VISIT,
    TicketStatus.IN_PROGRESS,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.AWAITING_QUOTE]: [TicketStatus.QUOTE_RECEIVED, TicketStatus.CANCELLED],
  [TicketStatus.QUOTE_RECEIVED]: [
    TicketStatus.PENDING_APPROVAL,
    TicketStatus.AWAITING_QUOTE,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.PENDING_APPROVAL]: [
    TicketStatus.APPROVED,
    TicketStatus.AWAITING_QUOTE,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.APPROVED]: [
    TicketStatus.SCHEDULING_VISIT,
    TicketStatus.IN_PROGRESS,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.SCHEDULING_VISIT]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.PAUSED, TicketStatus.COMPLETED, TicketStatus.CANCELLED],
  [TicketStatus.PAUSED]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.COMPLETED]: [
    TicketStatus.VALIDATED,
    TicketStatus.IN_PROGRESS,
    TicketStatus.CANCELLED,
  ],
  [TicketStatus.VALIDATED]: [TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.CANCELLED]: [],
};

export function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.NEW]: 'Nuevo',
  [TicketStatus.RECEIVED]: 'Recibido',
  [TicketStatus.IN_REVIEW]: 'En revisión',
  [TicketStatus.ASSIGNED]: 'Asignado',
  [TicketStatus.AWAITING_QUOTE]: 'Esperando presupuesto',
  [TicketStatus.QUOTE_RECEIVED]: 'Presupuesto recibido',
  [TicketStatus.PENDING_APPROVAL]: 'Pendiente aprobación',
  [TicketStatus.APPROVED]: 'Aprobado',
  [TicketStatus.SCHEDULING_VISIT]: 'Coordinando visita',
  [TicketStatus.IN_PROGRESS]: 'En curso',
  [TicketStatus.PAUSED]: 'Pausado',
  [TicketStatus.COMPLETED]: 'Completado',
  [TicketStatus.VALIDATED]: 'Validado',
  [TicketStatus.CLOSED]: 'Cerrado',
  [TicketStatus.CANCELLED]: 'Cancelado',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.CRITICAL]: 'Crítica',
  [Priority.HIGH]: 'Alta',
  [Priority.MEDIUM]: 'Media',
  [Priority.LOW]: 'Baja',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.OPERATOR]: 'Operador',
  [UserRole.SUPERVISOR]: 'Supervisor',
  [UserRole.REQUESTER]: 'Solicitante',
  [UserRole.PROVIDER_USER]: 'Proveedor',
  [UserRole.AUDITOR]: 'Auditor',
};

export const SLA_DEFAULTS: Record<Priority, { responseHours: number; resolutionHours: number }> = {
  [Priority.CRITICAL]: { responseHours: 2, resolutionHours: 24 },
  [Priority.HIGH]: { responseHours: 4, resolutionHours: 48 },
  [Priority.MEDIUM]: { responseHours: 8, resolutionHours: 72 },
  [Priority.LOW]: { responseHours: 24, resolutionHours: 168 },
};

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

export const TICKET_NUMBER_PREFIX = 'TK';
