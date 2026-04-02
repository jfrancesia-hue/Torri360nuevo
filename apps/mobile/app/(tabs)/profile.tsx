import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 24, alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#ede9fe',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#6366f1' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 12 },
  roleBadge: {
    backgroundColor: '#ede9fe', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  logoutButton: {
    marginTop: 24,
    borderWidth: 1, borderColor: '#fecaca',
    borderRadius: 10,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
