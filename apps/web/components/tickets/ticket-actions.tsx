'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TicketStatus, VALID_TRANSITIONS, isValidTransition } from '@toori360/shared';
import {
  ChevronRight, UserPlus, X, CheckCircle2, Play, Pause,
  FileText, CalendarPlus, ThumbsUp, ThumbsDown, Star,
} from 'lucide-react';

interface Provider {
  id: string;
  businessName: string;
  contactName: string;
  avgRating: number;
  trades: { trade: { name: string } }[];
}

const STATUS_ACTION_LABELS: Partial<Record<TicketStatus, { label: string; variant: 'default' | 'outline' | 'destructive' | 'secondary' }>> = {
  [TicketStatus.RECEIVED]:       { label: 'Marcar recibido', variant: 'outline' },
  [TicketStatus.IN_REVIEW]:      { label: 'Poner en revisión', variant: 'outline' },
  [TicketStatus.ASSIGNED]:       { label: 'Asignar', variant: 'default' },
  [TicketStatus.AWAITING_QUOTE]: { label: 'Pedir presupuesto', variant: 'outline' },
  [TicketStatus.IN_PROGRESS]:    { label: 'Iniciar trabajo', variant: 'default' },
  [TicketStatus.PAUSED]:         { label: 'Pausar', variant: 'secondary' },
  [TicketStatus.COMPLETED]:      { label: 'Marcar completado', variant: 'default' },
  [TicketStatus.VALIDATED]:      { label: 'Validar', variant: 'default' },
  [TicketStatus.CLOSED]:         { label: 'Cerrar', variant: 'default' },
  [TicketStatus.CANCELLED]:      { label: 'Cancelar', variant: 'destructive' },
};

const STATUS_ACTION_ICONS: Partial<Record<TicketStatus, React.ReactNode>> = {
  [TicketStatus.IN_PROGRESS]:  <Play className="h-3.5 w-3.5" />,
  [TicketStatus.PAUSED]:       <Pause className="h-3.5 w-3.5" />,
  [TicketStatus.COMPLETED]:    <CheckCircle2 className="h-3.5 w-3.5" />,
  [TicketStatus.VALIDATED]:    <ThumbsUp className="h-3.5 w-3.5" />,
  [TicketStatus.CANCELLED]:    <X className="h-3.5 w-3.5" />,
  [TicketStatus.ASSIGNED]:     <UserPlus className="h-3.5 w-3.5" />,
  [TicketStatus.AWAITING_QUOTE]: <FileText className="h-3.5 w-3.5" />,
  [TicketStatus.SCHEDULING_VISIT]: <CalendarPlus className="h-3.5 w-3.5" />,
  [TicketStatus.CLOSED]:       <CheckCircle2 className="h-3.5 w-3.5" />,
};

interface TicketActionsProps {
  ticketId: string;
  currentStatus: TicketStatus;
  providerId?: string | null;
  tenantId?: string;
}

export function TicketActions({ ticketId, currentStatus, providerId }: TicketActionsProps) {
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState<TicketStatus | null>(null);
  const [reason, setReason] = useState('');

  const validNextStatuses = VALID_TRANSITIONS[currentStatus] || [];

  const changeStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: TicketStatus; reason?: string }) =>
      api.patch(`/tickets/${ticketId}/status`, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Estado actualizado');
      setShowReasonModal(null);
      setReason('');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al cambiar estado'),
  });

  const handleStatusClick = (status: TicketStatus) => {
    const needsReason = [TicketStatus.CANCELLED, TicketStatus.PAUSED].includes(status);
    if (needsReason) {
      setShowReasonModal(status);
    } else if (status === TicketStatus.ASSIGNED) {
      setShowAssignModal(true);
    } else {
      changeStatusMutation.mutate({ status });
    }
  };

  if (validNextStatuses.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Acciones</p>
        <div className="flex flex-wrap gap-2">
          {validNextStatuses.map((status) => {
            const config = STATUS_ACTION_LABELS[status];
            if (!config) return null;
            return (
              <Button
                key={status}
                variant={config.variant}
                size="sm"
                className="text-xs gap-1.5"
                disabled={changeStatusMutation.isPending}
                onClick={() => handleStatusClick(status)}
              >
                {STATUS_ACTION_ICONS[status]}
                {config.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Reason modal (for cancel/pause) */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <h3 className="font-semibold mb-1">
              {showReasonModal === TicketStatus.CANCELLED ? 'Motivo de cancelación' : 'Motivo de pausa'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Explicá brevemente por qué se{' '}
              {showReasonModal === TicketStatus.CANCELLED ? 'cancela' : 'pausa'} este ticket.
            </p>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Ingresá el motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowReasonModal(null)}>
                Cancelar
              </Button>
              <Button
                variant={showReasonModal === TicketStatus.CANCELLED ? 'destructive' : 'default'}
                className="flex-1"
                disabled={!reason.trim() || changeStatusMutation.isPending}
                onClick={() => changeStatusMutation.mutate({ status: showReasonModal, reason: reason.trim() })}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign provider modal */}
      {showAssignModal && (
        <AssignProviderModal
          ticketId={ticketId}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            setShowAssignModal(false);
          }}
        />
      )}
    </>
  );
}

function AssignProviderModal({
  ticketId,
  onClose,
  onAssigned,
}: {
  ticketId: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['providers', 'active'],
    queryFn: () =>
      api.get<{ data: Provider[] }>('/providers?status=ACTIVE&limit=50'),
  });

  const assignMutation = useMutation({
    mutationFn: (providerId: string) =>
      api.post(`/tickets/${ticketId}/assign`, { providerId }),
    onSuccess: () => {
      toast.success('Proveedor asignado');
      onAssigned();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al asignar'),
  });

  const providers = (data?.data || []).filter((p) =>
    p.businessName.toLowerCase().includes(search.toLowerCase()) ||
    p.trades.some((t) => t.trade.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Asignar proveedor</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <input
          className="w-full mb-3 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Buscar por nombre o rubro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedId(provider.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                selectedId === provider.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{provider.businessName}</p>
                  <p className="text-xs text-muted-foreground">{provider.contactName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {provider.trades.map((t, i) => (
                      <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {t.trade.name}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-yellow-600 text-sm font-medium flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                  {provider.avgRating.toFixed(1)}
                </span>
              </div>
            </button>
          ))}
          {providers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No se encontraron proveedores
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!selectedId || assignMutation.isPending}
            onClick={() => selectedId && assignMutation.mutate(selectedId)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Asignar
          </Button>
        </div>
      </div>
    </div>
  );
}
