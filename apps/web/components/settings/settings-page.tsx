'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Users, Clock, Tag, Wrench, Plus, Pencil, Check, X } from 'lucide-react';

type Tab = 'users' | 'sla' | 'categories' | 'trades';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'users',      label: 'Usuarios',    icon: <Users className="h-4 w-4" /> },
  { key: 'sla',        label: 'SLA',          icon: <Clock className="h-4 w-4" /> },
  { key: 'categories', label: 'Categorías',   icon: <Tag className="h-4 w-4" /> },
  { key: 'trades',     label: 'Rubros',       icon: <Wrench className="h-4 w-4" /> },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground mt-1">Gestioná usuarios, SLA, categorías y rubros del tenant.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'users'      && <UsersTab />}
        {activeTab === 'sla'        && <SlaTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'trades'     && <TradesTab />}
      </div>
    </div>
  );
}

// ==================== USERS ====================
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN: 'Admin', OPERATOR: 'Operador',
  SUPERVISOR: 'Supervisor', REQUESTER: 'Solicitante',
  PROVIDER_USER: 'Proveedor', AUDITOR: 'Auditor',
};

const ROLE_CLASS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN:       'bg-blue-100 text-blue-700',
  OPERATOR:    'bg-sky-100 text-sky-700',
  SUPERVISOR:  'bg-indigo-100 text-indigo-700',
  REQUESTER:   'bg-gray-100 text-gray-700',
  PROVIDER_USER: 'bg-orange-100 text-orange-700',
  AUDITOR:     'bg-teal-100 text-teal-700',
};

function UsersTab() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: User[] }>('/users?limit=50'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}`, { status: status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado');
    },
    onError: (err: Error) => toast.error(err.message || 'Error'),
  });

  const users = data?.data || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Usuarios ({users.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map((i) => <div key={i} className="h-12 bg-muted rounded" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.id} className="py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className={cn('text-[11px] px-2 py-0.5 rounded-full', ROLE_CLASS[user.role] || 'bg-muted text-muted-foreground')}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                <button
                  onClick={() => toggleMutation.mutate({ id: user.id, status: user.status })}
                  disabled={toggleMutation.isPending}
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
                    user.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'bg-red-100 text-red-700 border-red-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200',
                  )}
                >
                  {user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== SLA ====================
interface SlaConfig {
  id: string;
  priority: string;
  responseTimeHours: number;
  resolutionTimeHours: number;
}

const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const PRIORITY_LABELS: Record<string, string> = { CRITICAL: 'Crítica', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' };
const PRIORITY_CLASS: Record<string, string> = {
  CRITICAL: 'text-red-600', HIGH: 'text-orange-600', MEDIUM: 'text-yellow-600', LOW: 'text-green-600',
};

function SlaTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ responseTimeHours: 0, resolutionTimeHours: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ['sla-configs'],
    queryFn: () => api.get<{ data: SlaConfig[] }>('/tenants/sla'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...dto }: SlaConfig) =>
      api.patch(`/tenants/sla/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-configs'] });
      setEditing(null);
      toast.success('SLA actualizado');
    },
    onError: (err: Error) => toast.error(err.message || 'Error'),
  });

  const configs = (data?.data || []).sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Tiempos de SLA por prioridad</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3,4].map((i) => <div key={i} className="h-12 bg-muted rounded" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {configs.map((cfg) => (
              <div key={cfg.id} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('font-semibold text-sm', PRIORITY_CLASS[cfg.priority])}>
                    {PRIORITY_LABELS[cfg.priority] || cfg.priority}
                  </span>
                  {editing !== cfg.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 text-xs"
                      onClick={() => {
                        setEditing(cfg.id);
                        setForm({ responseTimeHours: cfg.responseTimeHours, resolutionTimeHours: cfg.resolutionTimeHours });
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-green-600"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ ...cfg, ...form })}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                {editing === cfg.id ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Respuesta (h)</label>
                      <Input
                        type="number"
                        min={1}
                        value={form.responseTimeHours}
                        onChange={(e) => setForm((f) => ({ ...f, responseTimeHours: parseInt(e.target.value) || 1 }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">Resolución (h)</label>
                      <Input
                        type="number"
                        min={1}
                        value={form.resolutionTimeHours}
                        onChange={(e) => setForm((f) => ({ ...f, resolutionTimeHours: parseInt(e.target.value) || 1 }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-6 text-xs text-muted-foreground">
                    <span>Respuesta: <span className="font-medium text-foreground">{cfg.responseTimeHours}h</span></span>
                    <span>Resolución: <span className="font-medium text-foreground">{cfg.resolutionTimeHours}h</span></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== CATEGORIES ====================
interface Category {
  id: string;
  name: string;
  icon?: string | null;
  _count?: { tickets: number };
}

function CategoriesTab() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get<{ data: Category[] }>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/categories', { name: newName }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setNewName(''); toast.success('Categoría creada'); },
    onError: (err: Error) => toast.error(err.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch(`/categories/${id}`, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setEditId(null); toast.success('Categoría actualizada'); },
    onError: (err: Error) => toast.error(err.message || 'Error'),
  });

  const categories = data?.data || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Categorías ({categories.length})</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nueva categoría..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate(); }}
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((cat) => (
              <div key={cat.id} className="py-2 flex items-center gap-2">
                {editId === cat.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-7 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter' && editName.trim()) updateMutation.mutate({ id: cat.id, name: editName }); }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => editName.trim() && updateMutation.mutate({ id: cat.id, name: editName })}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditId(cat.id); setEditName(cat.name); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== TRADES ====================
interface Trade {
  id: string;
  name: string;
  _count?: { providers: number };
}

function TradesTab() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: () => api.get<{ data: Trade[] }>('/trades'),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/trades', { name: newName }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trades'] }); setNewName(''); toast.success('Rubro creado'); },
    onError: (err: Error) => toast.error(err.message || 'Error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.patch(`/trades/${id}`, { name }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trades'] }); setEditId(null); toast.success('Rubro actualizado'); },
    onError: (err: Error) => toast.error(err.message || 'Error'),
  });

  const trades = data?.data || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Rubros ({trades.length})</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nuevo rubro..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate(); }}
            className="flex-1"
          />
          <Button
            size="sm"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded" />)}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {trades.map((trade) => (
              <div key={trade.id} className="py-2 flex items-center gap-2">
                {editId === trade.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-7 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter' && editName.trim()) updateMutation.mutate({ id: trade.id, name: editName }); }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => editName.trim() && updateMutation.mutate({ id: trade.id, name: editName })}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{trade.name}</span>
                    {trade._count && (
                      <span className="text-xs text-muted-foreground">{trade._count.providers} prov.</span>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditId(trade.id); setEditName(trade.name); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
