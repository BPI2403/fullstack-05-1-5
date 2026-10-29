import Link from "next/link";
import { Wallet } from "lucide-react";
import { LoginForm } from "@/features/auth/ui/login-form";

/** Экран входа (только для гостей — контролирует GuestOnlyGate). */
export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Link href="/login" className="flex items-center gap-2 text-2xl font-bold">
        <Wallet className="h-7 w-7 text-primary" />
        Финансист
      </Link>
      <LoginForm />
    </div>
  );
}
