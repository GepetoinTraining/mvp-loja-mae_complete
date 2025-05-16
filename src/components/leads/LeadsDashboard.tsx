// src/components/leads/LeadsDashboard.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { LeadColumn } from "@/components/leads/LeadColumn";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { useLeadsStore } from "@/store/useLeadsStore";
import { LeadStatus } from "@prisma/client";
import type { LeadDTO } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { OfflineItem } from "@/utils/offline-utils";
import { toast } from "sonner";

const statuses: LeadStatus[] = [
  "SEM_DONO",
  "PRIMEIRO_CONTATO",
  "VISITA_AGENDADA",
  "PRE_ORCAMENTO",
  "ORCAMENTO_ENVIADO",
  "CONTRA_PROPOSTA",
  "SEM_RESPOSTA",
  "FECHADO",
  "PERDIDO",
];

export function LeadsDashboard() {
  const user = useAuthStore((s) => s.user);
  const { leadsByStatus, setLeadsByStatus, fetchLeadsByStatus: onlineFetchLeads } = useLeadsStore();
  const [isOnline, setIsOnline] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadDTO | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [offlineNotes, setOfflineNotes] = useState<OfflineItem[]>([]);


  const handleConvertLead = async (leadId: string) => {
    if (!user?.id) {
      alert("Você precisa estar logado!");
      return;
    }

    // 1) encontra o lead original
    const allLeads = statuses.flatMap((st) => leadsByStatus[st] || []);
    const lead = allLeads.find((l) => l.id === leadId);
    if (!lead) {
      alert("Lead não encontrado");
      return;
    }

    // 2) cria cliente se ainda não existir
    let clienteId = lead.clienteId;
    if (!clienteId) {
      const resCli = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:     lead.nome,
          telefone: lead.telefone,
          email:    lead.email,
          tipo:     "NORMAL",
        }),
      });
      if (!resCli.ok) {
        alert("Erro ao criar cliente");
        return;
      }
      const novoCli = await resCli.json();
      clienteId = novoCli.id;
    }

    // 3) atualiza o lead no backend
    const resLead = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId,
        vendedorId: user.id,
        status:     "PRIMEIRO_CONTATO" as LeadStatus,
      }),
    });
    if (!resLead.ok) {
      alert("Erro ao atualizar lead");
      return;
    }
    const leadAtualizado: LeadDTO = await resLead.json();

    // 4) atualiza store e abre o drawer com o lead atualizado
    await fetchLeadsByStatus();
    setSelectedLead(leadAtualizado);
    setDrawerOpen(true);
  };

  // Apenas seleciona um lead (já convertido) e abre o drawer
  const handleSelectLead = (leadId: string) => {
    const allLeads = statuses.flatMap((st) => leadsByStatus[st] || []);
    const lead = allLeads.find((l) => l.id === leadId) || null;
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  return (
    <>
      <div className="p-2 bg-yellow-100 border-b border-yellow-300 text-yellow-700 text-sm">
        {isOnline
          ? "Conectado (Online)"
          : "Desconectado (Offline) - Dados podem não estar atualizados."}
      </div>

      {/* Scroll horizontal para colunas de status */}
      <div className="overflow-x-auto">
        <div className="inline-grid grid-flow-col auto-cols-min gap-4">
          {statuses.map((status) => (
            <LeadColumn
              key={status}
              title={status.replace(/_/g, " ")}
              leads={leadsByStatus[status] || []}
              onSelect={handleSelectLead}
              onConvert={handleConvertLead}
              isOnline={isOnline}
            />
          ))}
        </div>
      </div>

      <LeadDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedLead={selectedLead}
        onConvertLead={handleConvertLead}
        isOnline={isOnline}
      />

      <button
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg z-20 hover:bg-primary/90"
        onClick={() => {
          if (!isOnline) {
            toast.error("Criação de novos leads indisponível offline.");
            return;
          }
          setSelectedLead(null);
          setDrawerOpen(true);
        }}
        title={
          isOnline
            ? "Criar Novo Lead"
            : "Criação de leads indisponível offline"
        }
        aria-label="Criar Novo Lead"
      >
        +
      </button>
    </>
  );
}