import { Navigation } from "@/app/ui/navigation";
import { AuthGate } from "@/app/ui/gates";

/** Каркас защищённой части приложения: боковая навигация + контент. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthGate>
      <div className="flex h-screen overflow-y-auto">
        <Navigation />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthGate>
  );
}
