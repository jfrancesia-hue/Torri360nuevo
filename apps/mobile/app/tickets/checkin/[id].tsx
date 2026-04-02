import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { api } from '../../../lib/api';

export default function CheckinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const checkinMutation = useMutation({
    mutationFn: () =>
      api.post(`/visits/${id}/checkin`, { lat: location!.lat, lng: location!.lng }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-tickets'] });
      Alert.alert('¡Check-in registrado!', 'La visita comenzó exitosamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  const getLocation = async () => {
    setGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para registrar el check-in.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setGeoLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Registrar Check-in</Text>
        <Text style={styles.subtitle}>Tu ubicación será registrada para validar la visita.</Text>

        {geoLoading ? (
          <View style={styles.locationBox}>
            <ActivityIndicator color="#6366f1" />
            <Text style={styles.locationText}>Obteniendo ubicación...</Text>
          </View>
        ) : location ? (
          <View style={[styles.locationBox, styles.locationOk]}>
            <Text style={styles.locationCheck}>✓</Text>
            <Text style={styles.locationText}>
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.retryButton} onPress={getLocation}>
            <Text style={styles.retryText}>Reintentar obtener ubicación</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, (!location || checkinMutation.isPending) && styles.buttonDisabled]}
          disabled={!location || checkinMutation.isPending}
          onPress={() => checkinMutation.mutate()}
        >
          {checkinMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Confirmar Check-in</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  locationBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, marginBottom: 20,
  },
  locationOk: { backgroundColor: '#f0fdf4' },
  locationCheck: { fontSize: 18, color: '#22c55e' },
  locationText: { fontSize: 13, color: '#444', flex: 1 },
  retryButton: {
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd',
    alignItems: 'center', marginBottom: 20,
  },
  retryText: { color: '#6366f1', fontWeight: '600' },
  button: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
