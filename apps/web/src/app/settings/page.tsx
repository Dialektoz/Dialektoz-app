import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { createClient } from '@/utils/supabase/server';
import SettingsForm from '@/components/settings/SettingsForm';
import type { ProfileValues } from '@/components/settings/SettingsForm';

export const metadata = {
  title: 'Configuración | Dialektoz',
  description: 'Ajusta tu perfil, privacidad y preferencias',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, display_name, avatar_url, timezone, leaderboard_opt_in, email, role')
    .eq('id', user.id)
    .single();

  const initial: ProfileValues = {
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    phone: profile?.phone ?? '',
    display_name: profile?.display_name ?? '',
    avatar_url: profile?.avatar_url ?? null,
    timezone: profile?.timezone ?? 'America/Bogota',
    leaderboard_opt_in: profile?.leaderboard_opt_in ?? true,
  };

  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-10 pb-20 md:pb-6 border-x border-border/50 custom-scrollbar relative">
        <MobileHeader />
        <TopNavigation />

        <div className="w-full max-w-3xl mx-auto py-2">
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              Configu<span className="text-primary">ración</span>
            </h1>
            <p className="text-foreground/60">
              {profile?.email ? `Sesión iniciada como ${profile.email}` : 'Ajusta tu perfil y preferencias'}
            </p>
          </header>

          <SettingsForm initial={initial} />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
