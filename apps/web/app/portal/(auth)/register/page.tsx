import type { Metadata } from 'next';
import { PortalRegister } from '@/components/portal/portal-register';

export const metadata: Metadata = { title: 'Registrarse — Portal' };

export default function PortalRegisterPage() {
  return <PortalRegister />;
}
