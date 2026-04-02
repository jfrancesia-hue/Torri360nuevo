import type { Metadata } from 'next';
import { PortalDashboard } from '@/components/portal/portal-dashboard';

export const metadata: Metadata = { title: 'Mis solicitudes — Toori360 Portal' };

export default function PortalTicketsPage() {
  return <PortalDashboard />;
}
