'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, MapPin, CheckCircle2, ArrowRight, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

const PROPERTY_TYPES = [
  { value: 'BUILDING', label: 'Edificio / Consorcio' },
  { value: 'HOUSE', label: 'Casa' },
  { value: 'COMPLEX', label: 'Complejo / Barrio privado' },
  { value: 'OFFICE', label: 'Oficina' },
  { value: 'COMMERCIAL', label: 'Local comercial' },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { tenant } = useAuthStore();
  const [step, setStep] = useState<Step>(1);
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    address: '',
    type: 'BUILDING',
  });

  const createPropertyMutation = useMutation({
    mutationFn: () => api.post('/properties', propertyForm),
    onSuccess: () => setStep(3),
    onError: (err: Error) => toast.error(err.message || 'Error al crear propiedad'),
  });

  const steps = [
    { num: 1, label: 'Bienvenida' },
    { num: 2, label: 'Tu propiedad' },
    { num: 3, label: 'Listo' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                step > s.num ? 'bg-green-500 text-white' :
                step === s.num ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground',
              )}>
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('w-12 h-0.5', step > s.num ? 'bg-green-500' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-8">
            {step === 1 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <Ticket className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">¡Bienvenido a Toori360!</h1>
                  <p className="text-muted-foreground mt-2">
                    Tu cuenta <strong>{tenant?.name}</strong> fue creada exitosamente.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    En 2 pasos rápidos vas a poder empezar a gestionar tus solicitudes de mantenimiento.
                  </p>
                </div>
                <Button className="w-full gap-2" onClick={() => setStep(2)}>
                  Empezar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold">Registrá tu propiedad</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    ¿Cuál es la propiedad que querés gestionar?
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Nombre de la propiedad *
                  </label>
                  <Input
                    placeholder="Ej: Edificio Rivadavia 1234"
                    value={propertyForm.name}
                    onChange={(e) => setPropertyForm((f) => ({ ...f, name: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Dirección *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Av. Rivadavia 1234, CABA"
                      value={propertyForm.address}
                      onChange={(e) => setPropertyForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Tipo de propiedad *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPERTY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setPropertyForm((f) => ({ ...f, type: type.value }))}
                        className={cn(
                          'p-3 rounded-lg border text-left text-sm transition-colors',
                          propertyForm.type === type.value
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    Atrás
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    disabled={!propertyForm.name.trim() || !propertyForm.address.trim() || createPropertyMutation.isPending}
                    onClick={() => createPropertyMutation.mutate()}
                  >
                    {createPropertyMutation.isPending ? 'Guardando...' : 'Continuar'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">¡Todo listo!</h2>
                  <p className="text-muted-foreground mt-2">
                    Tu propiedad fue registrada. Ahora podés crear tu primera solicitud de mantenimiento.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button className="w-full gap-2" onClick={() => router.push('/portal/tickets/new')}>
                    <Ticket className="h-4 w-4" />
                    Crear primera solicitud
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/portal/dashboard')}>
                    Ir al inicio
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
