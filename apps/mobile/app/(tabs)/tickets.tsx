import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';

interface Ticket {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  property: { name: string };
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#6366f1',
  IN_REVIEW: '#8b5cf6',
  ASSIGNED: '#06b6d4',
  SCHEDULING_VISIT: '#f59e0b',
  IN_PROGRESS: '#f97316',
  PAUSED: '#64748b',
  COMPLETED: '#22c55e',
  VALIDATED: '#10b981',
  CLOSED: '#6b7280',
  CANCELLED: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  IN_REVIEW: 'En revisión',
  ASSIGNED: 'Asignado',
  SCHEDULING_VISIT: 'Coord. visita',
  IN_PROGRESS: 'En curso',
  PAUSED: 'Pausado',
  COMPLETED: 'Completado',
  VALIDATED: 'Validado',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

export default function TicketsScreen() {
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-tickets'],
    queryFn: () => api.get<{ data: Ticket[] }>('/tickets?limit=30'),
  });

  const tickets = data?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Cargando...' : 'Sin tickets asignados'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/tickets/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.ticketNumber}>{item.number}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
                  {STATUS_LABELS[item.status] || item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.property}>{item.property.name}</Text>
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketNumber: { fontSize: 12, color: '#999', fontFamily: 'monospace' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  property: { fontSize: 12, color: '#666' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#999', fontSize: 15 },
});
