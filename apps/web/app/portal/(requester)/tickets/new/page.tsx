import type { Metadata } from 'next';
import { PortalNewTicket } from '@/components/portal/portal-new-ticket';

export const metadata: Metadata = { title: 'Nueva solicitud — Portal' };

export default function PortalNewTicketPage() {
  return <PortalNewTicket />;
}
