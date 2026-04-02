'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Download, BarChart3, AlertTriangle, CheckCircle2, Ticket } from 'lucide-react';

interface ReportData {
  tickets: Array<{
    number: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    closedAt: string | null;
    slaDueAt: string | null;
    slaAlertSent: boolean;
    category: { name: string } | null;
    property: { name: string } | null;
    provider: { businessName: string } | null;
    requester: { name: string; email: string };
    assignee: { name: string } | null;
  }>;
  providers: Array<{
    businessName: string;
    avgRating: number;
    totalJobs: number;
    avgResponseTime: number | null;
    _count: { tickets: number; quotes: number };
  }>;
  byPriority: Array<{ priority: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  summary: { total: number; closed: number; overSla: number };
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#3b82f6',
  LOW: '#6b7280',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Medio', LOW: 'Bajo',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo', RECEIVED: 'Recibido', IN_REVIEW: 'En revisión',
  ASSIGNED: 'Asignado', AWAITING_QUOTE: 'Esperando presupuesto',
  QUOTE_RECEIVED: 'Presupuesto recibido', PENDING_APPROVAL: 'Pend. aprobación',
  APPROVED: 'Aprobado', SCHEDULING_VISIT: 'Prog. visita', IN_PROGRESS: 'En curso',
  PAUSED: 'Pausado', COMPLETED: 'Completado', VALIDATED: 'Validado',
  CLOSED: 'Cerrado', CANCELLED: 'Cancelado',
};

function downloadCsv(tickets: ReportData['tickets']) {
  const header = [
    'Número', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Propiedad',
    'Proveedor', 'Solicitante', 'Responsable', 'Creado', 'Cerrado', 'SLA vencido',
  ];

  const rows = tickets.map((t) => [
    t.number,
    `"${t.title.replace(/"/g, '""')}"`,
    STATUS_LABELS[t.status] || t.status,
    PRIORITY_LABELS[t.priority] || t.priority,
    t.category?.name || '',
    t.property?.name || '',
    t.provider?.businessName || '',
    t.requester.name,
    t.assignee?.name || '',
    new Date(t.createdAt).toLocaleDateString('es-AR'),
    t.closedAt ? new Date(t.closedAt).toLocaleDateString('es-AR') : '',
    t.slaAlertSent ? 'Sí' : 'No',
  ]);

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `toori360-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayStr);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report', from, to],
    queryFn: () =>
      api.get<{ data: ReportData }>(
        `/dashboard/report?${new URLSearchParams({ from, to })}`,
      ),
  });

  const report = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Análisis y exportación de datos</p>
        </div>
        {report && (
          <Button variant="outline" onClick={() => downloadCsv(report.tickets)} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {/* Date filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-3 flex-wrap">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Desde</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Hasta</label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Aplicar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : report ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Ticket className="h-4 w-4" />
                  <span className="text-xs">Total tickets</span>
                </div>
                <p className="text-2xl font-bold">{report.summary.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Cerrados</span>
                </div>
                <p className="text-2xl font-bold">{report.summary.closed}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {report.summary.total > 0
                    ? Math.round((report.summary.closed / report.summary.total) * 100)
                    : 0}% del total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">SLA vencido</span>
                </div>
                <p className="text-2xl font-bold">{report.summary.overSla}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs">Cumpl. SLA</span>
                </div>
                <p className="text-2xl font-bold">
                  {report.summary.total > 0
                    ? Math.round(((report.summary.total - report.summary.overSla) / report.summary.total) * 100)
                    : 100}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* By Priority */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tickets por prioridad</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={report.byPriority} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="priority"
                      type="category"
                      width={70}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => PRIORITY_LABELS[v] || v}
                    />
                    <Tooltip
                      formatter={(v) => [v, 'Tickets']}
                      labelFormatter={(l) => PRIORITY_LABELS[l] || l}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {report.byPriority.map((entry) => (
                        <Cell
                          key={entry.priority}
                          fill={PRIORITY_COLORS[entry.priority] || '#6b7280'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* By Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tickets por estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {report.byStatus
                    .sort((a, b) => b.count - a.count)
                    .map((s) => {
                      const max = Math.max(...report.byStatus.map((x) => x.count));
                      return (
                        <div key={s.status} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-36 truncate shrink-0">
                            {STATUS_LABELS[s.status] || s.status}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${max > 0 ? (s.count / max) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">{s.count}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Providers ranking */}
          {report.providers.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rendimiento de proveedores</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Proveedor</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Trabajos</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Calificación</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Presupuestos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.providers.map((p) => (
                        <tr key={p.businessName} className="hover:bg-muted/20">
                          <td className="px-4 py-2 font-medium">{p.businessName}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{p.totalJobs}</td>
                          <td className="px-4 py-2 text-right tabular-nums">
                            {p.avgRating > 0 ? `★ ${p.avgRating.toFixed(1)}` : '—'}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums">{p._count.quotes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
