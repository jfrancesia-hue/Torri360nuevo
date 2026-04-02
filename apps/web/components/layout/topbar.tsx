'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePathname } from 'next/navigation';

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Inicio',
  tickets: 'Tickets',
  new: 'Nuevo ticket',
  properties: 'Propiedades',
  providers: 'Proveedores',
  quotes: 'Presupuestos',
  calendar: 'Calendario',
  reports: 'Reportes',
  settings: 'Configuración',
};

export function TopBar() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((s) => BREADCRUMB_LABELS[s] || s);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 gap-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((label, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              }
            >
              {label}
            </span>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets, propiedades..."
            className="pl-9 w-64 h-9 text-sm"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>
      </div>
    </header>
  );
}
