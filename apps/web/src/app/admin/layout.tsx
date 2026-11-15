import Sidebar from "@/components/layout/Sidebar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export const metadata = {
  title: "Admin | Dialektoz",
  description: "Panel de administración de Dialektoz",
};

// Same sidebar and mobile bar as the rest of the app: they already show the
// "Administración" group for the user's role. Access itself is enforced by the
// middleware and RLS, not by this menu.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full h-[100dvh] bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
