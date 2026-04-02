'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { StatusChip } from './status-chip';
import { PriorityBadge } from './priority-badge';
import { TicketActions } from './ticket-actions';
import { QuotesPanel } from './quotes-panel';
import { VisitsPanel } from './visits-panel';
import { AttachmentsPanel } from './attachments-panel';
import { useTicketRealtime } from '@/hooks/use-ticket-realtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDateTime, formatRelativeTime, TicketStatus, EventType, Visibility } from '@toori360/shared';
import {
  ArrowLeft, Building2, User, Wrench, Calendar, Send,
  MessageSquare, RefreshCw, FileText, CheckCircle, AlertTriangle,
  Clock, Tag, Star,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface TicketFull {
  id: string;
  number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  slaDueAt?: string | null;
  property: { id: string; name: string; address: string };
  unit?: { id: string; identifier: string } | null;
  asset?: { id: string; name: string; type: string } | null;
  category?: { id: string; name: string; icon?: string | null } | null;
  trade?: { id: string; name: string } | null;
  requester: { id: string; name: string; email: string; phone?: string | null; avatarUrl?: string | null };
  assignee?: { id: string; name: string } | null;
  provider?: {
    id: string; businessName: string; contactName: string; phone: string; avgRating: number;
    trades: { trade: { name: string } }[];
  } | null;
  providerId?: string | null;
  slaConfig?: { responseTimeHours: number; resolutionTimeHours: number } | null;
  events: {
    id: string;
    eventType: EventType;
    data: Record<string, unknown>;
    visibility: Visibility;
    createdAt: string;
    user?: { id: string; name: string; avatarUrl?: string | null; role: string } | null;
  }[];
  quotes: {
    id: string; amount: number; currency: string; status: string;
    provider: { businessName: string };
    createdAt: string;
  }[];
  visits: {
    id: string; scheduledAt: string; status: string;
    windowStart?: string | null; windowEnd?: string | null;
  }[];
  attachments: { id: string; fileName: string; fileUrl: string; fileType: string; category: string }[];
}

const EVENT_ICONS: Partial<Record<EventType, React.ReactNode>> = {
  STATUS_CHANGE:    <RefreshCw className="h-3.5 w-3.5" />,
  MESSAGE:          <MessageSquare className="h-3.5 w-3.5" />,
  NOTE:             <FileText className="h-3.5 w-3.5" />,
  ASSIGNMENT:       <User className="h-3.5 w-3.5" />,
  SYSTEM:           <RefreshCw className="h-3.5 w-3.5" />,
  QUOTE_APPROVED:   <CheckCircle className="h-3.5 w-3.5" />,
  QUOTE_REJECTED:   <AlertTriangle className="h-3.5 w-3.5" />,
  VISIT_SCHEDULED:  <Calendar className="h-3.5 w-3.5" />,
  CHECKIN:          <Clock className="h-3.5 w-3.5" />,
  CHECKOUT:         <CheckCircle className="h-3.5 w-3.5" />,
  PRIORITY_CHANGE:  <AlertTriangle className="h-3.5 w-3.5" />,
  SLA_ALERT:        <AlertTriangle className="h-3.5 w-3.5" />,
};

const EVENT_BG: Partial<Record<EventType, string>> = {
  STATUS_CHANGE:    'bg-blue-100 text-blue-600',
  MESSAGE:          'bg-gray-100 text-gray-600',
  NOTE:             'bg-amber-100 text-amber-600',
  ASSIGNMENT:       'bg-purple-100 text-purple-600',
  QUOTE_APPROVED:   'bg-green-100 text-green-600',
  QUOTE_REJECTED:   'bg-red-100 text-red-600',
  VISIT_SCHEDULED:  'bg-sky-100 text-sky-600',
  CHECKIN:          'bg-teal-100 text-teal-600',
  CHECKOUT:         'bg-emerald-100 text-emerald-600',
  SLA_ALERT:        'bg-red-100 text-red-600',
  PRIORITY_CHANGE:  'bg-orange-100 text-orange-600',
  SYSTEM:           'bg-gray-100 text-gray-500',
};

function getEventDescription(event: TicketFull['events'][0]): string {
  const d = event.data;
  switch (event.eventType) {
    case EventType.STATUS_CHANGE:
      return `Estado: "${d.from}" → "${d.to}"${d.reason ? ` — ${d.reason}` : ''}`;
    case EventType.MESSAGE:
    case EventType.NOTE:
      return (d.content as string) || '';
    case EventType.ASSIGNMENT:
      return `Asignado a ${(d.providerName as string) || 'proveedor'}`;
    case EventType.PRIORITY_CHANGE:
      return `Prioridad: ${d.from} → ${d.to}`;
    case EventType.QUOTE_APPROVED:
      return `Presupuesto aprobado — $${d.amount} ${d.currency || 'ARS'}`;
    case EventType.QUOTE_REJECTED:
      return `Presupuesto rechazado${d.reason ? ` — ${d.reason}` : ''}`;
    case EventType.VISIT_SCHEDULED:
      return `Visita programada para ${d.scheduledAt ? formatDateTime(d.scheduledAt as string) : ''}`;
    case EventType.VISIT_CONFIRMED:
      return 'Visita confirmada por el proveedor';
    case EventType.VISIT_RESCHEDULED:
      return `Visita reprogramada${d.reason ? ` — ${d.reason}` : ''}`;
    case EventType.CHECKIN:
      return `Check-in a las ${d.checkinAt ? formatDateTime(d.checkinAt as string) : ''}`;
    case EventType.CHECKOUT:
      return `Check-out registrado${d.notes ? ` — ${d.notes}` : ''}`;
    case EventType.SLA_ALERT:
      return `⚠ Alerta SLA: ${(d.message as string) || 'Vencimiento próximo'}`;
    case EventType.SYSTEM:
      return (d.message as string) || 'Evento del sistema';
    default:
      return event.eventType;
  }
}

export function TicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'MESSAGE' | 'NOTE'>('MESSAGE');
  const [showRateModal, setShowRateModal] = useState(false);

  useTicketRealtime({ ticketId: id });

  const { data, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get<{ data: TicketFull }>(`/tickets/${id}`),
  });

  const addEventMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/tickets/${id}/events`, {
        eventType: messageType,
        content,
        visibility: messageType === 'NOTE' ? 'INTERNAL' : 'ALL',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setMessage('');
      toast.success(messageType === 'NOTE' ? 'Nota agregada' : 'Mensaje enviado');
    },
    onError: () => toast.error('Error al enviar'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 h-96 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground">Ticket no encontrado o sin acceso</p>
        <Button variant="outline" onClick={() => router.push('/tickets')}>
          Volver a tickets
        </Button>
      </div>
    );
  }

  const ticket = data.data;
  const isOverSla = ticket.slaDueAt &&
    new Date(ticket.slaDueAt) < new Date() &&
    !['CLOSED', 'CANCELLED', 'VALIDATED'].includes(ticket.status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-muted-foreground">{ticket.number}</span>
            <StatusChip status={ticket.status} />
            <PriorityBadge priority={ticket.priority as never} />
            {isOverSla && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                SLA vencido
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold mt-1">{ticket.title}</h1>
          {ticket.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {ticket.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <TicketActions
            ticketId={ticket.id}
            currentStatus={ticket.status}
            providerId={ticket.providerId}
          />
        </CardContent>
      </Card>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Timeline 70% */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <Card>
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Creado {formatRelativeTime(ticket.createdAt)} · Actualizado {formatRelativeTime(ticket.updatedAt)}
              </p>
            </CardContent>
          </Card>

          {/* Quotes */}
          <QuotesPanel
            ticketId={ticket.id}
            providerId={ticket.providerId}
            ticketStatus={ticket.status}
          />

          {/* Visits */}
          <VisitsPanel
            ticketId={ticket.id}
            providerId={ticket.providerId}
            ticketStatus={ticket.status}
          />

          {/* Attachments */}
          <AttachmentsPanel
            ticketId={ticket.id}
            canUpload={!['CLOSED', 'CANCELLED'].includes(ticket.status)}
          />

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Historial del ticket</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {ticket.events.map((event) => (
                  <div key={event.id} className="px-5 py-3 flex gap-3">
                    <div className={cn(
                      'mt-0.5 p-1.5 rounded-full shrink-0',
                      EVENT_BG[event.eventType] || 'bg-muted text-muted-foreground',
                    )}>
                      {EVENT_ICONS[event.eventType] || <RefreshCw className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-foreground">
                          {event.user?.name || 'Sistema'}
                        </span>
                        <span>·</span>
                        <span>{formatRelativeTime(event.createdAt)}</span>
                        {event.visibility === 'INTERNAL' && (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            interno
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-0.5">{getEventDescription(event)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-3">
                {(['MESSAGE', 'NOTE'] as const).map((type) => (
                  <button
                    key={type}
                    className={cn(
                      'text-xs px-3 py-1 rounded-full border transition-colors',
                      messageType === type && type === 'MESSAGE' && 'bg-primary text-primary-foreground border-primary',
                      messageType === type && type === 'NOTE' && 'bg-amber-500 text-white border-amber-500',
                      messageType !== type && 'border-border text-muted-foreground hover:border-primary/40',
                    )}
                    onClick={() => setMessageType(type)}
                  >
                    {type === 'MESSAGE' ? 'Mensaje' : 'Nota interna'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={messageType === 'NOTE' ? 'Nota visible solo para el equipo...' : 'Escribí un mensaje...'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
                      addEventMutation.mutate(message.trim());
                    }
                  }}
                  className={cn(messageType === 'NOTE' && 'border-amber-300 focus-visible:ring-amber-400')}
                />
                <Button
                  size="icon"
                  disabled={!message.trim() || addEventMutation.isPending}
                  onClick={() => message.trim() && addEventMutation.mutate(message.trim())}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar 30% */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Propiedad</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{ticket.property.name}</span>
              </div>
              <p className="text-xs text-muted-foreground ml-6">{ticket.property.address}</p>
              {ticket.unit && <p className="text-xs text-muted-foreground ml-6">Unidad: {ticket.unit.identifier}</p>}
              {ticket.asset && <p className="text-xs text-muted-foreground ml-6">Activo: {ticket.asset.name}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Solicitante</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                  {ticket.requester.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{ticket.requester.name}</p>
                  <p className="text-xs text-muted-foreground">{ticket.requester.email}</p>
                  {ticket.requester.phone && <p className="text-xs text-muted-foreground">{ticket.requester.phone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {(ticket.category || ticket.trade) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clasificación</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-1 text-sm">
                {ticket.category && <p>{ticket.category.name}</p>}
                {ticket.trade && <p className="text-muted-foreground text-xs">{ticket.trade.name}</p>}
              </CardContent>
            </Card>
          )}

          {ticket.provider && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Proveedor</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{ticket.provider.businessName}</p>
                    <p className="text-xs text-muted-foreground">{ticket.provider.contactName}</p>
                    <p className="text-xs text-muted-foreground">{ticket.provider.phone}</p>
                    <p className="text-xs text-yellow-600 font-medium mt-0.5">
                      ★ {ticket.provider.avgRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {ticket.provider && ['VALIDATED', 'CLOSED'].includes(ticket.status) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calificación</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => setShowRateModal(true)}
                >
                  <Star className="h-3.5 w-3.5 text-yellow-500" />
                  Calificar proveedor
                </Button>
              </CardContent>
            </Card>
          )}

          {ticket.slaDueAt && (
            <Card className={cn(isOverSla && 'border-red-300 bg-red-50/30')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SLA</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Clock className={cn('h-4 w-4 shrink-0', isOverSla ? 'text-red-500' : 'text-muted-foreground')} />
                  <div>
                    <p className={cn('text-sm font-medium', isOverSla && 'text-red-600')}>
                      {formatDateTime(ticket.slaDueAt)}
                    </p>
                    {ticket.slaConfig && (
                      <p className="text-xs text-muted-foreground">
                        R: {ticket.slaConfig.responseTimeHours}h · Res: {ticket.slaConfig.resolutionTimeHours}h
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showRateModal && ticket.provider && (
        <RateProviderModal
          ticketId={ticket.id}
          providerName={ticket.provider.businessName}
          onClose={() => setShowRateModal(false)}
          onRated={() => {
            queryClient.invalidateQueries({ queryKey: ['ticket', id] });
            setShowRateModal(false);
          }}
        />
      )}
    </div>
  );
}

function RateProviderModal({
  ticketId,
  providerName,
  onClose,
  onRated,
}: {
  ticketId: string;
  providerName: string;
  onClose: () => void;
  onRated: () => void;
}) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/tickets/${ticketId}/rate`, { score, comment: comment || undefined }),
    onSuccess: () => {
      toast.success('Calificación registrada');
      onRated();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al calificar'),
  });

  const display = hovered || score;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Calificar proveedor</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <RefreshCw className="h-4 w-4 hidden" />
            ×
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          ¿Cómo calificás el servicio de <span className="font-medium text-foreground">{providerName}</span>?
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHovered(s)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setScore(s)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  'h-8 w-8',
                  display >= s ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground',
                )}
              />
            </button>
          ))}
        </div>

        {score > 0 && (
          <p className="text-center text-sm text-muted-foreground mb-3">
            {score === 1 && 'Muy malo'}
            {score === 2 && 'Malo'}
            {score === 3 && 'Regular'}
            {score === 4 && 'Bueno'}
            {score === 5 && 'Excelente'}
          </p>
        )}

        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          placeholder="Comentarios opcionales sobre el servicio..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={score === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Star className="h-4 w-4" />
            Enviar calificación
          </Button>
        </div>
      </div>
    </div>
  );
}
