import { getCurrentProfile } from "@/utils/supabase/session";
import MobileBottomNavClient from "./MobileBottomNavClient";

/**
 * Server wrapper (same import path for every page): reads the role from the
 * request-cached profile, so it costs no extra round trip, and hands it to the
 * client bar that decides which tabs to show.
 */
export default async function MobileBottomNav() {
  const profile = await getCurrentProfile();
  return <MobileBottomNavClient role={profile?.role ?? 'free'} />;
}
