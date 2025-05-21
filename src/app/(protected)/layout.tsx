// app/(protected)/layout.tsx
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import "@/app/globals.css";

// 1) importe seu layout de componentes
import { AppLayout } from "@/components/layout/AppLayout";
// 2) importe o helper de autenticação e o provider
import type { AuthPayload } from "@/lib/types";
import { getUserFromToken } from "@/lib/auth";
import { UserProvider } from "@/store/UserProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 3) pegue o usuário no servidor
  const user: AuthPayload | null = await getUserFromToken();

  console.log("SSR user:", user)

  return <AppLayout>
          <UserProvider initialUser={user}>{children}</UserProvider>
        </AppLayout>
}
