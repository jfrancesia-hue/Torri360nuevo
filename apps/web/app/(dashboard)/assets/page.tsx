import type { Metadata } from 'next';
import { AssetsPage } from '@/components/assets/assets-page';

export const metadata: Metadata = { title: 'Activos' };

export default function AssetsRoute() {
  return <AssetsPage />;
}
