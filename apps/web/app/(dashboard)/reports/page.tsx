import type { Metadata } from 'next';
import { ReportsPage } from '@/components/reports/reports-page';

export const metadata: Metadata = { title: 'Reportes — Toori360' };

export default function Page() {
  return <ReportsPage />;
}
