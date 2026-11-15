import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { getCurrentUser } from '@/utils/supabase/session';
import TopNavigation from '@/components/layout/TopNavigation';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { createClient } from '@/utils/supabase/server';
import SettingsForm from '@/components/settings/SettingsForm';
import PasswordSection from '@/components/settings/PasswordSection';
import EmailSection from '@/components/settings/EmailSection';
import DataExportSection from '@/components/settings/DataExportSection';
import SessionSection from '@/components/settings/SessionSection';
import DeleteAccountSection from '@/components/settings/DeleteAccountSection';
import { Card } from '@/components/settings/ui';
import type { ProfileValues } from '@/components/settings/SettingsForm';

export const metadata = {
  title: 'Configuración | Dialektoz',
  description: 'Ajusta tu perfil, privacidad y preferencias',
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email: emailFlag } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, display_name, avatar_url, timezone, leaderboard_opt_in, email, role')
    .eq('id', user.id)
    .single();

  // Accounts created with Google/Facebook/Apple have no password identity.
  const hasPassword = (user.identities ?? []).some((i) => i.provider === 'email');
  const provider = (user.app_metadata?.provider as string | undefined) ?? null;

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

          {emailFlag === 'updated' && (
            <p className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-semibold text-green-600">
              Tu correo se actualizó correctamente.
            </p>
          )}
          {emailFlag === 'pending' && (
            <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-600">
              Confirmaste desde tu correo actual. Falta abrir el enlace que enviamos a tu nuevo correo para terminar el cambio.
            </p>
          )}

          <SettingsForm initial={initial} />

          <div className="space-y-5 pb-8">
            <EmailSection
              currentEmail={user.email ?? profile?.email ?? null}
              pendingEmail={user.new_email ?? null}
              hasPassword={hasPassword}
              provider={provider}
              defaultOpen={emailFlag !== undefined || !!user.new_email}
            />
            <PasswordSection email={user.email ?? profile?.email ?? null} hasPassword={hasPassword} />
            <Card title="Tus datos y sesión">
              <div className="space-y-5">
                <DataExportSection />
                <SessionSection />
              </div>
            </Card>
            <DeleteAccountSection hasPassword={hasPassword} isSuperadmin={profile?.role === 'superadmin'} />
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
