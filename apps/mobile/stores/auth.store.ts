import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        set({ initialized: true });
        return;
      }
      const res = await api.get<{ data: User }>('/auth/me');
      set({ user: res.data, initialized: true });
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      set({ user: null, initialized: true });
    }
  },

  login: async (email: string, password: string) => {
    const res = await api.post<{
      data: { accessToken: string; user: User };
    }>('/auth/login', { email, password });

    await SecureStore.setItemAsync('access_token', res.data.accessToken);
    set({ user: res.data.user });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    set({ user: null });
  },
}));
