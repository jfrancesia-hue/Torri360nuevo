import type { Metadata } from 'next';
import { PortalDashboard } from '@/components/portal/portal-dashboard';

export const metadata: Metadata = { title: 'Mis solicitudes — Portal' };

export default function PortalDashboardPage() {
  return <PortalDashboard />;
}
