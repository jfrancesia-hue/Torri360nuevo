'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { FileText, ExternalLink, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Quote {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  estimatedDays?: number | null;
  createdAt: string;
  ticket: { id: string; number: string; title: string; status: string };
  provider: { id: string; businessName: string; contactName: string };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pendiente',
    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: 'Aprobado',
    cls: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: 'Rechazado',
    cls: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="h-3 w-3" />,
  },
  EXPIRED: {
    label: 'Vencido',
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'ARS' ? 'ARS' : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function QuotesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', { status: statusFilter, page }],
    queryFn: () =>
      api.get<{ data: Quote[]; meta: { total: number; totalPages: number } }>(
        `/quotes?${new URLSearchParams({
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
          page: String(page),
          limit: '30',
        })}`,
      ),
  });

  const quotes = data?.data || [];
  const meta = data?.meta;

  // Summary counts
  const { data: summaryData } = useQuery({
    queryKey: ['quotes-summary'],
    queryFn: () => api.get<{ data: Quote[] }>('/quotes?limit=200'),
  });

  const summary = (summaryData?.data || []).reduce((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gestión global de presupuestos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <Card
            key={status}
            className={cn(
              'cursor-pointer border-2 transition-colors',
              statusFilter === status ? 'border-primary' : 'border-transparent hover:border-muted',
            )}
            onClick={() => { setStatusFilter(status); setPage(1); }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1', cfg.cls)}>
                  {cfg.icon}
                  {cfg.label}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">{summary[status] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
              <SelectItem key={v} value={v}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {meta && (
          <p className="text-sm text-muted-foreground">{meta.total} presupuestos</p>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin presupuestos</p>
          <p className="text-sm mt-1">Los presupuestos se crean desde el detalle de un ticket</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Ticket</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Proveedor</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Monto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Días est.</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Fecha</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotes.map((quote) => {
                    const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.PENDING;
                    return (
                      <tr key={quote.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-xs text-primary">{quote.ticket.number}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {quote.ticket.title}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{quote.provider.businessName}</p>
                          <p className="text-xs text-muted-foreground">{quote.provider.contactName}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatCurrency(quote.amount, quote.currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {quote.estimatedDays ? `${quote.estimatedDays}d` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={cn('text-xs flex items-center gap-1 w-fit', cfg.cls)}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(quote.createdAt).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/tickets/${quote.ticket.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
