import LandingHeader from '@/components/landing/LandingHeader';
import VerifyForm from './VerifyForm';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Verificar Certificado | Dialektoz',
  description: 'Comprueba la autenticidad de un certificado de Dialektoz por su código.',
};

export default function VerifyPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none" />
      <LandingHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center">
          <div className="size-16 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Verificar certificado</h1>
          <p className="text-foreground/60 mb-8">
            Ingresa el código que aparece en el certificado para confirmar que es auténtico.
          </p>

          <VerifyForm />

          <p className="text-xs text-foreground/40 mt-6">
            El código tiene un formato como <span className="font-mono font-semibold">DZ-A1-8F3A2B9C</span> y está impreso en el certificado.
          </p>
        </div>
      </main>
    </div>
  );
}
