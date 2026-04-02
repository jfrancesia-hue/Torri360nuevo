'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  Building2,
  Users,
  Settings,
  Calendar,
  BarChart3,
  LogOut,
  ChevronLeft,
  Wrench,
  FileText,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/properties', label: 'Propiedades', icon: Building2 },
  { href: '/assets', label: 'Activos', icon: Package },
  { href: '/providers', label: 'Proveedores', icon: Wrench },
  { href: '/quotes', label: 'Presupuestos', icon: FileText },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-card border-r border-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              T
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-sm text-foreground">Toori360</p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{tenant?.name}</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            T
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-7 w-7 shrink-0', collapsed && 'mx-auto')}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={cn('p-3 border-t border-border', collapsed && 'flex justify-center')}>
        {!collapsed && user && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden leading-tight">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className="w-full text-muted-foreground hover:text-destructive"
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
