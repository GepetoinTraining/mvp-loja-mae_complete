// src/components/vendas/VendasDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { ClienteDTO } from "@/lib/types";
import { VendedorCalendar } from "./VendedorCalendar";
import { DayAgenda } from "@/components/shared/DayAgenda";
import { VendedorStats } from "./VendedorStats";
import { VendedorLeadBoard } from "./VendedorLeadBoard";
import { ClienteList } from "@/components/clientes/ClientesList";

export function VendasDashboard() {
  const [clientes, setClientes] = useState<ClienteDTO[]>([]);
  const clientesComVisita = clientes.filter(c => (c.visitas?.length ?? 0) > 0);

  useEffect(() => {
    async function loadClientes() {
      try {
        const res = await fetch("/api/clientes");
        if (!res.ok) throw new Error("Falha ao carregar clientes");
        const data: ClienteDTO[] = await res.json();
        setClientes(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadClientes();
  }, []);

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/50">
      {/* PRIMEIRA ROW: 2/3 calendar+agenda | 1/3 stats */}
      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
        {/* Coluna esquerda (66%): sub-grid com calendar + agenda */}
        <div className="grid grid-cols-2 gap-4">
          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-primary">
              Minha Agenda (Visão Mensal)
            </h2>
            <VendedorCalendar />
          </section>
          <section className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-primary">
              Visitas de Hoje
            </h2>
            <DayAgenda />
          </section>
        </div>

        {/* Coluna direita (33%): estatísticas */}
        <section className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2 text-primary">
            Estatísticas
          </h2>
          <VendedorStats />
        </section>
      </div>

      {/* B1: Quadro de Leads */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-primary">
          Meus Leads
        </h2>
        <VendedorLeadBoard />
      </section>

      {/* B2: Lista de Clientes */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-primary">
          Meus Clientes
        </h2>
        <ClienteList clientes={clientesComVisita} />
      </section>
    </main>
  );
}
