"use client";

import { Menu } from "lucide-react";
import { NavLink } from "./NavButton";
import { UserDropdown } from "@/components/ui/UserDropdown";


interface Props {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: Props) {
  return (
    <header className="w-full h-[80px] bg-white dark:bg-black border-b shadow-sm flex items-center px-6">
      {/* Esquerda: menu e logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-muted-foreground hover:text-primary transition"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-xl font-bold text-primary">SorianCRM</span>
      </div>

      {/* Direita: avatar + navegação */}
      <div className="ml-auto flex items-center gap-4">
        <UserDropdown />
        <div className="hidden sm:flex gap-2">
          <NavLink href="/leads" label="Leads" />
          <NavLink href="/vendas" label="Vendas" />
          <NavLink href="/clientes" label="Clientes" />
          <NavLink href="/admin/calendario" label="Calendário" />
          <NavLink href="/visita" label="Visitas" /> {/* novo link */}
        </div>
      </div>
    </header>
  );
}
