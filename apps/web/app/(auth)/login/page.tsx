import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl mb-4">
          T
        </div>
        <h1 className="text-2xl font-bold text-foreground">Toori360</h1>
        <p className="text-muted-foreground mt-1">Ingresá a tu cuenta</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿No tenés cuenta?{' '}
        <a href="/register" className="text-primary hover:underline font-medium">
          Registrá tu empresa
        </a>
      </p>
    </div>
  );
}
