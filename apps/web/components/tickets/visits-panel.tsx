'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@toori360/shared';
import {
  Calendar, Plus, CheckCircle2, X, MapPin, LogIn, LogOut,
  RefreshCw, Clock,
} from 'lucide-react';

interface Visit {
  id: string;
  scheduledAt: string;
  windowStart?: string | null;
  windowEnd?: string | null;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  checkinAt?: string | null;
  checkoutAt?: string | null;
  notes?: string | null;
  rescheduleReason?: string | null;
}

interface VisitsPanelProps {
  ticketId: string;
  providerId?: string | null;
  ticketStatus: string;
}

const VISIT_STATUS_LABELS: Record<Visit['status'], string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  RESCHEDULED: 'Reprogramada',
};

const VISIT_STATUS_CLASS: Record<Visit['status'], string> = {
  SCHEDULED:   'bg-blue-100 text-blue-700',
  CONFIRMED:   'bg-sky-100 text-sky-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED:   'bg-green-100 text-green-700',
  CANCELLED:   'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-purple-100 text-purple-700',
};

export function VisitsPanel({ ticketId, providerId, ticketStatus }: VisitsPanelProps) {
  const queryClient = useQueryClient();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [rescheduleVisit, setRescheduleVisit] = useState<Visit | null>(null);
  const [checkinVisit, setCheckinVisit] = useState<Visit | null>(null);
  const [checkoutVisit, setCheckoutVisit] = useState<Visit | null>(null);

  const { data } = useQuery({
    queryKey: ['visits', ticketId],
    queryFn: () => api.get<{ data: Visit[] }>(`/visits/by-ticket/${ticketId}`),
  });

  const confirmMutation = useMutation({
    mutationFn: (visitId: string) => api.post(`/visits/${visitId}/confirm`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Visita confirmada');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al confirmar'),
  });

  const cancelMutation = useMutation({
    mutationFn: (visitId: string) =>
      api.patch(`/visits/${visitId}`, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Visita cancelada');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al cancelar'),
  });

  const visits = data?.data || [];
  const activeStatuses: Visit['status'][] = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'RESCHEDULED'];
  const canSchedule = !!providerId && !['CLOSED', 'CANCELLED', 'VALIDATED'].includes(ticketStatus);

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Visitas ({visits.length})
            </CardTitle>
            {canSchedule && (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowScheduleModal(true)}>
                <Plus className="h-3 w-3" />
                Agendar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3 text-center">
              {canSchedule ? 'Sin visitas agendadas. Agendá la primera.' : 'Sin visitas registradas.'}
            </p>
          ) : (
            <div className="space-y-2">
              {visits.map((visit) => (
                <div key={visit.id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{formatDateTime(visit.scheduledAt)}</span>
                      </div>
                      {visit.windowStart && visit.windowEnd && (
                        <p className="text-xs text-muted-foreground ml-5">
                          Ventana: {visit.windowStart} – {visit.windowEnd}
                        </p>
                      )}
                      {visit.checkinAt && (
                        <p className="text-xs text-muted-foreground ml-5 flex items-center gap-1">
                          <LogIn className="h-3 w-3" />
                          Check-in: {formatDateTime(visit.checkinAt)}
                        </p>
                      )}
                      {visit.checkoutAt && (
                        <p className="text-xs text-muted-foreground ml-5 flex items-center gap-1">
                          <LogOut className="h-3 w-3" />
                          Check-out: {formatDateTime(visit.checkoutAt)}
                        </p>
                      )}
                      {visit.notes && (
                        <p className="text-xs text-muted-foreground ml-5">{visit.notes}</p>
                      )}
                    </div>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full shrink-0', VISIT_STATUS_CLASS[visit.status])}>
                      {VISIT_STATUS_LABELS[visit.status]}
                    </span>
                  </div>

                  {activeStatuses.includes(visit.status) && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                      {visit.status === 'SCHEDULED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] gap-1 px-2"
                          disabled={confirmMutation.isPending}
                          onClick={() => confirmMutation.mutate(visit.id)}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Confirmar
                        </Button>
                      )}
                      {(visit.status === 'SCHEDULED' || visit.status === 'CONFIRMED') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] gap-1 px-2"
                            onClick={() => setRescheduleVisit(visit)}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Reprogramar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] gap-1 px-2 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => setCheckinVisit(visit)}
                          >
                            <MapPin className="h-3 w-3" />
                            Check-in
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[11px] gap-1 px-2 text-red-600 border-red-200 hover:bg-red-50"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(visit.id)}
                          >
                            <X className="h-3 w-3" />
                            Cancelar
                          </Button>
                        </>
                      )}
                      {visit.status === 'IN_PROGRESS' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] gap-1 px-2 text-orange-700 border-orange-300 hover:bg-orange-50"
                          onClick={() => setCheckoutVisit(visit)}
                        >
                          <LogOut className="h-3 w-3" />
                          Check-out
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showScheduleModal && (
        <ScheduleVisitModal
          ticketId={ticketId}
          providerId={providerId!}
          onClose={() => setShowScheduleModal(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['visits', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            setShowScheduleModal(false);
          }}
        />
      )}

      {rescheduleVisit && (
        <RescheduleModal
          visit={rescheduleVisit}
          onClose={() => setRescheduleVisit(null)}
          onRescheduled={() => {
            queryClient.invalidateQueries({ queryKey: ['visits', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            setRescheduleVisit(null);
          }}
        />
      )}

      {checkinVisit && (
        <CheckinModal
          visit={checkinVisit}
          onClose={() => setCheckinVisit(null)}
          onCheckedIn={() => {
            queryClient.invalidateQueries({ queryKey: ['visits', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            setCheckinVisit(null);
          }}
        />
      )}

      {checkoutVisit && (
        <CheckoutModal
          visit={checkoutVisit}
          onClose={() => setCheckoutVisit(null)}
          onCheckedOut={() => {
            queryClient.invalidateQueries({ queryKey: ['visits', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            setCheckoutVisit(null);
          }}
        />
      )}
    </>
  );
}

function ScheduleVisitModal({
  ticketId,
  providerId,
  onClose,
  onCreated,
}: {
  ticketId: string;
  providerId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/visits', {
        ticketId,
        providerId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        windowStart: windowStart || undefined,
        windowEnd: windowEnd || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      toast.success('Visita agendada');
      onCreated();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al agendar'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Agendar visita</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Fecha y hora *</label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ventana desde</label>
              <Input
                type="time"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                placeholder="08:00"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Ventana hasta</label>
              <Input
                type="time"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                placeholder="12:00"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notas (opcional)</label>
            <textarea
              className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Instrucciones para el proveedor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!scheduledAt || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agendar
          </Button>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({
  visit,
  onClose,
  onRescheduled,
}: {
  visit: Visit;
  onClose: () => void;
  onRescheduled: () => void;
}) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/visits/${visit.id}`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        rescheduleReason: reason,
        status: 'RESCHEDULED',
      }),
    onSuccess: () => {
      toast.success('Visita reprogramada');
      onRescheduled();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al reprogramar'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Reprogramar visita</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nueva fecha y hora *</label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo *</label>
            <textarea
              className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="¿Por qué se reprograma?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={!scheduledAt || !reason.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reprogramar
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckinModal({
  visit,
  onClose,
  onCheckedIn,
}: {
  visit: Visit;
  onClose: () => void;
  onCheckedIn: () => void;
}) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible en este navegador');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString());
        setLng(pos.coords.longitude.toString());
        setGeoLoading(false);
      },
      () => {
        toast.error('No se pudo obtener la ubicación');
        setGeoLoading(false);
      },
    );
  };

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/visits/${visit.id}/checkin`, { lat: parseFloat(lat), lng: parseFloat(lng) }),
    onSuccess: () => {
      toast.success('Check-in registrado');
      onCheckedIn();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al registrar check-in'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Registrar check-in</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Visita del {formatDateTime(visit.scheduledAt)}
        </p>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={geoLoading}
            onClick={getLocation}
          >
            <MapPin className="h-4 w-4" />
            {geoLoading ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
          </Button>

          {lat && lng && (
            <p className="text-xs text-muted-foreground text-center">
              Lat: {parseFloat(lat).toFixed(6)} · Lng: {parseFloat(lng).toFixed(6)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Latitud</label>
              <Input
                type="number"
                step="any"
                placeholder="-34.603722"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Longitud</label>
              <Input
                type="number"
                step="any"
                placeholder="-58.381592"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!lat || !lng || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <LogIn className="h-4 w-4" />
            Registrar check-in
          </Button>
        </div>
      </div>
    </div>
  );
}

function CheckoutModal({
  visit,
  onClose,
  onCheckedOut,
}: {
  visit: Visit;
  onClose: () => void;
  onCheckedOut: () => void;
}) {
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => api.post(`/visits/${visit.id}/checkout`, { notes }),
    onSuccess: () => {
      toast.success('Check-out registrado');
      onCheckedOut();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al registrar check-out'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Registrar check-out</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Visita del {formatDateTime(visit.scheduledAt)}
        </p>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Notas del trabajo realizado *
          </label>
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            placeholder="Describí el trabajo realizado, materiales usados, observaciones..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!notes.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
            Registrar check-out
          </Button>
        </div>
      </div>
    </div>
  );
}
