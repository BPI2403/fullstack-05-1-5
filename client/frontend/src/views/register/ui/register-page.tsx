import Link from "next/link";
import { Wallet } from "lucide-react";
import { RegisterForm } from "@/features/auth/ui/register-form";

/** Экран регистрации (только для гостей — контролирует GuestOnlyGate). */
export function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <Link href="/register" className="flex items-center gap-2 text-2xl font-bold">
        <Wallet className="h-7 w-7 text-primary" />
        Финансист
      </Link>
      <RegisterForm />
    </div>
  );
}
