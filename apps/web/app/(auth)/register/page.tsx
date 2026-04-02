import type { Metadata } from 'next';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Registrar empresa' };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-xl mb-4">
          T
        </div>
        <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
        <p className="text-muted-foreground mt-1">Registrá tu empresa en Toori360</p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        ¿Ya tenés cuenta?{' '}
        <a href="/login" className="text-primary hover:underline font-medium">
          Iniciar sesión
        </a>
      </p>
    </div>
  );
}
