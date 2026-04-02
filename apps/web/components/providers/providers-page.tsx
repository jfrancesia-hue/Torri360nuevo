'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Search, Star, Phone, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Provider {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email?: string | null;
  status: string;
  avgRating: number;
  totalJobs: number;
  trades: { trade: { id: string; name: string; icon?: string | null } }[];
  _count: { tickets: number };
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-gray-100 text-gray-600 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo', PENDING: 'Pendiente', SUSPENDED: 'Suspendido',
};

const EMPTY_FORM = {
  businessName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  cuit: '',
  notes: '',
};

export function ProvidersPageContent() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['providers', { search }],
    queryFn: () =>
      api.get<{ data: Provider[]; meta: { total: number } }>(
        `/providers?${new URLSearchParams({ ...(search && { search }), limit: '50' })}`,
      ),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) =>
      api.post('/providers', { ...body, email: body.email || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      toast.success('Proveedor creado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const providers = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.meta?.total ?? 0} proveedores registrados</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo proveedor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proveedores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin proveedores</p>
          <p className="text-sm mt-1">Agregá proveedores para asignarlos a los tickets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <Link key={provider.id} href={`/providers/${provider.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{provider.businessName}</p>
                      <p className="text-xs text-muted-foreground">{provider.contactName}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs shrink-0 ml-2', STATUS_STYLES[provider.status])}
                    >
                      {STATUS_LABELS[provider.status]}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <Phone className="h-3 w-3" />
                    {provider.phone}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {provider.trades.map(({ trade }) => (
                      <span
                        key={trade.id}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                      >
                        {trade.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 text-yellow-600 font-medium">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {provider.avgRating.toFixed(1)}
                    </span>
                    <span>{provider.totalJobs} trabajos</span>
                    <span className={cn(provider._count.tickets > 0 && 'text-orange-600 font-medium')}>
                      {provider._count.tickets} activos
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Razón social *</label>
              <Input
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                placeholder="Plomeros Unidos SRL"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contacto *</label>
              <Input
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                placeholder="Roberto Silva"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Teléfono *</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+54 383 4123456"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="contacto@proveedor.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">CUIT</label>
              <Input
                value={form.cuit}
                onChange={(e) => setForm((f) => ({ ...f, cuit: e.target.value }))}
                placeholder="30-12345678-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Dirección</label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Calle 123, Ciudad"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : 'Crear proveedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
