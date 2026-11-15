import { getCurrentStreak } from "@/utils/supabase/session";
import MobileHeaderClient from "./MobileHeaderClient";

/**
 * Server wrapper (same import path for every page): reads the user's real
 * streak (request-cached) and hands it to the client header.
 */
export default async function MobileHeader() {
  const streak = await getCurrentStreak();
  return <MobileHeaderClient streak={streak} />;
}
