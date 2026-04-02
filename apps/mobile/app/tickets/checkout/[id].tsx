import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../lib/api';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');

  const checkoutMutation = useMutation({
    mutationFn: () => api.post(`/visits/${id}/checkout`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-tickets'] });
      Alert.alert('¡Check-out registrado!', 'La visita se completó exitosamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Registrar Check-out</Text>
          <Text style={styles.subtitle}>
            Describí el trabajo realizado antes de cerrar la visita.
          </Text>

          <TextInput
            style={styles.textarea}
            placeholder="Describí el trabajo realizado, materiales usados, observaciones relevantes..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.button, (!notes.trim() || checkoutMutation.isPending) && styles.buttonDisabled]}
            disabled={!notes.trim() || checkoutMutation.isPending}
            onPress={() => checkoutMutation.mutate()}
          >
            {checkoutMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Confirmar Check-out</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  textarea: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 14, fontSize: 14, minHeight: 140,
    backgroundColor: '#fafafa', marginBottom: 20, color: '#333',
  },
  button: { backgroundColor: '#f97316', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
