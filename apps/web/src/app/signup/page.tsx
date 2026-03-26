import LandingHeader from '@/components/landing/LandingHeader'
import SignUpForm from '@/components/landing/SignUpForm'

export const metadata = {
  title: "Regístrate | Dialektoz",
  description: "Crea tu cuenta gratuita y empieza a aprender inglés hoy mismo.",
};

export default function SignUpPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans relative overflow-x-hidden">
      {/* Background ambient light for consistency */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[10%] w-[30%] h-[40%] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <LandingHeader />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10 min-h-[calc(100vh-96px)]">
        <div className="w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-700">
           <SignUpForm />
        </div>
      </main>
    </div>
  )
}
