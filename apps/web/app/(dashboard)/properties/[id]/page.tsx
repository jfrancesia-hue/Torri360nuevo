import type { Metadata } from 'next';
import { PropertyDetail } from '@/components/properties/property-detail';

export const metadata: Metadata = { title: 'Detalle de propiedad' };

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  return <PropertyDetail id={params.id} />;
}
