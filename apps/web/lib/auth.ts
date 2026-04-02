import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
}

export interface AuthTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logoUrl?: string | null;
  onboardingCompleted: boolean;
}

export interface AuthData {
  user: AuthUser;
  tenant: AuthTenant;
  accessToken: string;
  refreshToken: string;
}

export function setAuthData(data: AuthData) {
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('tenant', JSON.stringify(data.tenant));
}

export function clearAuthData() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  localStorage.removeItem('tenant');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredTenant(): AuthTenant | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('tenant');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTenant;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

export async function login(email: string, password: string): Promise<AuthData> {
  const response = await api.post<{ data: AuthData }>('/auth/login', { email, password });
  const authData = response.data;
  setAuthData(authData);
  return authData;
}

export async function register(data: {
  tenantName: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
}): Promise<AuthData> {
  const response = await api.post<{ data: AuthData }>('/auth/register', data);
  const authData = response.data;
  setAuthData(authData);
  return authData;
}

export function logout() {
  clearAuthData();
  window.location.href = '/login';
}
