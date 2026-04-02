'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Building2, Home, Layers, MapPin, Ticket, Layers2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Unit {
  id: string;
  identifier: string;
  floor?: string | null;
  type?: string | null;
  isOccupied: boolean;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  brand?: string | null;
  model?: string | null;
  status: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  units: Unit[];
  assets: Asset[];
  _count: { tickets: number };
}

const TYPE_LABELS: Record<string, string> = {
  BUILDING: 'Edificio', HOUSE: 'Casa', COMPLEX: 'Complejo',
  OFFICE: 'Oficina', COMMERCIAL: 'Comercial',
};

const UNIT_TYPES = ['APARTMENT', 'LOCAL', 'COMMON_AREA', 'PARKING', 'STORAGE', 'OFFICE'];
const UNIT_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Departamento', LOCAL: 'Local', COMMON_AREA: 'Área común',
  PARKING: 'Cochera', STORAGE: 'Depósito', OFFICE: 'Oficina',
};

const ASSET_STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-600',
  UNDER_MAINTENANCE: 'bg-orange-100 text-orange-700',
  DECOMMISSIONED: 'bg-red-100 text-red-700',
};

const ASSET_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo',
  UNDER_MAINTENANCE: 'En mantenimiento', DECOMMISSIONED: 'Dado de baja',
};

const EMPTY_UNIT = { identifier: '', floor: '', type: 'APARTMENT' };
const EMPTY_ASSET = { name: '', type: '', brand: '', model: '', notes: '' };

export function PropertyDetail({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [unitForm, setUnitForm] = useState(EMPTY_UNIT);
  const [assetForm, setAssetForm] = useState(EMPTY_ASSET);

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => api.get<{ data: Property }>(`/properties/${id}`),
  });

  const addUnitMutation = useMutation({
    mutationFn: (body: typeof EMPTY_UNIT) =>
      api.post(`/properties/${id}/units`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      setShowAddUnit(false);
      setUnitForm(EMPTY_UNIT);
      toast.success('Unidad agregada');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addAssetMutation = useMutation({
    mutationFn: (body: typeof EMPTY_ASSET) =>
      api.post('/assets', { ...body, propertyId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      setShowAddAsset(false);
      setAssetForm(EMPTY_ASSET);
      toast.success('Activo agregado');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-64 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Propiedad no encontrada</p>
        <Button variant="outline" onClick={() => router.push('/properties')}>Volver</Button>
      </div>
    );
  }

  const property = data.data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/properties">
          <Button variant="ghost" size="icon" className="h-8 w-8 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{TYPE_LABELS[property.type] || property.type}</span>
          </div>
          <h1 className="text-xl font-bold">{property.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3.5 w-3.5" />
            {property.address}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{property.units.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Unidades</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{property.assets.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{property._count.tickets}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tickets</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Units */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers2 className="h-4 w-4 text-muted-foreground" />
                Unidades ({property.units.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => setShowAddUnit(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {property.units.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin unidades registradas</p>
            ) : (
              <div className="divide-y divide-border">
                {property.units.map((unit) => (
                  <div key={unit.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{unit.identifier}</span>
                      {unit.floor && (
                        <span className="text-xs text-muted-foreground ml-2">Piso {unit.floor}</span>
                      )}
                      {unit.type && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {UNIT_TYPE_LABELS[unit.type] || unit.type}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      'text-[11px] px-2 py-0.5 rounded-full',
                      unit.isOccupied ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600',
                    )}>
                      {unit.isOccupied ? 'Ocupada' : 'Libre'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assets */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                Activos ({property.assets.length})
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => setShowAddAsset(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {property.assets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin activos registrados</p>
            ) : (
              <div className="divide-y divide-border">
                {property.assets.map((asset) => (
                  <div key={asset.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type}{asset.brand && ` · ${asset.brand}`}{asset.model && ` ${asset.model}`}
                      </p>
                    </div>
                    <span className={cn(
                      'text-[11px] px-2 py-0.5 rounded-full',
                      ASSET_STATUS_CLASS[asset.status] || 'bg-muted text-muted-foreground',
                    )}>
                      {ASSET_STATUS_LABELS[asset.status] || asset.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick link to tickets */}
      <Link href={`/tickets?propertyId=${property.id}`}>
        <Button variant="outline" className="gap-2">
          <Ticket className="h-4 w-4" />
          Ver tickets de esta propiedad ({property._count.tickets})
        </Button>
      </Link>

      {/* Add Unit Dialog */}
      <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar unidad</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); addUnitMutation.mutate(unitForm); }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Identificador *
              </label>
              <Input
                value={unitForm.identifier}
                onChange={(e) => setUnitForm((f) => ({ ...f, identifier: e.target.value }))}
                placeholder="1A, 2B, Local 1..."
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
              <Select
                value={unitForm.type}
                onValueChange={(v) => setUnitForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{UNIT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Piso</label>
              <Input
                value={unitForm.floor}
                onChange={(e) => setUnitForm((f) => ({ ...f, floor: e.target.value }))}
                placeholder="1, PB, SS1..."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddUnit(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addUnitMutation.isPending}>
                {addUnitMutation.isPending ? 'Guardando...' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Asset Dialog */}
      <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar activo</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); addAssetMutation.mutate(assetForm); }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre *</label>
              <Input
                value={assetForm.name}
                onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Bomba de agua, Ascensor..."
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo *</label>
              <Input
                value={assetForm.type}
                onChange={(e) => setAssetForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="Hidráulico, Eléctrico..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Marca</label>
                <Input
                  value={assetForm.brand}
                  onChange={(e) => setAssetForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="Grundfos"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Modelo</label>
                <Input
                  value={assetForm.model}
                  onChange={(e) => setAssetForm((f) => ({ ...f, model: e.target.value }))}
                  placeholder="CM3-5"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Notas</label>
              <Input
                value={assetForm.notes}
                onChange={(e) => setAssetForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Observaciones"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddAsset(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addAssetMutation.isPending}>
                {addAssetMutation.isPending ? 'Guardando...' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
