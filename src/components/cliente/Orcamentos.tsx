"use client";

import type { ClienteDTO, OrcamentoDTO } from "@/lib/types";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

interface Props {
  cliente: ClienteDTO & { orcamentos: OrcamentoDTO[] };
}

export function ClienteOrcamentos({ cliente }: Props) {
  return (
    <section className="bg-white rounded-lg shadow p-4 space-y-4">
      <h2 className="text-lg font-semibold text-primary">Orçamentos</h2>

      {cliente.orcamentos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum orçamento registrado.</p>
      ) : (
        <ul className="space-y-3">
          {cliente.orcamentos.map((orcamento) => (
            <li
              key={orcamento.id}
              className="border rounded p-3 text-sm flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-primary">#{orcamento.id.slice(0, 8)}</p>
                <p className="text-muted-foreground text-xs">
                  Criado em{" "}
                  {dayjs(orcamento.createdAt).format("DD/MM/YYYY")}
                </p>
                <p className="text-xs">Status: <strong>{orcamento.status}</strong></p>
              </div>

              <button
                onClick={() => {
                  alert("🔍 Em breve: abrir orçamento completo");
                  // Ex: router.push(`/orcamentos/${orcamento.id}`)
                }}
                className="text-sm bg-muted px-3 py-1 rounded hover:bg-muted-foreground/10"
              >
                Ver
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

