// src/store/useLeadsStore.ts
import { create } from "zustand";
import type { LeadsState, LeadDTO } from "@/lib/types";
import { LeadStatus } from "@prisma/client";

// Lista de todos os status suportados
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

export const useLeadsStore = create<LeadsState>((set, get) => ({
  // Inicializa o map de status com arrays vazios
  leadsByStatus: statuses.reduce((acc, status) => {
    acc[status] = [];
    return acc;
  }, {} as Record<LeadStatus, LeadDTO[]>),

  // Atualiza o inteiro map de leads por status
  setLeadsByStatus: (leadsByStatus) => {
    set({ leadsByStatus });
  },

  // Busca no backend e preenche o map completo
  fetchLeadsByStatus: async (filterStatus) => {
    try {
      // Opcional: permitir filtrar por um único status
      const query = filterStatus ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/leads${query}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LeadDTO[];

      // Agrupa por status
      const grouped = statuses.reduce((acc, status) => {
        acc[status] = [];
        return acc;
      }, {} as Record<LeadStatus, LeadDTO[]>);
      data.forEach((lead) => {
        if (grouped[lead.status]) {
          grouped[lead.status].push(lead);
        }
      });

      set({ leadsByStatus: grouped });
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      // Opcional: você pode ter um estado de erro/isLoading no store
    }
  },
}));
