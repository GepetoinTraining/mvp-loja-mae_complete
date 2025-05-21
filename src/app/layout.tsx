"use client";

import "./theme.css";
import { Providers } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toater";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground">
        <Providers>
          <SessionProvider>
            {children}
            <Toaster />
          </SessionProvider>
        </Providers>
      </body>
    </html>
  );
}
