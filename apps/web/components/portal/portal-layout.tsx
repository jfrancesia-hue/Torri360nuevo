'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { clearAuthData } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Home, Plus, LogOut, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized, setUser, setTenant } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initialized && !user) {
      router.push('/portal/login');
    }
  }, [initialized, user, router]);

  if (!initialized || !user) return null;

  const navItems = [
    { href: '/portal/dashboard', label: 'Mis solicitudes', icon: <Home className="h-4 w-4" /> },
    { href: '/portal/tickets/new', label: 'Nueva solicitud', icon: <Plus className="h-4 w-4" /> },
  ];

  const handleLogout = () => {
    clearAuthData();
    setUser(null);
    setTenant(null);
    router.push('/portal/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm">Portal</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Toori360</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}>
                {item.icon}
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
