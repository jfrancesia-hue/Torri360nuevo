import type { Metadata } from 'next';
import { ProviderDetail } from '@/components/providers/provider-detail';

export const metadata: Metadata = { title: 'Detalle de proveedor' };

export default function ProviderDetailPage({ params }: { params: { id: string } }) {
  return <ProviderDetail id={params.id} />;
}
