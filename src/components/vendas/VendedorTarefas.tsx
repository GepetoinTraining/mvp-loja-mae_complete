"use client";

import { useEffect, useState } from "react";
import { Lead as LeadDTO } from "@prisma/client";

export function VendedorTarefas() {
  const [tarefas, setTarefas] = useState<LeadDTO[]>([]);

  useEffect(() => {
    const fetchTarefas = async () => {
      const res = await fetch("/api/leads?status=SEM_RESPOSTA&vendedor=MEU_ID");
      if (res.ok) {
        const data = await res.json();
        setTarefas(data);
      }
    };

    fetchTarefas();
  }, []);

  return (
    <section className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-primary mb-4">Tarefas Pendentes</h2>

      {tarefas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
      ) : (
        <ul className="space-y-2">
          {tarefas.map((lead) => (
            <li key={lead.id} className="text-sm">
              <span className="font-medium text-primary">{lead.nome}</span>{" "}
              está sem resposta.
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
