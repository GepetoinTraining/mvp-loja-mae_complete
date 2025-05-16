// src/components/layout/AppLayout.tsx
"use client";

import "@/app/theme.css"; // garante que o CSS rodou mesmo vindo de components
import { ReactNode, useState } from "react";
import { Header } from "@/components/ui/Header";
import { Sidebar } from "@/components/leads/Sidebar";
import { LeadDrawer } from "@/components/leads/LeadDrawer";

interface AppLayoutProps {
  children: ReactNode;
  clienteId?: string;
}

export function AppLayout({ children, clienteId }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-64 p-4 bg-popover border-r border-border">
            <Sidebar
              clienteId={clienteId}
              onCreateLead={() => setDrawerOpen(true)}
            />
          </aside>
        )}
        <main className="flex-1 overflow-y-auto">
          <div className="space-y-8 py-6">
            {children}
          </div>
        </main>
      </div>
      <LeadDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
