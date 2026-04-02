import type { Metadata } from 'next';
import { PortalLogin } from '@/components/portal/portal-login';

export const metadata: Metadata = { title: 'Iniciar sesión — Portal' };

export default function PortalLoginPage() {
  return <PortalLogin />;
}
