'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Ticket, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Star,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell,
  PieChart, Pie,
  RadialBarChart, RadialBar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardOverview {
  kpis: {
    totalOpen: number;
    totalOpenChange: number;
    closedThisMonth: number;
    overSla: number;
    avgResolutionHours: number;
  };
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

interface MonthlyTrend {
  month: string;
  created: number;
  closed: number;
}

interface CategoryData {
  category: string;
  count: number;
}

interface SlaCompliance {
  total: number;
  overSla: number;
  closedOnTime: number;
  complianceRate: number;
}

interface Provider {
  id: string;
  businessName: string;
  avgRating: number;
  totalJobs: number;
  trades: { trade: { name: string } }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function DashboardContent() {
  const { user } = useAuthStore();

  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => api.get<{ data: DashboardOverview }>('/dashboard/overview'),
  });

  const { data: trendData } = useQuery({
    queryKey: ['dashboard', 'monthly-trend'],
    queryFn: () => api.get<{ data: MonthlyTrend[] }>('/dashboard/monthly-trend?months=6'),
  });

  const { data: categoryData } = useQuery({
    queryKey: ['dashboard', 'by-category'],
    queryFn: () => api.get<{ data: CategoryData[] }>('/dashboard/by-category'),
  });

  const { data: slaData } = useQuery({
    queryKey: ['dashboard', 'sla-compliance'],
    queryFn: () => api.get<{ data: SlaCompliance }>('/dashboard/sla-compliance'),
  });

  const { data: providersData } = useQuery({
    queryKey: ['dashboard', 'providers-ranking'],
    queryFn: () => api.get<{ data: Provider[] }>('/dashboard/providers-ranking'),
  });

  const kpis = overview?.data?.kpis;
  const trend = trendData?.data || [];
  const categories = (categoryData?.data || []).slice(0, 6);
  const sla = slaData?.data;
  const providers = (providersData?.data || []).slice(0, 5);

  const trendFormatted = trend.map((t) => ({
    ...t,
    label: format(parseISO(`${t.month}-01`), 'MMM', { locale: es }),
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground mt-1">Resumen de la operación.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Tickets abiertos"
          value={kpis?.totalOpen ?? '—'}
          icon={<Ticket className="h-5 w-5" />}
          change={kpis?.totalOpenChange}
          isLoading={isLoading}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <KpiCard
          title="Cerrados este mes"
          value={kpis?.closedThisMonth ?? '—'}
          icon={<CheckCircle2 className="h-5 w-5" />}
          isLoading={isLoading}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <KpiCard
          title="Fuera de SLA"
          value={kpis?.overSla ?? '—'}
          icon={<AlertTriangle className="h-5 w-5" />}
          isLoading={isLoading}
          colorClass="text-red-600"
          bgClass="bg-red-50"
          isAlert={!!kpis?.overSla && kpis.overSla > 0}
        />
        <KpiCard
          title="Resolución prom."
          value={kpis?.avgResolutionHours ? `${kpis.avgResolutionHours}h` : '—'}
          icon={<Clock className="h-5 w-5" />}
          isLoading={isLoading}
          colorClass="text-orange-600"
          bgClass="bg-orange-50"
        />
      </div>

      {/* Charts row 1: Trend + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend — 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendencia de tickets (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendFormatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="created" name="Creados" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="closed" name="Cerrados" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution — 1/3 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={overview?.data?.byPriority?.map((p) => ({ name: priorityLabel(p.priority), count: p.count, priority: p.priority })) || []}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                  {(overview?.data?.byPriority || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Categories + SLA + Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ category, percent }) =>
                      percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                    }
                    labelLine={false}
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="text-[11px] text-muted-foreground">{cat.category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cumplimiento SLA</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%"
                cy="100%"
                innerRadius="80%"
                outerRadius="100%"
                startAngle={180}
                endAngle={0}
                data={[{ value: sla?.complianceRate ?? 0, fill: sla && sla.complianceRate >= 80 ? '#10b981' : sla && sla.complianceRate >= 60 ? '#f59e0b' : '#ef4444' }]}
              >
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'hsl(var(--muted))' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-10 text-center">
              <p className={cn(
                'text-3xl font-bold',
                sla && sla.complianceRate >= 80 ? 'text-emerald-600' :
                sla && sla.complianceRate >= 60 ? 'text-yellow-600' : 'text-red-600',
              )}>
                {sla?.complianceRate ?? '—'}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Tasa de cumplimiento</p>
            </div>
            {sla && (
              <div className="w-full mt-4 grid grid-cols-2 gap-2 text-center">
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-red-600">{sla.overSla}</p>
                  <p className="text-[10px] text-muted-foreground">Fuera de SLA</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-emerald-600">{sla.closedOnTime}</p>
                  <p className="text-[10px] text-muted-foreground">Cerrados a tiempo</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Providers Ranking */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            {providers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {providers.map((provider, i) => (
                  <div key={provider.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{provider.businessName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {provider.trades.slice(0, 2).map((t) => t.trade.name).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600 text-xs font-semibold shrink-0">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {provider.avgRating.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title, value, icon, change, isLoading, colorClass, bgClass, isAlert,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  isLoading?: boolean;
  colorClass: string;
  bgClass: string;
  isAlert?: boolean;
}) {
  return (
    <Card className={cn(isAlert && 'border-red-200 bg-red-50/30')}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-lg', bgClass, colorClass)}>{icon}</div>
        </div>
        {isLoading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change !== undefined && change !== 0 && (
              <span className={cn('flex items-center text-xs mb-1', change > 0 ? 'text-red-500' : 'text-green-500')}>
                {change > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(change)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    CRITICAL: 'Crítica', HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja',
  };
  return labels[priority] || priority;
}
