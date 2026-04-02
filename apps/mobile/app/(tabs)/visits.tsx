import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

interface Visit {
  id: string;
  scheduledAt: string;
  status: string;
  windowStart?: string | null;
  windowEnd?: string | null;
  notes?: string | null;
  ticket: {
    id: string;
    number: string;
    title: string;
    property: { name: string; address: string };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED:   { label: 'Programada',   color: '#3b82f6', bg: '#eff6ff' },
  CONFIRMED:   { label: 'Confirmada',   color: '#0ea5e9', bg: '#f0f9ff' },
  IN_PROGRESS: { label: 'En curso',     color: '#f97316', bg: '#fff7ed' },
  COMPLETED:   { label: 'Completada',   color: '#22c55e', bg: '#f0fdf4' },
  CANCELLED:   { label: 'Cancelada',    color: '#ef4444', bg: '#fef2f2' },
  RESCHEDULED: { label: 'Reprogramada', color: '#8b5cf6', bg: '#f5f3ff' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export default function VisitsScreen() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-visits'],
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
      const to = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
      return api.get<{ data: Visit[] }>(`/visits/calendar?from=${from}&to=${to}`);
    },
  });

  const visits = (data?.data || []).sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  const pending = visits.filter((v) => ['SCHEDULED', 'CONFIRMED'].includes(v.status));
  const active = visits.filter((v) => v.status === 'IN_PROGRESS');
  const past = visits.filter((v) => ['COMPLETED', 'CANCELLED', 'RESCHEDULED'].includes(v.status));

  const sections = [
    ...(active.length > 0 ? [{ title: 'EN CURSO', data: active }] : []),
    ...(pending.length > 0 ? [{ title: 'PRÓXIMAS', data: pending }] : []),
    ...(past.length > 0 ? [{ title: 'ANTERIORES', data: past }] : []),
  ];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Cargando visitas...</Text>
      </View>
    );
  }

  if (visits.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Sin visitas</Text>
        <Text style={styles.emptyText}>No tenés visitas programadas próximamente.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      data={sections.flatMap((s) => [{ type: 'header' as const, title: s.title, id: s.title }, ...s.data.map((v) => ({ ...v, type: 'visit' as const }))])}
      keyExtractor={(item) => ('id' in item ? item.id : item.title)}
      renderItem={({ item }) => {
        if (item.type === 'header') {
          return <Text style={styles.sectionHeader}>{item.title}</Text>;
        }
        const visit = item as Visit & { type: 'visit' };
        const cfg = STATUS_CONFIG[visit.status] || STATUS_CONFIG.SCHEDULED;
        const isActive = visit.status === 'IN_PROGRESS';
        const isActionable = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(visit.status);

        return (
          <TouchableOpacity
            style={[styles.card, isActive && styles.cardActive]}
            onPress={() => isActionable && router.push(`/tickets/${visit.ticket.id}`)}
            activeOpacity={isActionable ? 0.7 : 1}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(visit.scheduledAt)}</Text>
            </View>

            <Text style={styles.ticketTitle} numberOfLines={2}>{visit.ticket.title}</Text>
            <Text style={styles.ticketNumber}>{visit.ticket.number}</Text>

            <View style={styles.propertyRow}>
              <Text style={styles.propertyText}>{visit.ticket.property.name}</Text>
              <Text style={styles.addressText} numberOfLines={1}>{visit.ticket.property.address}</Text>
            </View>

            {visit.windowStart && visit.windowEnd && (
              <Text style={styles.windowText}>
                Ventana: {visit.windowStart} – {visit.windowEnd}
              </Text>
            )}

            {isActionable && (
              <View style={[styles.actionHint, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.actionHintText, { color: cfg.color }]}>
                  {visit.status === 'IN_PROGRESS'
                    ? '→ Registrar check-out'
                    : '→ Ver ticket y registrar check-in'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center' },
  sectionHeader: {
    fontSize: 11, fontWeight: '700', color: '#999',
    letterSpacing: 1, paddingTop: 8, paddingBottom: 4,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardActive: {
    borderLeftWidth: 3, borderLeftColor: '#f97316',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 12, color: '#666' },
  ticketTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  ticketNumber: { fontSize: 12, color: '#aaa', fontFamily: 'monospace' },
  propertyRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  propertyText: { fontSize: 13, fontWeight: '500', color: '#444' },
  addressText: { fontSize: 12, color: '#999', flex: 1 },
  windowText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  actionHint: {
    marginTop: 4, borderRadius: 8, padding: 8, alignItems: 'center',
  },
  actionHintText: { fontSize: 12, fontWeight: '600' },
});
