'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface Category {
  id: string;
  name: string;
}

export function PortalNewTicket() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyId: '',
    categoryId: '',
    priority: 'MEDIUM' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['portal-properties'],
    queryFn: () => api.get<{ data: Property[] }>('/properties?limit=50'),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['portal-categories'],
    queryFn: () => api.get<{ data: Category[] }>('/categories'),
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<{ data: { id: string; number: string } }>('/tickets', {
        ...form,
        categoryId: form.categoryId || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['portal-tickets'] });
      toast.success(`Ticket ${res.data.number} creado`);
      router.push(`/portal/tickets/${res.data.id}`);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear'),
  });

  const properties = propertiesData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/portal/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nueva solicitud</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Describí tu problema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Título *</label>
            <Input
              placeholder="Ej: Pérdida de agua en cocina"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descripción *</label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Describí el problema con detalle: ubicación exacta, cuándo empezó, qué intentaste hacer..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Propiedad *</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.propertyId}
              onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
            >
              <option value="">Seleccionar propiedad...</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoría</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Sin especificar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Urgencia</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' }))}
              >
                <option value="LOW">Baja — sin urgencia</option>
                <option value="MEDIUM">Media — normal</option>
                <option value="HIGH">Alta — importante</option>
                <option value="CRITICAL">Crítica — emergencia</option>
              </select>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            disabled={!form.title.trim() || !form.description.trim() || !form.propertyId || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            <Send className="h-4 w-4" />
            Enviar solicitud
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
