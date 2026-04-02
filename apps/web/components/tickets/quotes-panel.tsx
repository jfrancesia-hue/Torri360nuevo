'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@toori360/shared';
import {
  FileText, Plus, ThumbsUp, ThumbsDown, Star, X, Check, Clock,
} from 'lucide-react';

interface Quote {
  id: string;
  amount: number;
  currency: string;
  description: string;
  estimatedDays?: number | null;
  conditions?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  provider: { id: string; businessName: string; avgRating: number; contactName: string };
}

interface QuotesPanelProps {
  ticketId: string;
  providerId?: string | null;
  ticketStatus: string;
}

export function QuotesPanel({ ticketId, providerId, ticketStatus }: QuotesPanelProps) {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', ticketId],
    queryFn: () => api.get<{ data: Quote[] }>(`/tickets/${ticketId}/quotes`),
  });

  const approveMutation = useMutation({
    mutationFn: (quoteId: string) => api.post(`/quotes/${quoteId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Presupuesto aprobado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/quotes/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Presupuesto rechazado');
      setRejectingId(null);
      setRejectReason('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const quotes = data?.data || [];
  const canApprove = ['QUOTE_RECEIVED', 'PENDING_APPROVAL'].includes(ticketStatus);
  const pendingQuotes = quotes.filter((q) => q.status === 'PENDING');
  const approvedQuote = quotes.find((q) => q.status === 'APPROVED');

  if (isLoading) {
    return <div className="h-24 bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Presupuestos {quotes.length > 0 && `(${quotes.length})`}
            </CardTitle>
            <div className="flex gap-2">
              {['AWAITING_QUOTE', 'ASSIGNED', 'IN_REVIEW'].includes(ticketStatus) && (
                <Button size="sm" variant="outline" onClick={() => setShowRequestModal(true)}>
                  Solicitar
                </Button>
              )}
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Cargar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay presupuestos cargados
            </p>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className={cn(
                    'p-4 rounded-lg border transition-colors',
                    q.status === 'APPROVED' && 'border-green-300 bg-green-50/50',
                    q.status === 'REJECTED' && 'border-red-200 bg-red-50/30 opacity-60',
                    q.status === 'PENDING' && 'border-border',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-lg">
                          {q.currency} {q.amount.toLocaleString('es-AR')}
                        </span>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          q.status === 'APPROVED' && 'bg-green-100 text-green-700',
                          q.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                          q.status === 'REJECTED' && 'bg-red-100 text-red-700',
                          q.status === 'EXPIRED' && 'bg-gray-100 text-gray-600',
                        )}>
                          {q.status === 'APPROVED' ? '✓ Aprobado' : q.status === 'PENDING' ? 'Pendiente' : q.status === 'REJECTED' ? 'Rechazado' : 'Vencido'}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">{q.provider.businessName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {q.provider.avgRating.toFixed(1)} · {q.provider.contactName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">{q.description}</p>
                      {q.estimatedDays && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Plazo estimado: {q.estimatedDays} días
                        </p>
                      )}
                      {q.conditions && (
                        <p className="text-xs text-muted-foreground mt-1">Condiciones: {q.conditions}</p>
                      )}
                      {q.status === 'REJECTED' && q.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Motivo: {q.rejectionReason}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(q.createdAt)}</p>
                    </div>

                    {canApprove && q.status === 'PENDING' && !approvedQuote && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(q.id)}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setRejectingId(q.id)}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject reason modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card border rounded-xl p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Rechazar presupuesto</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRejectingId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none mb-4"
              placeholder="Motivo del rechazo (opcional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRejectingId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectingId, reason: rejectReason })}
              >
                Confirmar rechazo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add quote modal */}
      {showAddModal && (
        <AddQuoteModal
          ticketId={ticketId}
          providerId={providerId}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['quotes', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            setShowAddModal(false);
          }}
        />
      )}

      {/* Request quote modal */}
      {showRequestModal && (
        <RequestQuoteModal
          ticketId={ticketId}
          onClose={() => setShowRequestModal(false)}
          onRequested={() => {
            queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
            setShowRequestModal(false);
            toast.success('Solicitud de presupuesto enviada');
          }}
        />
      )}
    </>
  );
}

function AddQuoteModal({
  ticketId, providerId, onClose, onAdded,
}: {
  ticketId: string;
  providerId?: string | null;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    providerId: providerId || '',
    amount: '',
    currency: 'ARS',
    description: '',
    estimatedDays: '',
    conditions: '',
  });

  const { data: providers } = useQuery({
    queryKey: ['providers', 'active'],
    queryFn: () => api.get<{ data: { id: string; businessName: string }[] }>('/providers?status=ACTIVE&limit=50'),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/tickets/${ticketId}/quotes`, {
        providerId: form.providerId,
        amount: parseFloat(form.amount),
        currency: form.currency,
        description: form.description,
        estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : undefined,
        conditions: form.conditions || undefined,
      }),
    onSuccess: onAdded,
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-lg shadow-xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Cargar presupuesto</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Proveedor *</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.providerId}
              onChange={(e) => setForm({ ...form, providerId: e.target.value })}
            >
              <option value="">Seleccioná proveedor</option>
              {providers?.data?.map((p) => (
                <option key={p.id} value={p.id}>{p.businessName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Monto *</label>
              <Input
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Moneda</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Descripción *</label>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Detalle del trabajo a realizar..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Días estimados</label>
              <Input
                type="number"
                placeholder="3"
                value={form.estimatedDays}
                onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Condiciones</label>
              <Input
                placeholder="Ej: 50% anticipo"
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            disabled={!form.providerId || !form.amount || !form.description || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Check className="h-4 w-4 mr-1" />
            Guardar presupuesto
          </Button>
        </div>
      </div>
    </div>
  );
}

function RequestQuoteModal({
  ticketId, onClose, onRequested,
}: {
  ticketId: string;
  onClose: () => void;
  onRequested: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data } = useQuery({
    queryKey: ['providers', 'active'],
    queryFn: () =>
      api.get<{ data: { id: string; businessName: string; avgRating: number; trades: { trade: { name: string } }[] }[] }>(
        '/providers?status=ACTIVE&limit=50',
      ),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/tickets/${ticketId}/quotes/request`, { providerIds: selectedIds }),
    onSuccess: onRequested,
    onError: (err: Error) => toast.error(err.message),
  });

  const toggle = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border rounded-xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Solicitar presupuesto</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Seleccioná los proveedores a los que querés solicitar presupuesto:
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {data?.data?.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                selectedIds.includes(p.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.businessName}</p>
                  <div className="flex gap-1 flex-wrap mt-0.5">
                    {p.trades.map((t, i) => (
                      <span key={i} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {t.trade.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-yellow-600">★ {p.avgRating.toFixed(1)}</span>
                  {selectedIds.includes(p.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            disabled={selectedIds.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Solicitar a {selectedIds.length} proveedor{selectedIds.length !== 1 ? 'es' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
