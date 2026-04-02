'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Send, MessageSquare, Clock } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/utils';
import { formatDateTime, formatRelativeTime, TicketStatus, EventType } from '@toori360/shared';
import { cn } from '@/lib/utils';

interface TicketDetail {
  id: string;
  number: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: string;
  createdAt: string;
  updatedAt: string;
  slaDueAt?: string | null;
  property: { name: string; address: string };
  provider?: { businessName: string; contactName: string; phone: string } | null;
  events: {
    id: string;
    eventType: EventType;
    data: Record<string, unknown>;
    visibility: string;
    createdAt: string;
    user?: { name: string } | null;
  }[];
}

export function PortalTicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['portal-ticket', id],
    queryFn: () => api.get<{ data: TicketDetail }>(`/tickets/${id}`),
  });

  const addMessageMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/tickets/${id}/events`, { eventType: 'MESSAGE', content, visibility: 'ALL' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-ticket', id] });
      setMessage('');
      toast.success('Mensaje enviado');
    },
    onError: () => toast.error('Error al enviar'),
  });

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-40 bg-muted rounded-lg" />
        <div className="h-60 bg-muted rounded-lg" />
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Solicitud no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/portal/dashboard')}>
          Volver
        </Button>
      </div>
    );
  }

  const ticket = data.data;
  const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];
  const visibleEvents = ticket.events.filter((e) => e.visibility !== 'INTERNAL');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/portal/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{ticket.number}</span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusConfig?.className || 'bg-muted text-muted-foreground')}>
              {statusConfig?.label || ticket.status}
            </span>
          </div>
          <h1 className="text-lg font-bold mt-0.5">{ticket.title}</h1>
          <p className="text-xs text-muted-foreground">{ticket.property.name} · {formatRelativeTime(ticket.updatedAt)}</p>
        </div>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          <p className="text-xs text-muted-foreground mt-3">
            Creada el {formatDateTime(ticket.createdAt)}
          </p>
          {ticket.slaDueAt && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Vencimiento SLA: {formatDateTime(ticket.slaDueAt)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider info if assigned */}
      {ticket.provider && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Técnico asignado</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            <p className="font-medium">{ticket.provider.businessName}</p>
            <p className="text-muted-foreground">{ticket.provider.contactName}</p>
            <a href={`tel:${ticket.provider.phone}`} className="text-primary hover:underline">
              {ticket.provider.phone}
            </a>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Actualizaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {visibleEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin actualizaciones todavía</p>
          ) : (
            <div className="divide-y divide-border">
              {visibleEvents.map((event) => (
                <div key={event.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                    <span className="font-medium text-foreground">{event.user?.name || 'Sistema'}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(event.createdAt)}</span>
                  </div>
                  <p className="text-sm">
                    {event.eventType === 'STATUS_CHANGE'
                      ? `Estado actualizado: ${(event.data as { to?: string }).to}`
                      : event.eventType === 'MESSAGE'
                      ? (event.data as { content?: string }).content
                      : event.eventType === 'ASSIGNMENT'
                      ? 'Se asignó un técnico a tu solicitud'
                      : event.eventType === 'VISIT_SCHEDULED'
                      ? 'Se agendó una visita técnica'
                      : event.eventType === 'CHECKIN'
                      ? 'El técnico realizó el check-in'
                      : event.eventType === 'CHECKOUT'
                      ? 'El técnico completó la visita'
                      : String(event.eventType)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send message (only if ticket is not closed) */}
      {!['CLOSED', 'CANCELLED', 'VALIDATED'].includes(ticket.status) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribí un mensaje o consulta..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
                    addMessageMutation.mutate(message.trim());
                  }
                }}
              />
              <Button
                size="icon"
                disabled={!message.trim() || addMessageMutation.isPending}
                onClick={() => message.trim() && addMessageMutation.mutate(message.trim())}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
