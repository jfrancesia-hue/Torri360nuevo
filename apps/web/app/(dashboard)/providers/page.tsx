import type { Metadata } from 'next';
import { ProvidersPageContent } from '@/components/providers/providers-page';

export const metadata: Metadata = { title: 'Proveedores' };

export default function ProvidersPage() {
  return <ProvidersPageContent />;
}
