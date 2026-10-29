import { GuestOnlyGate } from "@/app/ui/gates";

/** Каркас экранов входа и регистрации (только для гостей). */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <GuestOnlyGate>{children}</GuestOnlyGate>;
}
