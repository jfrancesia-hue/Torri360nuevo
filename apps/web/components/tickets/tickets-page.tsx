'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusChip } from './status-chip';
import { PriorityBadge } from './priority-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter, Building2, User, Calendar } from 'lucide-react';
import { TicketStatus, Priority } from '@toori360/shared';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@toori360/shared';

interface Ticket {
  id: string;
  number: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  property: { id: string; name: string };
  unit?: { id: string; identifier: string } | null;
  requester: { id: string; name: string };
  provider?: { id: string; businessName: string; avgRating: number } | null;
  category?: { id: string; name: string; icon?: string | null } | null;
}

const STATUS_FILTERS: { label: string; value: string | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Nuevos', value: 'NEW' },
  { label: 'En curso', value: 'IN_PROGRESS' },
  { label: 'Esperando pres.', value: 'AWAITING_QUOTE' },
  { label: 'Completados', value: 'COMPLETED' },
  { label: 'Cerrados', value: 'CLOSED' },
];

export function TicketsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', { search, status: statusFilter }],
    queryFn: () =>
      api.get<{ data: Ticket[]; meta: { total: number } }>(
        `/tickets?${new URLSearchParams({
          ...(search && { search }),
          ...(statusFilter && { status: statusFilter }),
          limit: '50',
        })}`,
      ),
  });

  const tickets = data?.data || [];
  const total = data?.meta?.total || 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tickets</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total} tickets en total</p>
        </div>
        <Link href="/tickets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo ticket
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número o título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value ?? 'all'}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No se encontraron tickets</p>
          <Link href="/tickets/new" className="mt-3 inline-block">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Crear el primero
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border hover:border-primary/30">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{ticket.number}</span>
                      <StatusChip status={ticket.status} size="sm" />
                      <PriorityBadge priority={ticket.priority} size="sm" />
                      {ticket.category && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {ticket.category.name}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm mt-1 truncate">{ticket.title}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {ticket.property.name}
                        {ticket.unit && ` · ${ticket.unit.identifier}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.requester.name}
                      </span>
                      {ticket.provider && (
                        <span className="text-blue-600">⚙ {ticket.provider.businessName}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatRelativeTime(ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
