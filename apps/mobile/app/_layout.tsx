import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth.store';

const queryClient = new QueryClient();

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tickets/[id]" options={{ headerShown: true, title: 'Detalle' }} />
        <Stack.Screen name="tickets/checkin/[id]" options={{ headerShown: true, title: 'Check-in' }} />
        <Stack.Screen name="tickets/checkout/[id]" options={{ headerShown: true, title: 'Check-out' }} />
      </Stack>
    </QueryClientProvider>
  );
}
