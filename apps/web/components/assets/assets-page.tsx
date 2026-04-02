'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Package, Plus, Search, Filter, ChevronRight, Building2,
  CheckCircle2, AlertTriangle, Wrench, XCircle, X,
} from 'lucide-react';
import Link from 'next/link';

interface Asset {
  id: string;
  name: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';
  installDate?: string | null;
  warrantyEnd?: string | null;
  notes?: string | null;
  property?: { id: string; name: string } | null;
  unit?: { id: string; identifier: string } | null;
}

const STATUS_CONFIG = {
  ACTIVE:            { label: 'Activo',         class: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  INACTIVE:          { label: 'Inactivo',        class: 'bg-gray-100 text-gray-600',    icon: XCircle },
  UNDER_MAINTENANCE: { label: 'En mantenimiento',class: 'bg-orange-100 text-orange-700',icon: Wrench },
  DECOMMISSIONED:    { label: 'Dado de baja',    class: 'bg-red-100 text-red-700',      icon: AlertTriangle },
} as const;

export function AssetsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['assets', statusFilter],
    queryFn: () =>
      api.get<{ data: Asset[]; meta: { total: number } }>(
        `/assets?limit=100${statusFilter ? `&status=${statusFilter}` : ''}`,
      ),
  });

  const { data: propertiesData } = useQuery({
    queryKey: ['properties-simple'],
    queryFn: () => api.get<{ data: { id: string; name: string }[] }>('/properties?limit=100'),
  });

  const assets = (data?.data || []).filter((a) =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    a.brand?.toLowerCase().includes(search.toLowerCase()) ||
    a.property?.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Activos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {data?.meta.total ?? 0} activos registrados
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Nuevo activo
          </Button>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[]).map((s) => {
            const count = (data?.data || []).filter((a) => a.status === s).length;
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-all',
                  statusFilter === s ? 'ring-2 ring-primary' : 'hover:border-primary/40',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, tipo, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {statusFilter && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setStatusFilter('')}>
              <Filter className="h-3.5 w-3.5" />
              {STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label}
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 px-4 flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 bg-muted rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-40 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-muted-foreground gap-3">
                <Package className="h-10 w-10" />
                <p className="text-sm">
                  {search || statusFilter ? 'No hay activos con esos filtros' : 'No hay activos registrados'}
                </p>
                {!search && !statusFilter && (
                  <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
                    Agregar primer activo
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {assets.map((asset) => {
                  const cfg = STATUS_CONFIG[asset.status];
                  const Icon = cfg.icon;
                  return (
                    <div key={asset.id} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/40 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{asset.name}</p>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full flex items-center gap-1', cfg.class)}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {asset.type}
                          {asset.brand && ` · ${asset.brand}`}
                          {asset.model && ` ${asset.model}`}
                        </p>
                      </div>
                      {asset.property && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                          <Building2 className="h-3.5 w-3.5" />
                          <Link
                            href={`/properties/${asset.property.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {asset.property.name}
                          </Link>
                          {asset.unit && <span>· Unidad {asset.unit.identifier}</span>}
                        </div>
                      )}
                      {asset.warrantyEnd && (
                        <div className={cn(
                          'hidden md:block text-xs shrink-0',
                          new Date(asset.warrantyEnd) < new Date()
                            ? 'text-red-500'
                            : 'text-muted-foreground',
                        )}>
                          {new Date(asset.warrantyEnd) < new Date() ? '⚠ Garantía vencida' : `Garantía: ${new Date(asset.warrantyEnd).toLocaleDateString('es-AR')}`}
                        </div>
                      )}
                      <AssetMenu
                        asset={asset}
                        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
                        onDeleted={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <CreateAssetModal
          properties={propertiesData?.data || []}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function AssetMenu({
  asset,
  onUpdated,
  onDeleted,
}: {
  asset: Asset;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [showEdit, setShowEdit] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/assets/${asset.id}`),
    onSuccess: () => { toast.success('Activo eliminado'); onDeleted(); },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowEdit(true)}
        >
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (confirm(`¿Eliminar activo "${asset.name}"?`)) deleteMutation.mutate();
          }}
        >
          Eliminar
        </Button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {showEdit && (
        <EditAssetModal
          asset={asset}
          onClose={() => setShowEdit(false)}
          onUpdated={() => { setShowEdit(false); onUpdated(); }}
        />
      )}
    </>
  );
}

function CreateAssetModal({
  properties,
  onClose,
  onCreated,
}: {
  properties: { id: string; name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    propertyId: '',
    name: '',
    type: '',
    brand: '',
    model: '',
    status: 'ACTIVE',
    installDate: '',
    warrantyEnd: '',
    notes: '',
  });

  const { data: unitsData } = useQuery({
    queryKey: ['units-for-asset', form.propertyId],
    queryFn: () =>
      api.get<{ data: { id: string; identifier: string }[] }>(`/properties/${form.propertyId}/units`),
    enabled: !!form.propertyId,
  });

  const [unitId, setUnitId] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/assets', {
        ...form,
        unitId: unitId || undefined,
        brand: form.brand || undefined,
        model: form.model || undefined,
        installDate: form.installDate || undefined,
        warrantyEnd: form.warrantyEnd || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => { toast.success('Activo creado'); onCreated(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const isValid = form.propertyId && form.name.trim() && form.type.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold">Nuevo activo</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Propiedad *</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.propertyId}
              onChange={(e) => { setForm({ ...form, propertyId: e.target.value }); setUnitId(''); }}
            >
              <option value="">Seleccioná propiedad</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {unitsData?.data && unitsData.data.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Unidad (opcional)</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
              >
                <option value="">Sin unidad específica</option>
                {unitsData.data.map((u) => <option key={u.id} value={u.id}>{u.identifier}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre *</label>
              <Input
                placeholder="Ej: Bomba de agua"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo *</label>
              <Input
                placeholder="Ej: Hidráulico"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Marca</label>
              <Input
                placeholder="Ej: Grundfos"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Modelo</label>
              <Input
                placeholder="Ej: CM5-A"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Estado</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
              <option value="UNDER_MAINTENANCE">En mantenimiento</option>
              <option value="DECOMMISSIONED">Dado de baja</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Fecha instalación</label>
              <Input
                type="date"
                value={form.installDate}
                onChange={(e) => setForm({ ...form, installDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Venc. garantía</label>
              <Input
                type="date"
                value={form.warrantyEnd}
                onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Notas</label>
            <textarea
              className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Observaciones, historial, etc."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            disabled={!isValid || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Crear activo
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditAssetModal({
  asset,
  onClose,
  onUpdated,
}: {
  asset: Asset;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    name: asset.name,
    type: asset.type,
    brand: asset.brand || '',
    model: asset.model || '',
    status: asset.status,
    installDate: asset.installDate ? asset.installDate.split('T')[0] : '',
    warrantyEnd: asset.warrantyEnd ? asset.warrantyEnd.split('T')[0] : '',
    notes: asset.notes || '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/assets/${asset.id}`, {
        ...form,
        brand: form.brand || undefined,
        model: form.model || undefined,
        installDate: form.installDate || undefined,
        warrantyEnd: form.warrantyEnd || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => { toast.success('Activo actualizado'); onUpdated(); },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold">Editar activo</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo *</label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Marca</label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Modelo</label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Estado</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Asset['status'] })}
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
              <option value="UNDER_MAINTENANCE">En mantenimiento</option>
              <option value="DECOMMISSIONED">Dado de baja</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Fecha instalación</label>
              <Input type="date" value={form.installDate} onChange={(e) => setForm({ ...form, installDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Venc. garantía</label>
              <Input type="date" value={form.warrantyEnd} onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Notas</label>
            <textarea
              className="w-full min-h-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            disabled={!form.name.trim() || !form.type.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
