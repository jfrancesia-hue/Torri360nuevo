import type { Metadata } from 'next';
import { OnboardingWizard } from '@/components/portal/onboarding-wizard';

export const metadata: Metadata = { title: 'Bienvenido — Toori360' };

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
