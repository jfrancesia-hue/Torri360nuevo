import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TicketStatus, Priority } from '@toori360/shared';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string; dotColor: string }
> = {
  NEW: { label: 'Nuevo', className: 'bg-gray-100 text-gray-700 border-gray-200', dotColor: 'bg-gray-400' },
  RECEIVED: { label: 'Recibido', className: 'bg-blue-50 text-blue-700 border-blue-200', dotColor: 'bg-blue-400' },
  IN_REVIEW: { label: 'En revisión', className: 'bg-blue-100 text-blue-800 border-blue-300', dotColor: 'bg-blue-500' },
  ASSIGNED: { label: 'Asignado', className: 'bg-orange-50 text-orange-700 border-orange-200', dotColor: 'bg-orange-400' },
  AWAITING_QUOTE: { label: 'Esperando pres.', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', dotColor: 'bg-yellow-400' },
  QUOTE_RECEIVED: { label: 'Pres. recibido', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', dotColor: 'bg-yellow-500' },
  PENDING_APPROVAL: { label: 'Pendiente aprob.', className: 'bg-amber-50 text-amber-700 border-amber-200', dotColor: 'bg-amber-400' },
  APPROVED: { label: 'Aprobado', className: 'bg-green-50 text-green-700 border-green-200', dotColor: 'bg-green-400' },
  SCHEDULING_VISIT: { label: 'Coord. visita', className: 'bg-sky-50 text-sky-700 border-sky-200', dotColor: 'bg-sky-400' },
  IN_PROGRESS: { label: 'En curso', className: 'bg-green-100 text-green-800 border-green-300', dotColor: 'bg-green-500' },
  PAUSED: { label: 'Pausado', className: 'bg-gray-100 text-gray-600 border-gray-200', dotColor: 'bg-gray-400' },
  COMPLETED: { label: 'Completado', className: 'bg-emerald-100 text-emerald-800 border-emerald-300', dotColor: 'bg-emerald-600' },
  VALIDATED: { label: 'Validado', className: 'bg-emerald-200 text-emerald-900 border-emerald-400', dotColor: 'bg-emerald-700' },
  CLOSED: { label: 'Cerrado', className: 'bg-gray-800 text-white border-gray-700', dotColor: 'bg-gray-600' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200', dotColor: 'bg-red-500' },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; className: string; iconColor: string }
> = {
  CRITICAL: { label: 'Crítica', className: 'bg-red-100 text-red-800 border-red-300', iconColor: 'text-red-600' },
  HIGH: { label: 'Alta', className: 'bg-orange-100 text-orange-800 border-orange-300', iconColor: 'text-orange-600' },
  MEDIUM: { label: 'Media', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', iconColor: 'text-yellow-600' },
  LOW: { label: 'Baja', className: 'bg-green-100 text-green-800 border-green-300', iconColor: 'text-green-600' },
};
