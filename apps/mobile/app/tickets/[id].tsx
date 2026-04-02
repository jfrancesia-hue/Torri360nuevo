import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../lib/api';

interface TicketDetail {
  id: string;
  number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  property: { name: string; address: string };
  visits: {
    id: string;
    scheduledAt: string;
    status: string;
  }[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo', IN_REVIEW: 'En revisión', ASSIGNED: 'Asignado',
  SCHEDULING_VISIT: 'Coord. visita', IN_PROGRESS: 'En curso',
  PAUSED: 'Pausado', COMPLETED: 'Completado', VALIDATED: 'Validado',
  CLOSED: 'Cerrado', CANCELLED: 'Cancelado',
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['mobile-ticket', id],
    queryFn: () => api.get<{ data: TicketDetail }>(`/tickets/${id}`),
  });

  const ticket = data?.data;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Ticket no encontrado</Text>
      </View>
    );
  }

  const activeVisit = ticket.visits.find((v) =>
    ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(v.status),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.number}>{ticket.number}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{STATUS_LABELS[ticket.status] || ticket.status}</Text>
        </View>
      </View>

      <Text style={styles.title}>{ticket.title}</Text>

      {/* Property */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Propiedad</Text>
        <Text style={styles.sectionValue}>{ticket.property.name}</Text>
        <Text style={styles.sectionSubValue}>{ticket.property.address}</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Descripción</Text>
        <Text style={styles.description}>{ticket.description}</Text>
      </View>

      {/* Actions */}
      {activeVisit && (
        <View style={styles.actionsSection}>
          {activeVisit.status !== 'IN_PROGRESS' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.checkinButton]}
              onPress={() => router.push(`/tickets/checkin/${activeVisit.id}`)}
            >
              <Text style={styles.actionButtonText}>Registrar Check-in</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.checkoutButton]}
              onPress={() => router.push(`/tickets/checkout/${activeVisit.id}`)}
            >
              <Text style={styles.actionButtonText}>Registrar Check-out</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666', fontSize: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { fontSize: 13, color: '#999', fontFamily: 'monospace' },
  statusBadge: { backgroundColor: '#ede9fe', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  section: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionLabel: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  sectionValue: { fontSize: 15, fontWeight: '600', color: '#111' },
  sectionSubValue: { fontSize: 13, color: '#666', marginTop: 2 },
  description: { fontSize: 14, color: '#333', lineHeight: 22 },
  actionsSection: { gap: 10 },
  actionButton: { borderRadius: 12, padding: 16, alignItems: 'center' },
  checkinButton: { backgroundColor: '#6366f1' },
  checkoutButton: { backgroundColor: '#f97316' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
