import type { Metadata } from 'next';
import { PropertiesPage } from '@/components/properties/properties-page';

export const metadata: Metadata = { title: 'Propiedades' };

export default function Properties() {
  return <PropertiesPage />;
}
