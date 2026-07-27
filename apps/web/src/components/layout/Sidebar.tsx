import { getCurrentProfile } from "@/utils/supabase/session";
import SidebarClient from "./SidebarClient";

/**
 * Server wrapper: fetches the profile once (deduped via React cache) and
 * hands the name/role to the interactive client sidebar. This removes the
 * two client-side round trips (and the name/role flash) that the old
 * client-only sidebar made on every navigation.
 */
export default async function Sidebar() {
  const profile = await getCurrentProfile();
  return <SidebarClient name={profile?.name ?? 'Estudiante'} role={profile?.role ?? 'free'} />;
}
