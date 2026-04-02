import type { Metadata } from 'next';
import { SettingsPage } from '@/components/settings/settings-page';

export const metadata: Metadata = { title: 'Configuración' };

export default function Settings() {
  return <SettingsPage />;
}
