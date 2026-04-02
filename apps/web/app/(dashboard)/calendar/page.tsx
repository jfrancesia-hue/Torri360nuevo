import type { Metadata } from 'next';
import { CalendarPage } from '@/components/calendar/calendar-page';

export const metadata: Metadata = { title: 'Calendario — Toori360' };

export default function Page() {
  return <CalendarPage />;
}
