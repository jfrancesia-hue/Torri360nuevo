'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Priority } from '@toori360/shared';

const schema = z.object({
  title: z.string().min(5, 'Mínimo 5 caracteres').max(200),
  description: z.string().min(10, 'Describí el problema con más detalle').max(5000),
  priority: z.nativeEnum(Priority),
  propertyId: z.string().uuid('Seleccioná una propiedad'),
  unitId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewTicketForm() {
  const router = useRouter();

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.get<{ data: { id: string; name: string }[] }>('/properties?limit=100'),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: { id: string; name: string }[] }>('/categories'),
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: Priority.MEDIUM },
  });

  const selectedPropertyId = watch('propertyId');

  const { data: units } = useQuery({
    queryKey: ['units', selectedPropertyId],
    queryFn: () =>
      api.get<{ data: { id: string; identifier: string }[] }>(
        `/properties/${selectedPropertyId}/units`,
      ),
    enabled: !!selectedPropertyId,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/tickets', data),
    onSuccess: (res: { data?: { id: string } }) => {
      toast.success('Ticket creado exitosamente');
      router.push(res.data?.id ? `/tickets/${res.data.id}` : '/tickets');
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear el ticket'),
  });

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
          {/* Título */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Título *</label>
            <Input placeholder="Ej: Pérdida de agua en baño del Depto 3A" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción *</label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Describí el problema con el mayor detalle posible..."
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {/* Propiedad + Unidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Propiedad *</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('propertyId')}
              >
                <option value="">Seleccioná una propiedad</option>
                {properties?.data?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.propertyId && <p className="text-xs text-destructive">{errors.propertyId.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unidad</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                disabled={!selectedPropertyId}
                {...register('unitId')}
              >
                <option value="">Área común / no aplica</option>
                {units?.data?.map((u) => (
                  <option key={u.id} value={u.id}>{u.identifier}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Categoría + Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoría</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('categoryId')}
              >
                <option value="">Sin categoría</option>
                {categories?.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad *</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('priority')}
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear ticket
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
