'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Visit {
  id: string;
  scheduledAt: string;
  status: string;
  windowStart?: string | null;
  windowEnd?: string | null;
  ticket: { id: string; number: string; title: string; status: string; priority: string };
  provider: { id: string; businessName: string };
}

const VISIT_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
  RESCHEDULED: 'bg-yellow-100 text-yellow-700',
};

const VISIT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  RESCHEDULED: 'Reprogramada',
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () =>
      api.get<{ data: Visit[] }>(`/visits/calendar?from=${from}&to=${to}`),
  });

  const visits = data?.data || [];

  // Map visits by date string 'YYYY-MM-DD'
  const visitsByDate = useMemo(() => {
    const map: Record<string, Visit[]> = {};
    for (const v of visits) {
      const date = new Date(v.scheduledAt).toISOString().slice(0, 10);
      if (!map[date]) map[date] = [];
      map[date].push(v);
    }
    return map;
  }, [visits]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const todayStr = today.toISOString().slice(0, 10);

  const selectedVisits = selectedDate ? (visitsByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Visitas programadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid */}
          <div className="border rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-muted/40">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 divide-x divide-y border-t">
              {cells.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="min-h-[80px] bg-muted/10" />;
                }
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayVisits = visitsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      'min-h-[80px] p-1.5 cursor-pointer transition-colors',
                      isSelected && 'bg-primary/10',
                      !isSelected && 'hover:bg-muted/30',
                      isLoading && 'opacity-60',
                    )}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  >
                    <div className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                      isToday && 'bg-primary text-primary-foreground',
                      !isToday && 'text-foreground',
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayVisits.slice(0, 3).map((v) => (
                        <div
                          key={v.id}
                          className={cn(
                            'text-[10px] px-1 py-0.5 rounded truncate',
                            VISIT_STATUS_COLOR[v.status] || 'bg-blue-100 text-blue-700',
                          )}
                        >
                          {v.provider.businessName}
                        </div>
                      ))}
                      {dayVisits.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayVisits.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(VISIT_STATUS_LABELS).map(([status, label]) => (
              <span key={status} className={cn('text-xs px-2 py-0.5 rounded-full', VISIT_STATUS_COLOR[status])}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div>
          {selectedDate ? (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-sm">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </h3>
              {selectedVisits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin visitas este día</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedVisits.map((v) => (
                    <Link key={v.id} href={`/tickets/${v.ticket.id}`}>
                      <div className="border rounded-lg p-3 hover:bg-muted/30 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary">{v.ticket.number}</p>
                            <p className="text-sm font-medium truncate">{v.ticket.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{v.provider.businessName}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] shrink-0', VISIT_STATUS_COLOR[v.status])}
                          >
                            {VISIT_STATUS_LABELS[v.status]}
                          </Badge>
                        </div>
                        {(v.windowStart || v.scheduledAt) && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {new Date(v.scheduledAt).toLocaleTimeString('es-AR', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {v.windowEnd && ` - ${v.windowEnd}`}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">Resumen del mes</h3>
              <div className="space-y-2">
                {Object.entries(VISIT_STATUS_LABELS).map(([status, label]) => {
                  const count = visits.filter((v) => v.status === status).length;
                  if (count === 0) return null;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', VISIT_STATUS_COLOR[status])}>
                        {label}
                      </span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
                {visits.length === 0 && !isLoading && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin visitas este mes
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Hacé clic en un día para ver el detalle
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
