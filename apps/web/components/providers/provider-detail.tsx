'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Wrench, Phone, Mail, Star, Ticket, FileText, Calendar, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@toori360/shared';

interface Rating {
  id: string;
  score: number;
  comment?: string | null;
  createdAt: string;
}

interface Provider {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  status: string;
  avgRating: number;
  avgResponseTime?: number | null;
  totalJobs: number;
  cuit?: string | null;
  address?: string | null;
  trades: { trade: { id: string; name: string } }[];
  ratings: Rating[];
  _count: { tickets: number; quotes: number; visits: number };
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  PENDING:  'bg-yellow-100 text-yellow-700',
  BLOCKED:  'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo', PENDING: 'Pendiente', BLOCKED: 'Bloqueado',
};

export function ProviderDetail({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => api.get<{ data: Provider }>(`/providers/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Proveedor no encontrado</p>
        <Button variant="outline" onClick={() => router.push('/providers')}>Volver</Button>
      </div>
    );
  }

  const provider = data.data;

  const toggleStatus = useMutation({
    mutationFn: () =>
      api.patch(`/providers/${id}`, {
        status: provider.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider', id] });
      qc.invalidateQueries({ queryKey: ['providers'] });
      toast.success('Estado actualizado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/providers">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_CLASS[provider.status] || 'bg-muted text-muted-foreground')}>
              {STATUS_LABELS[provider.status] || provider.status}
            </span>
            <div className="flex items-center gap-1 text-yellow-600 text-sm font-semibold">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {provider.avgRating.toFixed(1)}
            </div>
          </div>
          <h1 className="text-xl font-bold mt-1">{provider.businessName}</h1>
          <p className="text-sm text-muted-foreground">{provider.contactName}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => toggleStatus.mutate()}
              disabled={toggleStatus.isPending}
            >
              <ToggleRight className="h-3.5 w-3.5" />
              {provider.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {provider.trades.map((t) => (
              <span key={t.trade.id} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                {t.trade.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{provider._count.tickets}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{provider._count.quotes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Presupuestos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{provider._count.visits}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Visitas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Información de contacto</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`tel:${provider.phone}`} className="hover:underline">{provider.phone}</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${provider.email}`} className="hover:underline">{provider.email}</a>
            </div>
            {provider.cuit && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>CUIT: {provider.cuit}</span>
              </div>
            )}
            {provider.address && (
              <p className="text-muted-foreground">{provider.address}</p>
            )}
            {provider.avgResponseTime !== undefined && provider.avgResponseTime !== null && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Tiempo respuesta prom: {provider.avgResponseTime}h</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent ratings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Calificaciones recientes ({provider.ratings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {provider.ratings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin calificaciones</p>
            ) : (
              <div className="space-y-2">
                {provider.ratings.map((rating) => (
                  <div key={rating.id} className="p-2 rounded-md bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn('h-3 w-3', rating.score >= s ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground')}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{formatRelativeTime(rating.createdAt)}</span>
                    </div>
                    {rating.comment && (
                      <p className="text-xs text-muted-foreground mt-1">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Link href={`/tickets?providerId=${provider.id}`}>
        <Button variant="outline" className="gap-2">
          <Ticket className="h-4 w-4" />
          Ver tickets de este proveedor ({provider._count.tickets})
        </Button>
      </Link>
    </div>
  );
}
