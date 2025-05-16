// src/components/leads/Sidebar.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AgendarVisitaDrawer } from "@/components/cliente/actions/AgendarVisitaDrawer";

interface Props {
  clienteId?: string;
  onCreateLead: () => void;
}

export function Sidebar({ clienteId, onCreateLead }: Props) {
  const [abrirDrawer, setAbrirDrawer] = useState(false);
  const pathname = usePathname();
  const isClienteView = !!clienteId && pathname?.startsWith("/clientes/");

  return (
    <>
      <button
        onClick={onCreateLead}
        className="mb-4 w-full bg-primary text-primary-foreground py-2 rounded"
      >
        Novo Lead
      </button>

      {isClienteView && (
        <button
          onClick={() => setAbrirDrawer(true)}
          className="mb-4 w-full bg-secondary text-secondary-foreground py-2 rounded"
        >
          Agendar Visita
        </button>
      )}

      {clienteId && (
        <AgendarVisitaDrawer
          open={abrirDrawer}
          onClose={() => setAbrirDrawer(false)}
          clienteId={clienteId}
        />
      )}
    </>
  );
}
