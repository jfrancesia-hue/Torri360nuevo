import type { Metadata } from 'next';
import { TicketDetail } from '@/components/tickets/ticket-detail';

export const metadata: Metadata = { title: 'Detalle del ticket' };

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return <TicketDetail id={params.id} />;
}
