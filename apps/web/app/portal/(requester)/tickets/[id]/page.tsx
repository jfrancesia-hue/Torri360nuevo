import type { Metadata } from 'next';
import { PortalTicketDetail } from '@/components/portal/portal-ticket-detail';

export const metadata: Metadata = { title: 'Detalle de solicitud — Portal' };

export default function PortalTicketDetailPage({ params }: { params: { id: string } }) {
  return <PortalTicketDetail id={params.id} />;
}
