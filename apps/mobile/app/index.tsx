import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth.store';

export default function Index() {
  const { user, initialized } = useAuthStore();

  if (!initialized) return null;
  if (user) return <Redirect href="/(tabs)/tickets" />;
  return <Redirect href="/(auth)/login" />;
}
