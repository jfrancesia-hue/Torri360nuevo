'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { register as registerUser } from '@/lib/auth';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  tenantName: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
  phone: z.string().max(50).optional(),
});

type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { setUser, setTenant } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const authData = await registerUser(data);
      setUser(authData.user);
      setTenant(authData.tenant);
      toast.success('¡Cuenta creada! Bienvenido a Toori360');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="tenantName">
              Nombre de la empresa *
            </label>
            <Input id="tenantName" placeholder="Ej: Inmobiliaria Norte SRL" {...register('tenantName')} />
            {errors.tenantName && <p className="text-xs text-destructive">{errors.tenantName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Tu nombre completo *
            </label>
            <Input id="name" placeholder="Juan García" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email *
            </label>
            <Input id="email" type="email" placeholder="admin@empresa.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone">
              Teléfono
            </label>
            <Input id="phone" placeholder="+54 383 4123456" {...register('phone')} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña *
            </label>
            <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear cuenta gratis
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Al registrarte aceptás los términos y condiciones de uso.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
