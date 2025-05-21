"use client";

import { useState } from "react";
import type {
  ClienteDTO,
  LeadDTO,
  VisitaDTO,
  OrcamentoDTO,
  FollowUpDTO
} from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { ClientTabs } from "./Tabs";
import { ClientSummaryCard } from "./Header";


interface ClienteDashboardProps {
  cliente: ClienteDTO;
  onSave: (updates: Partial<ClienteDTO>) => Promise<void>;
}

export function ClienteDashboard({ cliente, onSave }: ClienteDashboardProps) {
  const [localCliente, setLocalCliente] = useState<ClienteDTO>(cliente);
  const user = useAuthStore((s) => s.user);

  const handleSave = async () => {
    if (!user?.id) {
      alert("Usuário não autenticado");
      return;
    }

    try {
      await onSave(localCliente);
      alert("Cliente atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar cliente");
    }
  };

  return (
    <div className="space-y-4">
      <ClientSummaryCard cliente={localCliente} />
      <ClientTabs
    cliente={cliente}
    visitas={cliente.visitas}
    orcamentos={cliente.orcamentos}
    leads={cliente.leads}
    onSave={async (updates) => {
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      return res.json();
    }}
  />
      <div className="flex justify-end">
        <Button onClick={handleSave}>Salvar Alterações</Button>
      </div>
    </div>
  );
}
