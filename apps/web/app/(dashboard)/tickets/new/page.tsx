import type { Metadata } from 'next';
import { NewTicketForm } from '@/components/tickets/new-ticket-form';

export const metadata: Metadata = { title: 'Nuevo ticket' };

export default function NewTicketPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nuevo ticket</h1>
        <p className="text-muted-foreground mt-1">Completá los datos del incidente o solicitud</p>
      </div>
      <NewTicketForm />
    </div>
  );
}
