'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { register } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Ticket } from 'lucide-react';

export function PortalRegister() {
  const router = useRouter();
  const { setUser, setTenant } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, tenant } = await register({
        email: form.email,
        password: form.password,
        name: form.name,
        tenantName: form.tenantName,
      });
      setUser(user);
      setTenant(tenant);
      router.push('/portal/onboarding');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Crear cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">Portal de solicitudes — Toori360</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nombre completo</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Juan Pérez"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contraseña</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Nombre de tu organización
              </label>
              <Input
                value={form.tenantName}
                onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))}
                placeholder="Consorcio Rivadavia 1234"
                required
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link href="/portal/login" className="text-primary hover:underline">
              Ingresar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
