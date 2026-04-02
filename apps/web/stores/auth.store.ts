'use client';

import { create } from 'zustand';
import { AuthUser, AuthTenant, getStoredUser, getStoredTenant, clearAuthData } from '@/lib/auth';

interface AuthState {
  user: AuthUser | null;
  tenant: AuthTenant | null;
  isLoading: boolean;
  initialized: boolean;
  initialize: () => void;
  setUser: (user: AuthUser | null) => void;
  setTenant: (tenant: AuthTenant | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  isLoading: true,
  initialized: false,

  initialize: () => {
    const user = getStoredUser();
    const tenant = getStoredTenant();
    set({ user, tenant, isLoading: false, initialized: true });
  },

  setUser: (user) => set({ user }),
  setTenant: (tenant) => set({ tenant }),

  logout: () => {
    clearAuthData();
    set({ user: null, tenant: null });
    window.location.href = '/login';
  },
}));
