// src/components/vendas/VendedorLeadBoard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { LeadColumn } from "@/components/leads/LeadColumn";
import { AgendarVisitaDrawer } from "@/components/cliente/actions/AgendarVisitaDrawer";
import type { LeadDTO } from "@/lib/types";
import { LeadStatus } from "@prisma/client";

const STATUSES = [
  "PRIMEIRO_CONTATO",
  "VISITA_AGENDADA",
  "PRE_ORCAMENTO",
  "ORCAMENTO_ENVIADO",
  "CONTRA_PROPOSTA",
  "FECHADO",
  "PERDIDO",
] as const;
type VendedorStatus = (typeof STATUSES)[number];

export function VendedorLeadBoard() {
  const user = useAuthStore((s) => s.user);

  const [leadsByStatus, setLeadsByStatus] = useState<
    Record<VendedorStatus, LeadDTO[]>
  >(() => {
    const init = {} as Record<VendedorStatus, LeadDTO[]>;
    STATUSES.forEach((s) => (init[s] = []));
    return init;
  });

  const [drawerLead, setDrawerLead] = useState<LeadDTO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    const updated = {} as Record<VendedorStatus, LeadDTO[]>;
    for (const status of STATUSES) {
      const res = await fetch(`/api/leads?status=${status}`);
      updated[status] = res.ok ? await res.json() : [];
    }
    setLeadsByStatus(updated);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSelectLead = useCallback((leadId: string) => {
    const all = Object.values(leadsByStatus).flat();
    const lead = all.find((l) => l.id === leadId);
    if (!lead) return;

    // Se for a primeira fase, abre o AgendarVisitaDrawer
    if (lead.status === "PRIMEIRO_CONTATO") {
      setDrawerLead(lead);
      setDrawerOpen(true);
    } else {
      // aqui você pode lidar com outros drawers, ex: editar informações do lead
    }
  }, [leadsByStatus]);

  const handleConvertLead = useCallback(
    async (leadId: string) => {
      if (!user?.id) {
        alert("Você precisa estar logado!");
        return;
      }
      // Exemplo: criar cliente e depois atualizar o status do lead...
      await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ /* dados do lead para criar cliente*/ }),
      });
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VISITA_AGENDADA" }),
      });

      await fetchLeads();
    },
    [user, fetchLeads]
  );

  return (
    <>
      <div className="flex gap-4 overflow-x-auto py-2">
        {STATUSES.map((status) => (
          <div key={status} className="flex-none w-60">
            <LeadColumn
              title={status.replace(/_/g, " ")}
              leads={leadsByStatus[status]}
              onSelect={handleSelectLead}
              onConvert={handleConvertLead}
            />
          </div>
        ))}
      </div>

  {/* Só monta o AgendarVisitaDrawer quando drawerLead existe */}
  {drawerLead && (
    <AgendarVisitaDrawer
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      clienteId={drawerLead.clienteId!}
      onAgendado={async () => {
        setDrawerOpen(false);
        setDrawerLead(null);
        await fetchLeads();
      }}
    />
  )}
</>
  );
}
