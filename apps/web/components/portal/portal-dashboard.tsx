'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { STATUS_CONFIG } from '@/lib/utils';
import { Plus, Ticket, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '@toori360/shared';
import { cn } from '@/lib/utils';

interface TicketSummary {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  property: { name: string };
}

export function PortalDashboard() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['portal-tickets'],
    queryFn: () => api.get<{ data: TicketSummary[]; meta: { total: number } }>('/tickets?limit=20'),
  });

  const tickets = data?.data || [];
  const open = tickets.filter((t) => !['CLOSED', 'CANCELLED', 'VALIDATED'].includes(t.status));
  const closed = tickets.filter((t) => ['CLOSED', 'CANCELLED', 'VALIDATED'].includes(t.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Mis solicitudes</h1>
          <p className="text-sm text-muted-foreground">Hola, {user?.name?.split(' ')[0]}</p>
        </div>
        <Link href="/portal/tickets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva solicitud
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg" />)}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-10 flex flex-col items-center gap-3">
            <Ticket className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Aún no tenés solicitudes</p>
            <Link href="/portal/tickets/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear primera solicitud
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Abiertas ({open.length})
              </h2>
              <div className="space-y-2">
                {open.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </section>
          )}

          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Resueltas ({closed.length})
              </h2>
              <div className="space-y-2">
                {closed.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: TicketSummary }) {
  const statusConfig = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];

  return (
    <Link href={`/portal/tickets/${ticket.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn('w-2 h-2 rounded-full shrink-0 mt-0.5', statusConfig?.dotColor || 'bg-muted-foreground')} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{ticket.number}</span>
              <span className={cn('text-[11px] px-1.5 py-0 rounded-full', statusConfig?.className || 'bg-muted text-muted-foreground')}>
                {statusConfig?.label || ticket.status}
              </span>
            </div>
            <p className="text-sm font-medium truncate mt-0.5">{ticket.title}</p>
            <p className="text-xs text-muted-foreground">{ticket.property.name} · {formatRelativeTime(ticket.updatedAt)}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
