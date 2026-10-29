import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "./ui/navigation";
import { AppProviders } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Финансист",
  description: "Личный финансовый учёт: доходы, расходы, бюджеты и отчёты",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <AppProviders>
          <div className="flex h-screen overflow-y-auto">
            <Navigation />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
