import LandingHeader from '@/components/landing/LandingHeader'
import SignUpForm from '@/components/landing/SignUpForm'

export const metadata = {
  title: "Dialektoz | Aprende Inglés Real",
  description: "La plataforma inmersiva para dominar el inglés conversacional y avanzado.",
};

export default function LandingPage() {
  return (
    <div className="w-full min-h-[100dvh] bg-background text-foreground flex flex-col font-sans relative overflow-x-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-[10%] w-[30%] h-[40%] bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      <LandingHeader />
      
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-0 gap-12 lg:gap-8 z-10 min-h-[calc(100vh-80px)]">
        
        {/* Left Side: Copywriting */}
        <section className="flex-1 text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 max-w-2xl">
          <div className="inline-block bg-primary/10 border border-primary/20 text-primary font-bold px-4 py-1.5 rounded-full text-sm mb-2">
            Nueva Plataforma de Aprendizaje
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Domina el inglés. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Sin excusas.
            </span>
          </h1>
          <p className="text-xl text-foreground/70 mx-auto lg:mx-0 leading-relaxed">
            Aprende a tu propio ritmo con la metodología inmersiva de Dialektoz. Casos reales, progreso medible y acceso de por vida a tu nueva fluidez nativa.
          </p>
        </section>

        {/* Right Side: Sign Up Form */}
        <section className="w-full max-w-md shrink-0 animate-in fade-in slide-in-from-right-12 duration-1000 delay-150 relative">
           {/* Decorative ring around form */}
           <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20"></div>
           <SignUpForm />
        </section>

      </main>
    </div>
  )
}
