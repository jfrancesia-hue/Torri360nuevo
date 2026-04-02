'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, MapPin, Plus, Search, Home, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  _count: { units: number; tickets: number };
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  BUILDING: { label: 'Edificio', icon: <Building2 className="h-4 w-4" /> },
  HOUSE: { label: 'Casa', icon: <Home className="h-4 w-4" /> },
  COMPLEX: { label: 'Complejo', icon: <Layers className="h-4 w-4" /> },
  OFFICE: { label: 'Oficina', icon: <Building2 className="h-4 w-4" /> },
  COMMERCIAL: { label: 'Comercial', icon: <Building2 className="h-4 w-4" /> },
};

const EMPTY_FORM = { name: '', address: '', type: 'BUILDING' as string, notes: '' };

export function PropertiesPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['properties', { search }],
    queryFn: () =>
      api.get<{ data: Property[]; meta: { total: number } }>(
        `/properties?${new URLSearchParams({ ...(search && { search }), limit: '50' })}`,
      ),
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof EMPTY_FORM) => api.post('/properties', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      toast.success('Propiedad creada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const properties = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Propiedades</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.meta?.total ?? 0} propiedades</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva propiedad
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar propiedades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin propiedades</p>
          <p className="text-sm mt-1">Creá la primera propiedad para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => {
            const typeConfig = TYPE_LABELS[property.type] || TYPE_LABELS.BUILDING;
            return (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        {typeConfig.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{property.name}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{property.address}</span>
                        </div>
                        <span className="mt-1 inline-block text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {typeConfig.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {property._count.units} unidades
                      </span>
                      <span className={cn(
                        'flex items-center gap-1',
                        property._count.tickets > 0 && 'text-orange-600 font-medium',
                      )}>
                        {property._count.tickets} tickets activos
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva propiedad</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Edificio San Martín 450"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Dirección *</label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="San Martín 450, Catamarca"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo *</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, { label }]) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notas</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Observaciones opcionales"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : 'Crear propiedad'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
